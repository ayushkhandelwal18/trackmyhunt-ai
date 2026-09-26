// Fallback job extractor for when the content script is not present in the
// active tab (e.g. the tab was open before the extension was loaded).
//
// IMPORTANT: this function is serialized and injected via
// chrome.scripting.executeScript, so it must be ENTIRELY self-contained:
// no imports, no chrome.* APIs, no outer-scope references — only `document`,
// `window`, and the `pageUrl` argument. Keep it compact; the full platform
// scrapers remain the primary extraction path.
export function fallbackExtract(pageUrl) {
  const clean = (value, max) => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    return max && text.length > max ? text.slice(0, max).trim() : text;
  };
  const pick = (selectors) => {
    for (const selector of selectors) {
      try {
        const node = document.querySelector(selector);
        const text = node && node.textContent ? node.textContent.trim() : '';
        if (text) return text;
      } catch { /* invalid selector for this page */ }
    }
    return '';
  };

  const url = String(pageUrl || window.location.href);
  const lowerUrl = url.toLowerCase();
  let platform = 'generic';
  if (lowerUrl.includes('linkedin.com/jobs')) platform = 'linkedin';
  else if (lowerUrl.includes('indeed.com')) platform = 'indeed';
  else if (lowerUrl.includes('wellfound.com')) platform = 'wellfound';
  else if (lowerUrl.includes('greenhouse.io')) platform = 'greenhouse';

  let role = pick(['h1']);
  let company = '';
  if (platform === 'linkedin') {
    role = pick([
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title',
      'h1',
    ]) || role;
    company = pick([
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name',
    ]);
  } else if (platform === 'indeed') {
    role = pick(['h1.jobsearch-JobInfoHeader-title', 'h2.jobsearch-JobInfoHeader-title']) || role;
    company = pick(['[data-company-name="true"]', '.jobsearch-CompanyInfoContainer']);
  } else if (platform === 'wellfound') {
    const path = window.location.pathname;
    if (path.includes('/jobs/') || path.includes('/role/')) {
      company = pick(['a[href^="/company/"]']);
    } else {
      company = (role || '').replace(/careers/i, '').trim();
      role = '';
    }
  } else if (platform === 'greenhouse') {
    role = pick(['h1.app-title']) || role;
    company = pick(['span.company-name']).replace(/^at\s+/i, '').trim();
  }

  // Generic title parsing when platform rules found nothing usable.
  if ((!role || !company) && platform === 'generic') {
    const meta = document.querySelector('meta[property="og:title"]');
    const source = (meta && meta.getAttribute('content')) || document.title || '';
    if (source.includes(' at ')) {
      const parts = source.split(' at ');
      if (!role) role = parts[0].trim();
      if (!company) company = parts[1].split('-')[0].trim();
    } else if (source.includes('|')) {
      const parts = source.split('|');
      if (!role) role = parts[0].trim();
      if (!company) company = parts[1].trim();
    }
  }

  if (/careers|wellfound|^mygreenhouse$|^greenhouse$|job search/i.test(role)) role = '';
  if (/^indeed$/i.test(company)) company = '';

  const bodyText = document.body ? document.body.innerText : '';
  const lower = bodyText.toLowerCase();
  let type = 'Other';
  if (/\binternship\b|\binterns?\b/.test(lower)) type = 'Intern';
  else if (/\bfull-?time\b/.test(lower)) type = 'Full-Time';
  else if (/\bremote\b|\bwfh\b/.test(lower)) type = 'Remote';

  let location = pick([
    '.job-details-jobs-unified-top-card__primary-description',
    '.jobsearch-JobInfoHeader-subtitle',
    'span.company-location, span.location',
  ]);
  if (location.length > 80) location = '';
  // Primary-description blocks mix location with applicants count; keep the head.
  if (location.includes('·')) location = location.split('·')[0].trim();

  let description = pick([
    '.jobs-description__content',
    '.jobsearch-jobDescriptionText',
    '#jobDescriptionText',
    'div[class*="description"]',
  ]);
  description = clean(description, 280);

  return {
    platform,
    company: clean(company, 120),
    role: clean(role, 140),
    location: clean(location, 80),
    description,
    type,
    status: 'Applied',
    applicationLink: url.split('#')[0],
    appliedDate: new Date().toISOString(),
    notes: 'Detected via TrackMyHunt',
  };
}
