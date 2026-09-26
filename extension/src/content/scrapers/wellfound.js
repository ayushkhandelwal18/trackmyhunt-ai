// Wellfound extractor: job pages (/jobs/, /role/) and company pages.
// Interface: { id, label, matches(url), extract(ctx) -> Partial<JobData> }.

function text(selector) {
  try {
    const node = document.querySelector(selector);
    return node && node.textContent ? node.textContent.trim() : '';
  } catch {
    return '';
  }
}

export const WellfoundExtractor = {
  id: 'wellfound',
  label: 'Wellfound',

  matches(url) {
    return !!url && url.includes('wellfound.com');
  },

  extract() {
    let role = '';
    let company = '';
    const h1 = text('h1');
    const isJobPage =
      window.location.pathname.includes('/jobs/') || window.location.pathname.includes('/role/');

    if (isJobPage) {
      role = h1;
      company = text('a[href^="/company/"]');
    } else {
      // Company page: h1 is the company; role stays empty (multiple jobs listed).
      if (h1) company = h1.replace(/careers/i, '').trim();
    }

    if (!company) {
      const pageTitle = document.title || '';
      if (pageTitle.toLowerCase().includes('careers')) {
        company = pageTitle.split('Careers')[0].trim();
      } else if (pageTitle.includes('|')) {
        company = pageTitle.split('|')[0].trim();
      }
    }

    if (/careers|wellfound/i.test(role)) role = '';
    if (company.toLowerCase().endsWith('careers')) {
      company = company.slice(0, -7).trim();
    }

    return { company, role, location: '', description: '', employmentType: '', workMode: '' };
  },
};
