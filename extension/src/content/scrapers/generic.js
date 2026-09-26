// Generic extractor: title/meta heuristics for any other job page.
// Interface: { id, label, matches(url), extract(ctx) -> Partial<JobData> }.
// Always last in the registry: matches everything.

function metaContent(...selectors) {
  for (const selector of selectors) {
    try {
      const node = document.querySelector(selector);
      const value = node && node.getAttribute && node.getAttribute('content');
      if (value && value.trim()) return value.trim();
    } catch { /* ignore */ }
  }
  return '';
}

export const GenericExtractor = {
  id: 'generic',
  label: 'Generic',

  matches() {
    return true;
  },

  extract() {
    const title = metaContent('meta[property="og:title"]', 'meta[name="twitter:title"]') || document.title || '';
    let role = title;
    let company = '';

    if (title.includes(' at ')) {
      const parts = title.split(' at ');
      role = parts[0].trim();
      company = parts[1].split('-')[0].trim();
    } else if (title.includes('|')) {
      const parts = title.split('|');
      role = parts[0].trim();
      company = parts[1].trim();
    } else if (title.includes('-')) {
      const parts = title.split('-');
      if (parts.length === 2) {
        role = parts[0].trim();
        company = parts[1].trim();
      }
    }

    return { company, role, location: '', description: '', employmentType: '', workMode: '' };
  },
};
