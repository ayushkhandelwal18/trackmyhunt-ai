// Layered extraction pipeline.
//
// extractJob()
//   → Platform Detector
//   → Platform-specific extractor
//   → Generic extractor fallback
//   → Structured-data extractor (JSON-LD JobPosting)
//   → Metadata extractor (OG/Twitter)
//   → DOM heuristic extractor
//   → Normalization
//   → Confidence scoring
//   → Final JobData object
//
// Merge priority (first non-empty value wins per field):
// structured → platform → meta → heuristic.

import { detectPlatform } from './detectPlatform.js';
import { extractStructuredData } from './structuredData.js';
import { extractMeta } from './meta.js';
import {
  extractLabeledFields,
  extractHeadings,
  extractArticleDescription,
  looksLikeListingPage,
} from './heuristics.js';
import { cleanCompany, cleanRole, mergePartials } from './jobData.js';
import {
  normalizeEmploymentType,
  normalizeWorkMode,
  normalizeLocation,
  canonicalJobUrl,
  humanizeSlug,
  cleanText,
} from './normalize.js';
import { detectJobType } from '../scrapers/jobType.js';
import { LinkedInExtractor } from '../scrapers/linkedin.js';
import { IndeedExtractor } from '../scrapers/indeed.js';
import { NaukriExtractor } from '../scrapers/naukri.js';
import { InternshalaExtractor } from '../scrapers/internshala.js';
import { GreenhouseExtractor } from '../scrapers/greenhouse.js';
import { LeverExtractor } from '../scrapers/lever.js';
import { WorkdayExtractor } from '../scrapers/workday.js';
import { AshbyExtractor } from '../scrapers/ashby.js';
import { GoogleFormsExtractor } from '../scrapers/googleForms.js';
import { GenericExtractor } from '../scrapers/generic.js';

const REGISTRY = {
  linkedin: LinkedInExtractor,
  indeed: IndeedExtractor,
  naukri: NaukriExtractor,
  internshala: InternshalaExtractor,
  greenhouse: GreenhouseExtractor,
  lever: LeverExtractor,
  workday: WorkdayExtractor,
  ashby: AshbyExtractor,
  google_forms: GoogleFormsExtractor,
  company_careers: GenericExtractor,
  generic: GenericExtractor,
};

export const PLATFORM_LABELS = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  naukri: 'Naukri',
  internshala: 'Internshala',
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  workday: 'Workday',
  ashby: 'Ashby',
  google_forms: 'Google Form',
  company_careers: 'Career page',
  generic: 'Web page',
};

function splitMetaTitle(title) {
  const source = cleanText(title, 160);
  if (!source) return { role: '', company: '' };
  if (source.includes(' at ')) {
    const parts = source.split(' at ');
    return { role: parts[0].trim(), company: parts[1].split('-')[0].trim() };
  }
  if (source.includes('|')) {
    const parts = source.split('|');
    return { role: parts[0].trim(), company: (parts[1] || '').trim() };
  }
  if (source.includes('-')) {
    const parts = source.split('-');
    if (parts.length === 2) {
      return { role: parts[0].trim(), company: parts[1].trim() };
    }
  }
  return { role: '', company: '' };
}

// Never accept a platform/site name as the employer (e.g. og:site_name
// "LinkedIn" on a LinkedIn job page is not the hiring company).
const SITE_NAME_BLOCKLIST = [
  'linkedin',
  'indeed',
  'naukri',
  'internshala',
  'greenhouse',
  'lever',
  'workday',
  'ashby',
  'google',
  'facebook',
  'twitter',
  'x',
];

function isSiteName(value) {
  const text = cleanText(value, 60).toLowerCase();
  return SITE_NAME_BLOCKLIST.some((name) => text === name || text.endsWith(` ${name}`));
}

export function extractJob() {
  const href = window.location.href;
  const platform = detectPlatform(href);
  const extractor = REGISTRY[platform] || GenericExtractor;

  let structured = null;
  try {
    structured = extractStructuredData();
  } catch {
    structured = null;
  }

  let platformData = null;
  try {
    platformData = extractor.extract({ url: href, structured }) || null;
  } catch {
    platformData = null;
  }

  let meta = null;
  try {
    meta = extractMeta();
  } catch {
    meta = null;
  }

  let heuristics = null;
  try {
    const labeled = extractLabeledFields();
    const headings = extractHeadings();
    heuristics = {
      ...labeled,
      role: headings.role,
      description: extractArticleDescription(),
    };
  } catch {
    heuristics = null;
  }

  const metaTitle = splitMetaTitle(meta && meta.title);
  const metaCompany = meta && !isSiteName(meta.company) ? meta.company : '';

  const merged = mergePartials([
    { data: structured, tier: 'structured', platform },
    { data: platformData, tier: 'platform', platform },
    {
      data: meta
        ? {
          company: metaCompany,
          role: metaTitle.role,
          description: meta.description,
          jobUrl: meta.jobUrl,
        }
        : null,
      tier: 'meta',
      platform,
    },
    { data: heuristics, tier: 'heuristic', platform },
  ]);

  // Org-slug fallback (e.g. Ashby path) when nothing named the company.
  if (!merged.company && platformData && platformData.orgSlug) {
    const humanized = humanizeSlug(platformData.orgSlug);
    if (humanized) {
      merged.company = humanized;
      merged.confidence.company = 0.5;
    }
  }

  // Final normalization into backend-compatible values.
  merged.company = cleanCompany(merged.company);
  merged.location = normalizeLocation(merged.location);
  merged.role = cleanRole(merged.role, merged.location);
  const typeCandidate =
    (platformData && platformData.employmentType) ||
    (heuristics && heuristics.employmentType) ||
    (structured && structured.employmentType) ||
    '';
  const normalizedType = normalizeEmploymentType(typeCandidate);
  merged.employmentType = normalizedType;
  // Backend-compatible type is always populated: normalized enum or Other.
  merged.type = normalizedType || detectJobType(document.body ? document.body.innerText : '');
  merged.workMode = normalizeWorkMode(
    (platformData && platformData.workMode) || '',
    merged.location
  );
  merged.jobUrl = canonicalJobUrl(
    (structured && structured.jobUrl) ||
      (meta && meta.jobUrl) ||
      (platformData && (platformData.jobUrl || platformData.applicationLink)) ||
      '',
    href
  );
  merged.applicationLink = merged.jobUrl || href.split('#')[0];
  merged.source = merged.jobUrl || href.split('#')[0];
  merged.sourcePlatform = platform;
  merged.description = cleanText(merged.description, 1200);
  merged.requirements = cleanText(merged.requirements, 1200);
  merged.responsibilities = cleanText(merged.responsibilities, 1200);
  merged.skills = cleanText(merged.skills, 800);
  merged.salary = cleanText(merged.salary, 120);
  merged.experience = cleanText(merged.experience, 120);
  merged.department = cleanText(merged.department, 120);
  merged.jobId = cleanText(merged.jobId, 80);
  merged.postedDate = cleanText(merged.postedDate, 40);
  merged.applicationDeadline = cleanText(merged.applicationDeadline, 40);

  // Listing guard: a careers index is not a job — never save it as one.
  if ((platform === 'company_careers' || platform === 'generic') && !structured) {
    try {
      merged.isListingPage = looksLikeListingPage(false);
    } catch {
      merged.isListingPage = false;
    }
  }

  return { platform, data: merged };
}

export function hasJobContent(data) {
  return Boolean(
    data && (String(data.company || '').trim() || String(data.role || '').trim())
  );
}
