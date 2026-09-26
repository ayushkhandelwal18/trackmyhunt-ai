// Internshala extractor: internshala.com internship/job detail pages.
// Interface: { id, label, matches(url), extract(ctx) -> Partial<JobData> }.

import { text, articleText } from '../extract/dom.js';

export const InternshalaExtractor = {
  id: 'internshala',
  label: 'Internshala',

  matches(url) {
    return !!url && url.includes('internshala.com');
  },

  extract() {
    const role = text('h1, .job-title, .heading_4_5');
    let company = text('.company_name a, .company_name, .company-name a, .company-name');
    const location = text('#location_names, .locations, span[class*="location"]');
    const salary = text('.stipend, .salary, span.stipend');
    const postedDate = text('.posted_on_date, .status-success');

    const details = [];
    try {
      document.querySelectorAll('.other_detail_item, .detail-row-view').forEach((node) => {
        const t = node && node.textContent ? node.textContent.replace(/\s+/g, ' ').trim() : '';
        if (t && t.length <= 160) details.push(t);
      });
    } catch { /* ignore */ }

    const description = articleText(
      ['.internship_details, .job-details, .detail_view, main'],
      1200
    );

    return {
      company,
      role,
      location: location.length <= 80 ? location : '',
      description: details.length ? `${description} ${details.join(' ')}`.trim().slice(0, 1200) : description,
      salary,
      postedDate,
      employmentType: /internship/i.test(window.location.pathname) ? 'Internship' : '',
      workMode: '',
    };
  },
};
