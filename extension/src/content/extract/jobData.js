// Shared JobData helpers: blank factory, text cleaning, and confidence math.
// Pure functions (no chrome/DOM imports) so any layer can use them.

export function blankJobData() {
  return {
    company: '',
    role: '',
    location: '',
    employmentType: '',
    workMode: '',
    experience: '',
    salary: '',
    department: '',
    jobId: '',
    jobUrl: '',
    description: '',
    requirements: '',
    responsibilities: '',
    skills: '',
    postedDate: '',
    applicationDeadline: '',
    source: '',
    sourcePlatform: 'generic',
    isListingPage: false,
    confidence: {},
  };
}

export function cleanText(value, max) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return max && text.length > max ? text.slice(0, max).trim() : text;
}

// Strip boilerplate suffixes we can remove with high confidence.
export function cleanCompany(value) {
  let text = cleanText(value, 120);
  text = text
    .replace(/\s+careers?$/i, '')
    .replace(/^careers?\s+(at|by)\s+/i, '')
    .replace(/\s*\|\s*LinkedIn$/i, '')
    .trim();
  return text;
}

export function cleanRole(value, location) {
  let text = cleanText(value, 140);
  // Remove "Apply now", "Job Details", page chrome.
  text = text.replace(/\s*[-–|]\s*apply now$/i, '').trim();
  if (/^(job details|job description|apply now)$/i.test(text)) return '';
  // Remove a trailing location suffix only when we detected it separately.
  if (location) {
    const escaped = location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`\\s*[-–|,]\\s*${escaped}$`, 'i'), '').trim();
  }
  return text;
}

// Confidence tiers by evidence source. Higher = auto-fill, lower = verify.
export const SOURCE_CONFIDENCE = {
  structured: 0.95,
  platform: 0.85,
  meta: 0.6,
  heuristic: 0.5,
  none: 0,
};

// Merge partial results in priority order. First non-empty value wins per
// field; confidence records which tier supplied it.
export function mergePartials(partials) {
  const merged = blankJobData();
  const confidence = {};
  const fields = Object.keys(merged).filter((k) => !['sourcePlatform', 'isListingPage', 'confidence'].includes(k));
  for (const { data, tier, platform } of partials) {
    if (!data) continue;
    if (platform && !merged.sourcePlatformSet) {
      merged.sourcePlatform = platform;
      merged.sourcePlatformSet = true;
    }
    for (const field of fields) {
      if (!merged[field] && data[field]) {
        merged[field] = data[field];
        confidence[field] = SOURCE_CONFIDENCE[tier] ?? 0.5;
      }
    }
  }
  delete merged.sourcePlatformSet;
  for (const field of fields) {
    if (!(field in confidence)) confidence[field] = 0;
  }
  merged.confidence = confidence;
  return merged;
}
