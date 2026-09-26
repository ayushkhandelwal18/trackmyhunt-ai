// Indeed extractor: indeed.com job views (plus A/B variants).
// Interface: { id, label, matches(url), extract(ctx) -> Partial<JobData> }.

function text(selector) {
  try {
    const node = document.querySelector(selector);
    return node && node.textContent ? node.textContent.trim() : '';
  } catch {
    return '';
  }
}

export const IndeedExtractor = {
  id: 'indeed',
  label: 'Indeed',

  matches(url) {
    return !!url && url.includes('indeed.com');
  },

  extract() {
    let role = text('h2.jobsearch-JobInfoHeader-title, h1.jobsearch-JobInfoHeader-title, .jobsearch-JobInfoHeader-title span');
    let company = text('[data-company-name="true"] a, [data-company-name="true"], .jobsearch-CompanyInfoContainer a, .jobsearch-JobInfoHeader-subtitle span a, .jobsearch-JobInfoHeader-subtitle span');

    if (!role || !company) {
      const fallbackTitle = (() => {
        try {
          return document.querySelector('div.jobsearch-RightPane h2, div.jobsearch-ViewJobLayout-jobDisplay h2');
        } catch {
          return null;
        }
      })();
      if (fallbackTitle && !role) {
        role = fallbackTitle.textContent.trim();
        if (!company && fallbackTitle.nextElementSibling) {
          company = fallbackTitle.nextElementSibling.textContent.trim();
        }
      }
    }

    // Guard against list/search chrome leaking in.
    if (role.toLowerCase().includes('job search')) role = '';
    if (company.toLowerCase() === 'indeed') company = '';

    let location = '';
    const subtitle = text('.jobsearch-JobInfoHeader-subtitle');
    if (subtitle) {
      location = subtitle.split('\n').map((s) => s.trim()).filter(Boolean)[0] || '';
      if (location.length > 80) location = '';
    }

    let description = '';
    const descNode = (() => {
      try {
        return document.querySelector('#jobDescriptionText, .jobsearch-jobDescriptionText');
      } catch {
        return null;
      }
    })();
    if (descNode && descNode.innerText) {
      description = descNode.innerText.replace(/\s+/g, ' ').trim().slice(0, 1200);
    }

    return { company, role, location, description, employmentType: '', workMode: '' };
  },
};
