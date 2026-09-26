// TrackMyHunt background service worker (MV3).
//
// Responsibilities:
// 1. Hold the user's JWT in chrome.storage.local (synced from dashboard tabs).
// 2. POST scraped jobs to POST /api/applications with `Authorization: Bearer`.
// 3. Notify open dashboard tabs after a successful save.
//
// No in-memory session state is kept: every handler re-reads chrome.storage,
// so a Chrome-initiated service-worker restart loses nothing.

import { getTokenFromDashboardTabs, isDashboardUrl } from '../shared/tokenSync.js';
import { detectPlatform } from '../content/extract/detectPlatform.js';

// Open the side panel when the toolbar action is clicked. Called on every
// service-worker start (install, browser startup, worker restart) because
// the worker cannot rely on in-memory state.
function enablePanelOnActionClick() {
  try {
    if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
    }
  } catch {
    // sidePanel API unavailable; the action simply does nothing.
  }
}

enablePanelOnActionClick();

if (chrome.runtime && chrome.runtime.onInstalled) {
  chrome.runtime.onInstalled.addListener(() => {
    enablePanelOnActionClick();
  });
}

if (chrome.runtime && chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    enablePanelOnActionClick();
  });
}

// Temporary per-tab extraction cache: tabId -> { url, data, platform, at }.
// Memory-only (dies with the worker restart, which is safe: entries are
// re-scraped on demand). Lets the panel paint instantly on open, then confirm
// with a fresh scrape. Invalidated on navigation/content change.
const jobCache = new Map();
const JOB_CACHE_TTL_MS = 5 * 60 * 1000;

function getCachedJob(tabId, url) {
  const entry = jobCache.get(tabId);
  if (!entry) return null;
  if (entry.url !== url || Date.now() - entry.at > JOB_CACHE_TTL_MS) {
    jobCache.delete(tabId);
    return null;
  }
  return entry;
}

// The side panel stays mounted while the user browses, so tell it when the
// active tab changes or navigates (covers SPA navigation without reload).
// The panel debounces and re-scrapes; no extraction happens here.
let tabChangeTimer = null;
function notifyPanelTabChanged() {
  if (tabChangeTimer) return;
  tabChangeTimer = setTimeout(() => {
    tabChangeTimer = null;
    chrome.runtime.sendMessage({ action: 'TAB_CHANGED' }).catch(() => {
      // No listener (panel closed): nothing to do.
    });
  }, 600);
}

// Contextual side-panel behavior (Chrome 141+: chrome.sidePanel.close).
// When the user moves to a tab with no job context, close our panel instead
// of leaving it fixed over unrelated work. Job-ish tabs keep the existing
// notify-and-rescan path. Feature-detected: older Chrome simply keeps the
// panel open (no workaround hacks). The panel always remains available via
// the toolbar action.
function maybeClosePanelForTab(tab) {
  try {
    if (!tab || typeof tab.windowId !== 'number') return false;
    if (!chrome.sidePanel || typeof chrome.sidePanel.close !== 'function') return false;
    if (detectPlatform(tab.url) !== 'generic') return false;
    chrome.sidePanel.close({ windowId: tab.windowId }).catch(() => {
      // Panel already closed or close unsupported here: nothing to do.
    });
    return true;
  } catch {
    return false;
  }
}

if (chrome.tabs && chrome.tabs.onActivated) {
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (maybeClosePanelForTab(tab)) return;
    } catch {
      // Tab unreadable: fall through to the normal rescan path.
    }
    notifyPanelTabChanged();
  });
}

if (chrome.tabs && chrome.tabs.onUpdated) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!tab || tab.active !== true) return;
    if (changeInfo.url || changeInfo.status === 'complete') {
      if (maybeClosePanelForTab(tab)) return;
      notifyPanelTabChanged();
    }
  });
}

function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['token'], (result) => {
      resolve(result.token || null);
    });
  });
}

function notifyDashboardTabs() {
  try {
    chrome.tabs.query({}, (tabs) => {
      if (chrome.runtime.lastError) return;
      (tabs || []).forEach((tab) => {
        if (isDashboardUrl(tab.url)) {
          try {
            chrome.tabs.sendMessage(tab.id, { action: 'JOB_SAVED' }, () => {
              void chrome.runtime.lastError;
            });
          } catch {
            // Tab may have closed; safe to ignore.
          }
        }
      });
    });
  } catch {
    // Query API unavailable; notification is best-effort only.
}
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Content script reports a meaningful page change: drop the stale cache
  // entry and let the panel rescan.
  if (request.action === 'JOB_CHANGED') {
    const tabId = sender && sender.tab && sender.tab.id;
    if (tabId !== undefined && tabId !== null) {
      const entry = jobCache.get(tabId);
      if (!entry || entry.url !== (request.url || '')) {
        jobCache.delete(tabId);
        notifyPanelTabChanged();
      }
    }
    return false;
  }

  // Panel stores its latest successful scrape for instant paint on reopen.
  if (request.action === 'CACHE_JOB') {
    if (request.tabId !== undefined && request.url && request.data) {
      if (jobCache.size > 50) jobCache.clear();
      jobCache.set(request.tabId, {
        url: request.url,
        data: request.data,
        platform: request.platform || 'generic',
        at: Date.now(),
      });
    }
    return false;
  }

  // Panel reads the cached scrape; served only on exact URL match + TTL.
  if (request.action === 'GET_CACHED_JOB') {
    sendResponse({ entry: getCachedJob(request.tabId, request.url) });
    return false;
  }

  if (request.action === 'save_job') {
    (async () => {
      const token = request.authToken || await getToken() || await getTokenFromDashboardTabs();

      if (!token) {
        sendResponse({ success: false, error: 'Not authenticated. Please log in on the dashboard first.' });
        return;
      }

      // Use the same backend URL as the web app when the extension is built
      // with VITE_BASE_BACKEND_URL, while retaining local development fallbacks.
      const configuredBackend = (import.meta.env.VITE_BASE_BACKEND_URL || '').replace(/\/$/, '');
      const endpoints = [
        configuredBackend ? `${configuredBackend}/api/applications` : null,
        'http://localhost:5000/api/applications',
        'http://127.0.0.1:5000/api/applications',
        'http://localhost:3000/api/applications',
        'http://127.0.0.1:3000/api/applications'
      ].filter((endpoint, index, all) => endpoint && all.indexOf(endpoint) === index);

      let lastError = null;
      let duplicate = false;
      let savedSuccessfully = false;
      let responseData = null;

      for (const endpoint of endpoints) {
        let response;
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(request.data)
          });
        } catch {
          // Network error (backend down / unreachable): try the next endpoint.
          lastError = 'Unable to connect to the TrackMyHunt backend.';
          continue;
        }

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          savedSuccessfully = true;
          responseData = data;
          break;
        }

        if (response.status === 401) {
          // Token rejected by the primary backend: clear the stale copy so
          // the popup falls back to the login state instead of retrying a
          // dead token. (Fallback endpoints don't clear: their user DB may
          // simply differ in local development.)
          if (endpoint === endpoints[0]) {
            chrome.storage.local.remove('token');
          }
          lastError = 'Your TrackMyHunt session has expired. Please log in again.';
          break;
        }

        // 4xx (validation, duplicate, forbidden): retrying another endpoint
        // cannot succeed and risks a double submission. Stop here.
        lastError = data.message || data.error || `Server error (${response.status})`;
        duplicate = response.status === 409 || Boolean(data.duplicate);
        break;
      }

      if (savedSuccessfully) {
        notifyDashboardTabs();
        sendResponse({ success: true, data: responseData });
      } else {
        sendResponse({
          success: false,
          error: lastError || 'Unable to connect to the TrackMyHunt backend.',
          duplicate
        });
      }
    })();
    return true; // Keep message channel open for async response
  }
});
