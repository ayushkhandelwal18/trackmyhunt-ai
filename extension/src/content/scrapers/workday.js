// Workday extractor: *.myworkdayjobs.com / *.workdayjobs.com postings.
// Workday ships JobPosting JSON-LD (primary); data-automation-id DOM backs up.
// Interface: { id, label, matches(url), extract(ctx) -> Partial<JobData> }.

import { text, articleText } from '../extract/dom.js';

export const WorkdayExtractor = {
  id: 'workday',
  label: 'Workday',

  matches(url) {
    return !!url && (/myworkdayjobs\.com/i.test(url) || /workdayjobs\.com/i.test(url));
  },

  extract() {
    const role = text('h2[data-automation-id="jobPostingHeader"], h1');
    const location = text('[data-automation-id="locations"]');
    const jobId = text('[data-automation-id="jobPostingId"]');
    const postedDate = text('[data-automation-id="postedOn"]');
    const description = articleText(
      ['[data-automation-id="jobPostingDescription"]', '[data-automation-id="job-description"]', 'main'],
      1200
    );

    return {
      company: '',
      role,
      location: location.length <= 80 ? location : '',
      description,
      jobId,
      postedDate,
      employmentType: '',
      workMode: '',
    };
  },
};
