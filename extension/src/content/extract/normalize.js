// Normalization into TrackMyHunt backend-compatible values.
// Backend type enum: Intern | Full-Time | Remote | Freelance | Intern + Offer | Other.
// Anything outside the enum MUST become "Other" — never invent new values.

import { cleanCompany, cleanRole, cleanText } from './jobData.js';

const TYPE_MAP = [
  [/ppo|pre-placement|placement|intern\s*\+\s*offer/i, 'Intern + Offer'],
  [/intern/i, 'Intern'],
  [/full[\s-]?time/i, 'Full-Time'],
  [/part[\s-]?time/i, 'Other'],
  [/apprentice/i, 'Other'],
  [/contract|temporary|temp\b/i, 'Other'],
  [/freelance|gig/i, 'Freelance'],
  [/remote|work from home|\bwfh\b/i, 'Remote'],
];

export function normalizeEmploymentType(raw) {
  const text = cleanText(raw, 60);
  if (!text) return '';
  for (const [pattern, value] of TYPE_MAP) {
    if (pattern.test(text)) return value;
  }
  return '';
}

export function normalizeWorkMode(raw, location) {
  const text = cleanText(`${raw || ''} ${location || ''}`, 120).toLowerCase();
  if (/\bremote\b|work from home|\bwfh\b|india only|worldwide|anywhere/.test(text)) return 'Remote';
  if (/\bhybrid\b/.test(text)) return 'Hybrid';
  if (/\bon[\s-]?site\b|office|in[\s-]?office|bengaluru|hyderabad|delhi|mumbai|chennai|pune|kolkata|noida|gurgaon|gandhinagar/i.test(raw || location || '')) {
    return 'On-site';
  }
  return '';
}

export function normalizeLocation(raw) {
  return cleanText(raw, 80);
}

// Canonical job URL: strip hash + tracking params, keep the rest.
export function canonicalJobUrl(preferred, fallback) {
  const raw = (preferred && preferred.trim()) || (fallback && fallback.trim()) || '';
  if (!raw) return '';
  // window is unavailable outside browsers (tests); absolute URLs parse alone.
  const base =
    typeof window !== 'undefined' && window.location && window.location.href
      ? window.location.href
      : 'https://example.com/';
  try {
    const parsed = new URL(raw, base);
    parsed.hash = '';
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|gclid|fbclid|mc_|igsh|vero_)/i.test(key)) parsed.searchParams.delete(key);
    }
    return parsed.toString();
  } catch {
    return raw.split('#')[0];
  }
}

// Humanize an org slug ("playpowerlabs" -> "Playpowerlabs") as a last
// resort. Marked low-confidence by the caller; never presented as verified.
export function humanizeSlug(slug) {
  const text = cleanText(slug, 40).replace(/[-_]+/g, ' ').trim();
  if (!text || text.includes(' ') || text.length > 40) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export { cleanCompany, cleanRole, cleanText };
