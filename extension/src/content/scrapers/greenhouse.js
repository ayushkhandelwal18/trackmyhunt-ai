// Greenhouse extractor: greenhouse.io boards and candidate portal.
// Interface: { id, label, matches(url), extract(ctx) -> Partial<JobData> }.

function text(selector, root) {
  try {
    const node = (root || document).querySelector(selector);
    return node && node.textContent ? node.textContent.trim() : '';
  } catch {
    return '';
  }
}

export const GreenhouseExtractor = {
  id: 'greenhouse',
  label: 'Greenhouse',

  matches(url) {
    return !!url && url.includes('greenhouse.io');
  },

  extract() {
    let role = text('h1.app-title');
    let company = text('span.company-name').replace(/^at\s+/i, '').trim();

    // Candidate portal (MyGreenhouse) exact selectors.
    if (!company) {
      const modalCompany = text('h3.application-form-header--company-name');
      if (modalCompany) {
        company = modalCompany;
        try {
          const header = document.querySelector('h3.application-form-header--company-name');
          const prev = header && header.previousElementSibling;
          if (prev && prev.textContent) role = role || prev.textContent.trim();
        } catch { /* layout varies */ }
      }
    }

    // Generic fallback for modals: title, then the line right below it.
    if (!role) {
      const titleNode = (() => {
        try {
          return document.querySelector('[role="dialog"] h1, [role="dialog"] h2, h1, h2');
        } catch {
          return null;
        }
      })();
      if (titleNode) {
        role = titleNode.textContent.trim();
        if (!company) {
          try {
            const lines = titleNode.parentElement.innerText.split('\n').map((s) => s.trim()).filter(Boolean);
            const idx = lines.findIndex((t) => t === role);
            const next = idx >= 0 ? lines[idx + 1] : '';
            if (next && next.length < 50) company = next;
          } catch {
            if (titleNode.nextElementSibling) company = titleNode.nextElementSibling.textContent.trim();
          }
        }
      }
    }

    if (/^mygreenhouse$|^greenhouse$/i.test(role)) role = '';

    // Title parsing fallback.
    if (!role || !company) {
      const pageTitle = document.title || '';
      if (pageTitle.includes('-')) {
        const parts = pageTitle.split('-');
        if (!company) company = parts[0].trim();
        if (!role) role = parts.slice(1).join('-').trim();
      }
    }

    let location = '';
    const locationNode = text('.location, .job__location');
    if (locationNode && locationNode.length <= 80) location = locationNode;

    let description = '';
    const descNode = (() => {
      try {
        return document.querySelector('.job__description, [class*="job-description"]');
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
