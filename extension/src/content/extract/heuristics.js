// DOM-heuristic layer: labeled metadata, headings, and article text for
// pages no platform extractor covers. Lowest-priority evidence tier.

import { labeledValue, articleText } from './dom.js';

export function extractLabeledFields() {
  return {
    location: labeledValue(['Location', 'Locations', 'Job Location', 'Workplace', 'Work Location']),
    employmentType: labeledValue(['Employment Type', 'Employment type', 'Job Type', 'Job type', 'Commitment', 'Work Type']),
    salary: labeledValue(['Salary', 'Compensation', 'Pay', 'Stipend', 'CTC', 'Package']),
    experience: labeledValue(['Experience', 'Experiences', 'Years of experience', 'Exp Required', 'Seniority']),
    department: labeledValue(['Department', 'Team', 'Function', 'Business Unit', 'Division']),
    postedDate: labeledValue(['Posted', 'Posted On', 'Date Posted', 'Posted Date']),
    applicationDeadline: labeledValue(['Apply By', 'Deadline', 'Last Date', 'Last date to apply', 'Valid Through']),
  };
}

export function extractHeadings() {
  let role = '';
  try {
    const h1 = document.querySelector('h1');
    if (h1 && h1.textContent) {
      role = h1.textContent.trim();
      if (/^(jobs|careers|open roles|all jobs|job details|apply now)$/i.test(role)) role = '';
    }
  } catch { /* ignore */ }
  return { role };
}

export function extractArticleDescription() {
  return articleText(
    ['article', 'main article', '[role="main"] article', 'section[class*="description" i]', 'div[class*="job-content" i]', 'main'],
    1200
  );
}

// Conservative listing-page guard: many job links + no single-job signals.
// URL pattern alone never decides; content must also look like a listing.
const JOB_LINK_PATTERN = /\/(job|opening|position|role|career|vacancy|opportunit)/i;

export function looksLikeListingPage(hasStructuredPosting) {
  if (hasStructuredPosting) return false;
  try {
    const links = document.querySelectorAll('a[href]');
    let jobLinks = 0;
    const total = Math.min(links.length, 200);
    for (let i = 0; i < total; i++) {
      const href = links[i].getAttribute('href') || '';
      if (JOB_LINK_PATTERN.test(href)) jobLinks += 1;
    }
    const applyButtons = Array.from(document.querySelectorAll('button, a')).filter((node) => {
      const t = node && node.textContent ? node.textContent.trim().toLowerCase() : '';
      return t === 'apply' || t === 'apply now' || t === 'apply for this job';
    }).length;
    return jobLinks >= 8 && applyButtons <= 1;
  } catch {
    return false;
  }
}
