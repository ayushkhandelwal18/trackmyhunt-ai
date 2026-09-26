// Ashby extractor: jobs.ashbyhq.com/{org}/{jobId}.
// Ashby ships JobPosting JSON-LD (primary); DOM labeled rows back it up.
// Interface: { id, label, matches(url), extract(ctx) -> Partial<JobData> }.

import { text, labeledValue, articleText } from '../extract/dom.js';

export const AshbyExtractor = {
  id: 'ashby',
  label: 'Ashby',

  matches(url) {
    return !!url && url.includes('ashbyhq.com');
  },

  extract() {
    let role = text('h1');
    if (/^(jobs|careers|open roles|all jobs)$/i.test(role)) role = '';

    // Org slug from the URL path: jobs.ashbyhq.com/{org}/{jobId}.
    let orgSlug = '';
    try {
      const parts = new URL(window.location.href).pathname.split('/').filter(Boolean);
      if (parts.length >= 1) orgSlug = parts[0];
    } catch { /* ignore */ }

    const location =
      labeledValue(['Location', 'Locations', 'Workplace']) ||
      text('[data-testid*="location" i], [class*="location" i]');
    const employmentType =
      labeledValue(['Employment Type', 'Employment type', 'Job Type', 'Commitment']) || '';
    const department = labeledValue(['Department', 'Team']) || '';

    const description = articleText(
      ['[class*="job-description" i]', '[class*="posting"] main', 'main article', 'main'],
      1200
    );

    return {
      company: '',
      orgSlug,
      role,
      location: location.length <= 80 ? location : '',
      description,
      employmentType,
      department,
      workMode: '',
    };
  },
};
