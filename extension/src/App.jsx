import { useState, useEffect, useRef } from 'react';
import {
  Briefcase,
  Building,
  Search,
  Send,
  LogIn,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Info,
  ExternalLink,
  FileText,
  ScanSearch,
} from 'lucide-react';
import { getTokenFromDashboardTabs } from './shared/tokenSync.js';
import { fallbackExtract } from './shared/extractFallback.js';
import { detectPlatform } from './content/extract/detectPlatform.js';

// Shared design language with the TrackMyHunt website (CSS vars in index.css):
// brand orange primary buttons, surface cards, 8px radius, Inter type.
const primaryButton = {
  width: '100%',
  minHeight: 40,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  border: '1px solid transparent',
  borderRadius: 8,
  padding: '0.55rem 0.95rem',
  fontSize: '0.83rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  background: 'var(--brand)',
  color: '#fff',
  cursor: 'pointer',
};

const secondaryButton = {
  ...primaryButton,
  background: 'var(--surface)',
  borderColor: 'var(--border-strong)',
  color: 'var(--text)',
};

const inputStyle = {
  width: '100%',
  minHeight: 40,
  border: '1px solid var(--border-strong)',
  borderRadius: 8,
  background: 'var(--input)',
  padding: '0.6rem 0.75rem',
  color: 'var(--text)',
  fontSize: '0.85rem',
  outline: 0,
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  color: 'var(--text)',
  fontSize: '0.78rem',
  fontWeight: 600,
};

const SUPPORTED_PLATFORMS = ['LinkedIn', 'Indeed', 'Naukri', 'Internshala', 'Greenhouse', 'Lever', 'Workday', 'Ashby', 'Wellfound'];

function getFrontendBase() {
  return (import.meta.env.VITE_BASE_FRONTEND_URL || 'http://localhost:5173/').replace(/\/$/, '');
}

function hasJobContent(data) {
  return Boolean(data && (String(data.company || '').trim() || String(data.role || '').trim()));
}

// A careers/listing index is never a saveable job, even when the extractor
// pulled a title-like string out of it.
function isListingResult(data) {
  return Boolean(data && data.isListingPage);
}

// True when the user should double-check the form: required data missing or
// extracted with low confidence. Never blocks saving.
function needsReview(data) {
  if (!data) return false;
  if (!String(data.company || '').trim() || !String(data.role || '').trim()) return true;
  const confidence = data.confidence || {};
  return (confidence.company ?? 1) < 0.7 || (confidence.role ?? 1) < 0.7;
}

function App() {
  const [token, setToken] = useState(null);

  // Extraction phase machine: scanning | ready | empty | unsupported | conn-error.
  // Kept separate from auth (token null) and from save status below.
  const [phase, setPhase] = useState('scanning');
  const [jobData, setJobData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const rescanTimer = useRef(null);
  const toastTimer = useRef(null);
  // Identity of the job currently shown (applicationLink, else company|role).
  // A genuinely different job clears any lingering toast — renders never do.
  const currentJobKey = useRef(null);

  const clearToastTimer = () => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
  };

  // Central status setter: success/info toasts auto-dismiss after ~3s,
  // errors persist until the next scrape or user action.
  const showToast = (type, message) => {
    clearToastTimer();
    setStatus(type && message ? { type, message } : null);
    if ((type === 'success' || type === 'info') && message) {
      toastTimer.current = setTimeout(() => {
        toastTimer.current = null;
        setStatus(null);
      }, 3000);
    }
  };

  const jobKeyOf = (data) => {
    if (!data) return null;
    const link = String(data.applicationLink || '').trim();
    if (link) return `url:${link}`;
    const company = String(data.company || '').trim().toLowerCase();
    const role = String(data.role || '').trim().toLowerCase();
    if (!company && !role) return null;
    return `job:${company}|${role}`;
  };

  const getDashboardToken = () => getTokenFromDashboardTabs();

  // Scrape the given tab: content script first, injected fallback second.
  // Returns { ok, data, platform, tabId, url } — never throws.
  const scrapeTab = (tab) => new Promise((resolve) => {
    if (!tab || !tab.id) {
      resolve({ ok: false, reason: 'no-tab' });
      return;
    }
    const tabId = tab.id;
    const tabUrl = tab.url || '';
    let settled = false;
    const finish = (result) => {
      if (!settled) {
        settled = true;
        resolve({ ...result, tabId, url: tabUrl });
      }
    };
    try {
      chrome.tabs.sendMessage(tab.id, { action: 'scrape_job' }, (response) => {
        void chrome.runtime.lastError;
        if (response && response.success && response.data) {
          finish({ ok: true, data: response.data, platform: response.platform || 'generic' });
          return;
        }
        // No listener (tab predates extension load) or scraper threw:
        // inject the self-contained fallback extractor directly.
        injectFallback(tab).then(finish);
      });
    } catch {
      injectFallback(tab).then(finish);
    }
    // Safety net: never leave the UI spinning forever.
    setTimeout(() => finish({ ok: false, reason: 'timeout' }), 15000);
  });

  const injectFallback = async (tab) => {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: fallbackExtract,
        args: [tab.url || ''],
      });
      const data = results && results[0] && results[0].result;
      if (data && hasJobContent(data)) {
        return { ok: true, data, platform: data.platform || 'generic' };
      }
      return { ok: false, reason: 'empty' };
    } catch {
      return { ok: false, reason: 'connection' };
    }
  };

  const pushCache = (result) => {
    // Fire-and-forget: background keeps the latest scrape per tab+URL so the
    // next panel open paints instantly before the fresh confirm scrape.
    // Listing pages are never cached: they are not saveable jobs.
    if (!result.ok || result.tabId === undefined || isListingResult(result.data)) return;
    try {
      chrome.runtime.sendMessage({
        action: 'CACHE_JOB',
        tabId: result.tabId,
        url: result.url,
        data: result.data,
        platform: result.platform,
      });
    } catch {
      // Background unreachable; fresh scrape already succeeded.
    }
  };

  const applyScrapeResult = (result) => {
    if (result.ok && !isListingResult(result.data)) {
      const key = jobKeyOf(result.data);
      if (key && key !== currentJobKey.current) {
        // Genuinely different job/page: drop any stale toast, load the form.
        clearToastTimer();
        setStatus(null);
      }
      currentJobKey.current = key;
      setJobData(result.data);
      setPhase('ready');
      setSavedId(null);
      pushCache(result);
      return;
    }
    setJobData(null);
    if (result.reason === 'connection' || result.reason === 'timeout' || result.reason === 'no-tab') {
      setPhase('conn-error');
      return;
    }
    // Platform may be missing on failure paths (content throw, empty
    // fallback). Derive it from the tab URL — pure URL matching, no DOM —
    // so a LinkedIn page never reports "unsupported".
    const urlPlatform =
      result.platform && result.platform !== 'generic'
        ? result.platform
        : detectPlatform(result.url || '', { querySelector: () => null });
    if (urlPlatform && urlPlatform !== 'generic') {
      // Supported platform, but this view holds no detectable job.
      setPhase('empty');
    } else {
      setPhase('unsupported');
    }
  };

  const handleScrape = async (opts = {}) => {
    const { silent = false } = opts;
    if (!silent) {
      setPhase('scanning');
      setStatus(null);
      setSavedId(null);
      clearToastTimer();
    } else {
      setSavedId(null);
    }

    let tab = null;
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      tab = tabs && tabs[0];
    } catch {
      if (!silent) setPhase('conn-error');
      return;
    }
    if (silent && tab && tab.id) {
      // Cache-first instant paint; the fresh scrape below still confirms it.
      try {
        const cached = await chrome.runtime.sendMessage({
          action: 'GET_CACHED_JOB',
          tabId: tab.id,
          url: tab.url,
        });
        if (cached && cached.entry && hasJobContent(cached.entry.data)) {
          setJobData(cached.entry.data);
          setPhase('ready');
        }
      } catch {
        // No cache: fall through to the fresh scrape.
      }
    }
    applyScrapeResult(await scrapeTab(tab));
  };

  useEffect(() => {
    let cancelled = false;
    chrome.storage.local.get(['token'], async (result) => {
      if (cancelled) return;
      const dashboardToken = result.token || await getDashboardToken();
      if (cancelled) return;
      if (dashboardToken) {
        setToken(dashboardToken);
        handleScrape();
      } else {
        setToken(null);
        setPhase('scanning');
      }
    });

    // Token synced/removed elsewhere (dashboard login/logout, 401 cleanup).
    const handleStorageChange = (changes) => {
      if (changes.token) {
        if (changes.token.newValue) {
          setToken(changes.token.newValue);
          handleScrape();
        } else {
          setToken(null);
          setJobData(null);
          setPhase('scanning');
          currentJobKey.current = null;
          showToast(null, null);
        }
      }
    };
    // Active tab changed or navigated (covers SPA navigation without reload).
    // Silent: paint from cache instantly, then confirm with a fresh scrape.
    const scheduleRescan = () => {
      if (rescanTimer.current) return;
      rescanTimer.current = setTimeout(() => {
        rescanTimer.current = null;
        handleScrapeRef.current({ silent: true });
      }, 800);
    };
    const handleRuntimeMessage = (request) => {
      if (request && request.action === 'TAB_CHANGED') scheduleRescan();
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    return () => {
      cancelled = true;
      if (rescanTimer.current) clearTimeout(rescanTimer.current);
      clearToastTimer();
      chrome.storage.onChanged.removeListener(handleStorageChange);
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ref so the tab-change listener always calls the latest scrape closure.
  const handleScrapeRef = useRef(handleScrape);
  handleScrapeRef.current = handleScrape;

  const openDashboardLogin = () => {
    window.open(getFrontendBase() + '/', '_blank');
  };

  const handleLogout = () => {
    // Extension-level logout only: clears the extension copy of the token.
    // The website session is untouched (log out there to end it fully).
    setToken(null);
    setJobData(null);
    showToast(null, null);
    setSavedId(null);
    setPhase('scanning');
    currentJobKey.current = null;
    chrome.storage.local.remove('token');
  };

  const handleSave = () => {
    if (!jobData || saving) return;

    // Validation
    const company = jobData.company?.trim();
    const role = jobData.role?.trim();

    if (!company || !role) {
      setStatus({ type: 'error', message: 'Company Name and Job Role are required.' });
      return;
    }

    setSaving(true);
    showToast(null, null);

    const validTypes = ['Intern', 'Full-Time', 'Remote', 'Freelance', 'Intern + Offer', 'Other'];
    const validStatuses = ['Applied', 'Resume Shortlisted', 'OA Done', 'Interview Scheduled', 'Interview Done', 'Rejected', 'Other'];

    // The backend stores company/role/type/status/link/notes/date only, so
    // extra captured context (location, work mode, salary, department) is
    // appended to notes as a labeled Details line instead of being dropped.
    const detailParts = [jobData.location, jobData.workMode, jobData.salary, jobData.department]
      .map((part) => String(part || '').trim())
      .filter(Boolean);
    const baseNotes = (jobData.notes || 'Saved via TrackMyHunt Browser Extension').trim();
    const notes = detailParts.length ? `${baseNotes}\n\nDetails: ${detailParts.join(' · ')}` : baseNotes;

    const payload = {
      company,
      role,
      type: validTypes.includes(jobData.type) ? jobData.type : 'Other',
      status: validStatuses.includes(jobData.status) ? jobData.status : 'Applied',
      applicationLink: jobData.applicationLink || '',
      notes,
      appliedDate: jobData.appliedDate || new Date().toISOString()
    };

    chrome.runtime.sendMessage({ action: 'save_job', data: payload, authToken: token }, (response) => {
      setSaving(false);
      if (chrome.runtime.lastError) {
        setStatus({ type: 'error', message: 'Extension connection lost. Please reopen the panel and try again.' });
        return;
      }
      if (response && response.success) {
        const createdId = response.data && (response.data._id || response.data.id);
        setSavedId(createdId || null);
        // Form stays open and editable; the toast dismisses itself.
        showToast('success', 'Saved to Dashboard');
      } else if (response && response.duplicate) {
        showToast('info', 'Already saved to Dashboard');
      } else if (response && /session has expired|log in/i.test(response.error || '')) {
        // Token is dead (background already cleared its copy): fall back to login.
        setToken(null);
        chrome.storage.local.remove('token');
        setStatus({ type: 'error', message: response.error });
      } else {
        setStatus({ type: 'error', message: response?.error || 'Failed to save job to dashboard.' });
      }
    });
  };

  const statusColors = {
    error: { bg: 'var(--danger-bg)', color: 'var(--danger)', border: 'var(--danger)' },
    success: { bg: 'var(--success-bg)', color: 'var(--success)', border: 'var(--success)' },
    info: { bg: 'var(--brand-soft)', color: 'var(--brand)', border: 'var(--brand-border)' },
  };

  if (!token) {
    return (
      <div className="p-4 w-full min-w-0 flex flex-col items-center" style={{ background: 'var(--bg)' }}>
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            height: 44,
            width: 44,
            borderRadius: 12,
            background: 'var(--brand-soft)',
            border: '1px solid var(--brand-border)',
            color: 'var(--brand)',
            marginBottom: '0.9rem',
          }}
        >
          <Briefcase size={20} />
        </div>
        <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-strong)' }}>TrackMyHunt</h1>
        <p className="text-center" style={{ margin: '0.4rem 0 1.1rem', fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--muted)' }}>
          Sign in to TrackMyHunt to save jobs from this page.
        </p>

        <div className="w-full min-w-0 flex flex-col" style={{ gap: '0.55rem' }}>
          <button type="button" onClick={openDashboardLogin} style={primaryButton}>
            <LogIn size={15} /> Login
          </button>

          <button type="button" onClick={openDashboardLogin} style={secondaryButton}>
            <UserPlus size={15} /> Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 w-full min-w-0 flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <header className="flex justify-between items-center w-full min-w-0" style={{ marginBottom: '0.9rem', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center min-w-0" style={{ gap: '0.5rem' }}>
          <span
            style={{
              display: 'grid',
              placeItems: 'center',
              height: 26,
              width: 26,
              flexShrink: 0,
              borderRadius: 8,
              background: 'var(--brand)',
              color: '#fff',
            }}
          >
            <Briefcase size={14} />
          </span>
          <span style={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-strong)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>TrackMyHunt</span>
        </div>
        <button type="button" onClick={handleLogout} aria-label="Log out of the extension" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--muted)', flexShrink: 0, padding: '0.4rem 0.2rem' }}>
          Logout
        </button>
      </header>

      {status && (
        <div
          className="w-full min-w-0 flex items-start"
          role={status.type === 'error' ? 'alert' : 'status'}
          style={{
            gap: '0.5rem',
            padding: '0.65rem 0.8rem',
            marginBottom: '0.9rem',
            fontSize: '0.8rem',
            lineHeight: 1.5,
            borderRadius: 8,
            border: `1px solid ${statusColors[status.type]?.border || statusColors.info.border}`,
            background: statusColors[status.type]?.bg || statusColors.info.bg,
            color: statusColors[status.type]?.color || statusColors.info.color,
          }}
        >
          {status.type === 'error'
            ? <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
            : status.type === 'success'
              ? <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 2 }} />
              : <Info size={15} style={{ flexShrink: 0, marginTop: 2 }} />}
          <span className="min-w-0" style={{ overflowWrap: 'anywhere' }}>{status.message}</span>
        </div>
      )}

      {phase === 'scanning' && <ScanSkeleton />}

      {phase === 'conn-error' && (
        <div className="flex flex-col items-center" style={{ padding: '1.25rem 0' }}>
          <div
            style={{
              display: 'grid', placeItems: 'center', height: 44, width: 44, borderRadius: '50%',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              color: 'var(--muted)', marginBottom: '0.8rem',
            }}
          >
            <Search size={20} />
          </div>
          <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-strong)' }}>Connection issue</h2>
          <p className="text-center" style={{ margin: '0.4rem 0 1rem', fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--muted)' }}>
            We couldn&apos;t access the current page.
          </p>
          <button type="button" onClick={handleScrape} style={secondaryButton}>
            Refresh &amp; Retry
          </button>
        </div>
      )}

      {(phase === 'empty' || phase === 'unsupported') && (
        <div className="flex flex-col items-center" style={{ padding: '1.25rem 0' }}>
          <div
            style={{
              display: 'grid', placeItems: 'center', height: 44, width: 44, borderRadius: '50%',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              color: 'var(--brand)', marginBottom: '0.8rem',
            }}
          >
            <ScanSearch size={20} />
          </div>
          <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-strong)' }}>
            {phase === 'unsupported' ? 'Page not supported' : 'No job detected'}
          </h2>
          <p className="text-center" style={{ margin: '0.4rem 0 1rem', fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--muted)' }}>
            {phase === 'unsupported'
              ? 'This page isn\u2019t currently supported. Open a job posting and try again.'
              : 'Open a supported job posting and we\u2019ll automatically detect the details.'}
          </p>
          <div className="flex flex-wrap justify-center" style={{ gap: '0.4rem', marginBottom: '1rem' }}>
            {SUPPORTED_PLATFORMS.map((name) => (
              <span
                key={name}
                style={{
                  fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted)',
                  border: '1px solid var(--border)', borderRadius: 999, padding: '0.2rem 0.6rem',
                  background: 'var(--surface)',
                }}
              >
                {name}
              </span>
            ))}
          </div>
          <button type="button" onClick={handleScrape} style={secondaryButton}>
            Retry
          </button>
        </div>
      )}

      {phase === 'ready' && jobData && (
        <div className="flex flex-col min-w-0" style={{ gap: '0.8rem' }}>
          {needsReview(jobData) && (
            <div
              className="w-full min-w-0 flex items-start"
              style={{
                gap: '0.5rem', padding: '0.6rem 0.75rem', fontSize: '0.76rem', lineHeight: 1.55,
                borderRadius: 8, border: '1px solid var(--brand-border)',
                background: 'var(--brand-soft)', color: 'var(--brand)',
              }}
            >
              <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              <span className="min-w-0">Some details couldn&apos;t be detected. Review the fields before saving.</span>
            </div>
          )}
          <article
            className="min-w-0"
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '0.9rem',
            }}
            aria-label="Detected job preview"
          >
            <div className="flex items-start min-w-0" style={{ gap: '0.65rem' }}>
              <span
                style={{
                  display: 'grid', placeItems: 'center', height: 36, width: 36, flexShrink: 0,
                  borderRadius: 10, background: 'var(--brand-soft)',
                  border: '1px solid var(--brand-border)', color: 'var(--brand)',
                  fontWeight: 800, fontSize: '0.95rem',
                }}
                aria-hidden="true"
              >
                {(jobData.company || jobData.role || 'J').trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0" style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-strong)', lineHeight: 1.4, overflowWrap: 'anywhere' }}>
                  {jobData.role || 'Untitled role'}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', overflowWrap: 'anywhere' }}>
                  {jobData.company || 'Unknown company'}
                </p>
                {(jobData.location || jobData.type) && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: 'var(--muted)', overflowWrap: 'anywhere' }}>
                    {[jobData.location, jobData.type].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          </article>

          <div>
            <label style={labelStyle}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Building size={12} /> Company *</span>
            </label>
            <input
              value={jobData.company || ''}
              onChange={e => setJobData({ ...jobData, company: e.target.value })}
              placeholder="e.g. Google"
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Briefcase size={12} /> Role *</span>
            </label>
            <input
              value={jobData.role || ''}
              onChange={e => setJobData({ ...jobData, role: e.target.value })}
              placeholder="e.g. Software Engineer"
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Location</label>
            <input
              value={jobData.location || ''}
              onChange={e => setJobData({ ...jobData, location: e.target.value })}
              placeholder="e.g. Bengaluru · Remote"
              style={inputStyle}
            />
          </div>
          <div className="grid grid-cols-1 min-[340px]:grid-cols-2" style={{ gap: '0.75rem' }}>
            <div className="min-w-0">
              <label style={labelStyle}>Type</label>
              <select
                value={jobData.type || 'Other'}
                onChange={e => setJobData({ ...jobData, type: e.target.value })}
                style={inputStyle}
              >
                <option value="Intern">Intern</option>
                <option value="Full-Time">Full-Time</option>
                <option value="Remote">Remote</option>
                <option value="Freelance">Freelance</option>
                <option value="Intern + Offer">Intern + Offer</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="min-w-0">
              <label style={labelStyle}>Status</label>
              <select
                value={jobData.status || 'Applied'}
                onChange={e => setJobData({ ...jobData, status: e.target.value })}
                style={inputStyle}
              >
                <option value="Applied">Applied</option>
                <option value="Resume Shortlisted">Resume Shortlisted</option>
                <option value="OA Done">OA Done</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <button type="button" onClick={handleSave} disabled={saving} style={{ ...primaryButton, marginTop: '0.25rem', opacity: saving ? 0.55 : 1 }}>
            {saving ? 'Saving…' : <><Send size={15} /> Save to Dashboard</>}
          </button>
          {savedId && (
            <a
              href={`${getFrontendBase()}/applications/${savedId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center"
              style={{ gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand)' }}
            >
              <FileText size={13} /> View in TrackMyHunt <ExternalLink size={12} />
            </a>
          )}
          <button
            type="button"
            onClick={() => { setJobData(null); setPhase('empty'); currentJobKey.current = null; showToast(null, null); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--muted)' }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function ScanSkeleton() {
  const bar = (width, height = 12) => (
    <div
      className="animate-pulse"
      style={{ width, height, borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)' }}
    />
  );
  return (
    <div className="flex flex-col" style={{ gap: '0.7rem' }} aria-label="Looking for job details" role="status">
      <div className="flex items-center" style={{ gap: '0.65rem' }}>
        <div className="animate-pulse" style={{ height: 36, width: 36, flexShrink: 0, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
        <div className="flex flex-col min-w-0" style={{ gap: '0.4rem', flex: 1 }}>
          {bar('70%')}
          {bar('45%')}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>Looking for job details…</p>
      {bar('100%', 40)}
      {bar('100%', 40)}
      <div className="grid grid-cols-1 min-[340px]:grid-cols-2" style={{ gap: '0.75rem' }}>
        {bar('100%', 40)}
        {bar('100%', 40)}
      </div>
    </div>
  );
}

export default App;
