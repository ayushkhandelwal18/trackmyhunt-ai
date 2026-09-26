// Meta/OpenGraph layer: secondary evidence only. Never trusted alone for
// company/role, but useful corroboration and canonical-URL source.

function metaContent(...selectors) {
  for (const selector of selectors) {
    try {
      const node = document.querySelector(selector);
      const value = node && node.getAttribute && node.getAttribute('content');
      if (value && value.trim()) return value.trim();
    } catch { /* ignore bad selectors per page */ }
  }
  return '';
}

export function extractMeta() {
  return {
    role: '',
    company: metaContent(
      'meta[property="og:site_name"]',
      'meta[name="twitter:site"]',
      'meta[name="author"]'
    ),
    description: metaContent('meta[property="og:description"]', 'meta[name="twitter:description"]', 'meta[name="description"]'),
    jobUrl: metaContent('meta[property="og:url"]'),
    title: metaContent('meta[property="og:title"]', 'meta[name="twitter:title"]'),
  };
}
