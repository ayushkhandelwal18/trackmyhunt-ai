// Shared dashboard-token retrieval used by the background worker and the
// popup. Token flow (website → extension):
//   1. chrome.storage.local (synced copy, fastest path)
//   2. content-script listener on open dashboard tabs (GET_TRACKMYHUNT_TOKEN)
//   3. one-shot scripting injection into an open dashboard tab — covers tabs
//      that were already open before the extension was loaded/reloaded, where
//      content scripts were never injected.
//
// All three read the website's own localStorage JWT; the extension never
// invents credentials. Returns the token string or null.

function frontendOrigins() {
  const configured = (import.meta.env.VITE_BASE_FRONTEND_URL || '').replace(/\/$/, '');
  return [
    'http://localhost:',
    'http://127.0.0.1:',
    configured,
    'https://trackmyhunt.vercel.app',
  ].filter(Boolean);
}

export function isDashboardUrl(url) {
  if (!url) return false;
  return frontendOrigins().some((origin) => url.startsWith(origin));
}

// Runs inside the tab to read the website session. Executed either by the
// long-lived content script or as a one-shot injected function; both run in
// a context that shares the page's localStorage partition.
export function readPageToken() {
  try {
    return window.localStorage.getItem('token');
  } catch {

  }
}

function sendTokenRequest(tabId) {
  return new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, { action: 'GET_TRACKMYHUNT_TOKEN' }, (response) => {
        void chrome.runtime.lastError;
        resolve(response?.token || null);
      });
    } catch {
      resolve(null);
    }
  });
}

async function injectTokenRequest(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: readPageToken,
    });
    return (results && results[0] && results[0].result) || null;
  } catch {

  }
}

export async function fetchDashboardToken(tab) {
  const viaListener = await sendTokenRequest(tab.id);
  if (viaListener) return viaListener;
  // No listener (tab predates extension load/reload): inject once on demand.
  return injectTokenRequest(tab.id);
}

export async function getTokenFromDashboardTabs() {
  let tabs = [];
  try {
    tabs = await chrome.tabs.query({});
  } catch {

  }
  const dashboardTabs = (tabs || []).filter((tab) => isDashboardUrl(tab.url));
  for (const tab of dashboardTabs) {
    const token = await fetchDashboardToken(tab);
    if (token) {
      try {
        chrome.storage.local.set({ token });
      } catch {
        // Storage unavailable; still return the token for this call.
      }
      return token;
    }
  }
  return null;
}
