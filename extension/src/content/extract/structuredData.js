// Structured-data layer: schema.org JobPosting in application/ld+json.
// Highest-confidence source. Never throws: one malformed block must not
// break the whole page. Handles arrays, @graph, and nested objects.

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function firstText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = firstText(item);
      if (text) return text;
    }
    return '';
  }
  if (typeof value === 'object') {
    return firstText(value.name || value.address || value.title);
  }
  return '';
}

function collectJobPostings() {
  const postings = [];
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  scripts.forEach((node) => {
    let json;
    try {
      json = JSON.parse(node.textContent || '');
    } catch {
      return; // malformed block: skip, never crash
    }
    const walk = (obj) => {
      for (const item of asArray(obj)) {
        if (!item || typeof item !== 'object') continue;
        const types = asArray(item['@type']).map((t) => String(t).toLowerCase());
        if (types.includes('jobposting')) {
          postings.push(item);
          continue;
        }
        if (item['@graph']) walk(item['@graph']);
        if (item.mainEntity) walk(item.mainEntity);
      }
    };
    walk(json);
  });
  return postings;
}

function locationText(loc) {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  const parts = [];
  const addr = loc.address || loc;
  if (typeof addr === 'string' && addr && !parts.includes(addr)) parts.push(addr);
  if (addr && typeof addr === 'object') {
    for (const key of ['addressLocality', 'addressRegion', 'addressCountry', 'postalCode']) {
      if (addr[key] && !parts.includes(addr[key])) parts.push(addr[key]);
    }
  }
  if (loc.name && !parts.includes(loc.name)) parts.unshift(loc.name);
  return parts.filter(Boolean).join(', ');
}

function salaryText(salary) {
  if (!salary) return '';
  if (typeof salary === 'string') return salary;
  const values = asArray(salary.value || salary);
  const amounts = values
    .map((v) => (v && typeof v === 'object' ? v.value || v.minValue || v.maxValue : v))
    .filter((v) => v !== undefined && v !== null && v !== '');
  if (!amounts.length) return '';
  const currency = salary.currency || (values[0] && values[0].currency) || '';
  const unit = salary.unitText || '';
  return [amounts.join(' - '), currency, unit].filter(Boolean).join(' ').trim();
}

function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  // Regex tag-stripping on purpose: never assign untrusted HTML to the DOM.
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

export function extractStructuredData() {
  const postings = collectJobPostings();
  if (!postings.length) return null;
  // Prefer the posting whose URL matches this page, else the first.
  const here = window.location.href.split('#')[0];
  const posting =
    postings.find((p) => typeof p.url === 'string' && here.startsWith(p.url.split('?')[0])) ||
    postings[0];

  const org = posting.hiringOrganization || {};
  return {
    role: firstText(posting.title),
    company: firstText(org.name || org),
    location: locationText(asArray(posting.jobLocation)[0] || posting.jobLocation),
    employmentType: firstText(posting.employmentType),
    salary: salaryText(posting.baseSalary || posting.salary),
    postedDate: firstText(posting.datePosted),
    applicationDeadline: firstText(posting.validThrough),
    description: stripHtml(firstText(posting.description)),
    jobId: firstText(posting.identifier && (posting.identifier.value || posting.identifier.name)),
    jobUrl: typeof posting.url === 'string' ? posting.url : '',
  };
}
