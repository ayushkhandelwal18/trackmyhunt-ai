// Naukri extractor: naukri.com job listings.
// Interface: { id, label, matches(url), extract(ctx) -> Partial<JobData> }.

import { text, articleText } from '../extract/dom.js';

export const NaukriExtractor = {
  id: 'naukri',
  label: 'Naukri',

  matches(url) {
    return !!url && url.includes('naukri.com');
  },

  extract() {
    const role = text('h1.tit, h1[class*="jd-header-title"], h1');
    const company = text(
      '.jd-header-comp-name, a.comp-name, div[class*="comp-name"] a, div[class*="comp-name"]'
    );
    const location = text('.locWdth, span[class*="location"], div[class*="loc"]');
    const salary = text('.salry-wdth, span[class*="salary"]');
    const experience = text('.expwdth, span[class*="experience"]');
    const postedDate = text('.jd-header-date, span[class*="posted"]');
    const description = articleText(
      ['.dang-inner-html', 'section.job-desc, div.job-desc, section[class*="jd-desc"]', 'main'],
      1200
    );

    return {
      company,
      role,
      location: location.length <= 80 ? location : '',
      description,
      salary,
      experience,
      postedDate,
      employmentType: '',
      workMode: '',
    };
  },
};
