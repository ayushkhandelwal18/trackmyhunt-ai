// This content script runs on TrackMyHunt pages to keep the extension's
// chrome.storage token in sync with the web app's localStorage JWT:
// - present  -> copy into extension storage (login / session alive)
// - absent twice in a row -> remove the extension copy (logout / expiry)
//
// The miss counter avoids clearing a valid token during the brief window
// between page load and login. Polling is cheap (one storage read) and the
// script only runs on TrackMyHunt origins.

(function syncTrackMyHuntToken() {
  var misses = 0;

  function readLocalToken() {
    try {
      return window.localStorage.getItem('token');
    } catch {
      return null;
    }
  }

  function syncOnce() {
    var token = readLocalToken();
    try {
      if (token) {
        misses = 0;
        chrome.storage.local.set({ token: token });
      } else {
        misses += 1;
        if (misses >= 2) {
          chrome.storage.local.remove('token');
        }
      }
    } catch {
      // Extension context invalidated (e.g. extension reloaded); stop polling.
      clearInterval(timer);
    }
  }

  syncOnce();
  var timer = setInterval(syncOnce, 3000);
})();

// Listen for token requests and job-saved notifications from the extension.
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request && request.action === 'GET_TRACKMYHUNT_TOKEN') {
      try {
        sendResponse({ token: window.localStorage.getItem('token') });
      } catch {
        sendResponse({ token: null });
      }
      return true;
    }
    if (request && request.action === 'JOB_SAVED') {
      // Dispatch custom DOM event to notify React dashboard
      window.dispatchEvent(new CustomEvent('trackmyhunt_job_saved'));
    }
  });
}
