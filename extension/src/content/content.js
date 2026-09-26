// Content script: layered job extraction + change observation.
//
// - `scrape_job` (from side panel): runs the full pipeline on the live DOM.
// - MutationObserver (debounced, structural only) + URL watcher: pushes
//   lightweight JOB_CHANGED notifications when the job view meaningfully
//   changes (SPA navigation, newly rendered detail panels). No full-DOM
//   rescans, no polling loops, no API calls from here.

import { extractJob, PLATFORM_LABELS } from './extract/pipeline.js';

function snapshotSignature() {
  try {
    const h1 = document.querySelector('h1');
    const title = document.title || '';
    const h1Text = h1 && h1.textContent ? h1.textContent.trim().slice(0, 120) : '';
    return `${window.location.href.split('#')[0]}|${title}|${h1Text}`;
  } catch {
    return window.location.href;
  }
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrape_job') {
      try {
        const { platform, data } = extractJob();
        sendResponse({
          success: true,
          data,
          platform,
          platformLabel: PLATFORM_LABELS[platform] || platform,
        });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    }
    if (request.action === 'ping') {
      // Lightweight presence check: proves the script is injected.
      sendResponse({ present: true, url: window.location.href });
    }
    return true; // Keep the message channel open for async response
  });

  // Observe meaningful changes: URL swaps (SPA) or a changed h1/title.
  // Debounced and signature-gated so idle pages cost nothing.
  let lastSignature = snapshotSignature();
  let debounceTimer = null;

  function notifyChanged() {
    try {
      chrome.runtime.sendMessage({ action: 'JOB_CHANGED', url: window.location.href });
    } catch {
      // Background unreachable (worker restarting); the panel rescrapes anyway.
    }
  }

  function scheduleCheck() {
    if (debounceTimer) return;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      try {
        const next = snapshotSignature();
        if (next !== lastSignature) {
          lastSignature = next;
          notifyChanged();
        }
      } catch { /* ignore */ }
    }, 1200);
  }

  try {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          scheduleCheck();
          return;
        }
        if (mutation.type === 'attributes') {
          scheduleCheck();
          return;
        }
      }
    });
    if (document.documentElement) {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'id'],
      });
    }
  } catch { /* observer unsupported: on-demand scrape still works */ }

  // SPA pushState/replaceState do not reload the document: patch once so
  // in-page job switches are noticed without polling.
  try {
    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;
    window.history.pushState = function pushState(...args) {
      const result = originalPush.apply(this, args);
      scheduleCheck();
      return result;
    };
    window.history.replaceState = function replaceState(...args) {
      const result = originalReplace.apply(this, args);
      scheduleCheck();
      return result;
    };
    window.addEventListener('popstate', scheduleCheck);
  } catch { /* ignore */ }
}
