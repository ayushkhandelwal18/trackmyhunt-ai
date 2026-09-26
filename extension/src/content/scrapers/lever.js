// Lever extractor: jobs.lever.co/{org}/{id} postings.
// Lever ships JobPosting JSON-LD (primary); DOM posting blocks back it up.
// Interface: { id, label, matches(url), extract(ctx) -> Partial<JobData> }.

import { text, articleText } from '../extract/dom.js';

export const LeverExtractor = {
  id: 'lever',
  label: 'Lever',

  matches(url) {
    return !!url && url.includes('lever.co');
  },

  extract() {
    const role = text('h2.posting-headline, .posting-header h2, h2');
    let company = text('.posting-company-name, .main-header-text, a.main-header-logo span');

    // Posting categories line: "Location · WorkplaceType · Commitment".
    let location = '';
    let employmentType = '';
    let workMode = '';
    const categories = text('.posting-categories');
    if (categories) {
      const parts = categories.split(/[·|]/).map((s) => s.trim()).filter(Boolean);
      for (const part of parts) {
        if (!location && /[A-Za-z]/.test(part) && part.length <= 80) {
          if (/remote|hybrid|on-?site|office|hybrid/i.test(part)) {
            if (!workMode) workMode = part;
          } else if (!location) {
            location = part;
          }
        }
        if (/full[\s-]?time|part[\s-]?time|contract|intern/i.test(part) && !employmentType) {
          employmentType = part;
        }
      }
    }

    const description = articleText(
      ['.posting-requirements', '.content', '[class*="posting-"] main', 'main'],
      1200
    );

    return { company, role, location, description, employmentType, workMode };
  },
};
