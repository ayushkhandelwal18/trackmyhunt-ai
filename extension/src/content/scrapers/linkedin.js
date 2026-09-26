// LinkedIn extractor: linkedin.com/jobs (search list, detail view, direct URLs).
// Interface: { id, label, matches(url), extract(ctx) -> Partial<JobData> }.
//
// Strategy: classic top-card selectors first (fast path for the stable
// layout), then a class-independent semantic layer scoped to the detail
// pane (h2 title, /company/ link, metadata line, insight pills, "About
// the job" section, currentJobId URL). The semantic layer is what saves
// search-results pages when LinkedIn rotates generated class names.

function query(selector, root) {
  try {
    return (root || document).querySelector(selector);
  } catch {
    return null;
  }
}

function textOf(node) {
  return node && node.textContent ? node.textContent.trim() : '';
}

// First non-empty text across selector candidates, optionally scoped.
function firstText(selectors, root) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (const selector of list) {
    const value = textOf(query(selector, root));
    if (value) return value;
  }
  return '';
}

// The right-side detail pane (or main job column on direct pages).
// Returns the scoped root, or null when no detail pane can be identified.
// Strategy: known LinkedIn containers first, then a structural anchor —
// the Apply button, which only exists alongside a real job detail —
// walking up to the smallest content-rich ancestor. NEVER document-wide:
// without a scope, title/location lookups would mix list, widget, and
// detail content (the stale-data and wrong-field bugs).
// Bare `main`/document is deliberately NOT a scope: on search pages it
// contains the left job list too.
function findDetailContainer() {
  const candidates = [
    '.jobs-search__job-details--container',
    '.jobs-details__main-content',
    '.scaffold-layout__detail',
  ];
  for (const selector of candidates) {
    const node = query(selector);
    if (node && node.textContent && node.textContent.trim().length > 40) {
      return node;
    }
  }
  return findDetailByApplyButton();
}

// Structural fallback: locate an Apply button (stable LinkedIn vocabulary
// present only where a job can be acted on) and take the smallest ancestor
// rich enough to be the detail pane.
function findDetailByApplyButton() {
  try {
    const buttons = document.querySelectorAll('button, a');
    for (const button of buttons) {
      const label = button.textContent ? button.textContent.trim() : '';
      if (!/^apply\b/i.test(label) && !/easy apply/i.test(label)) continue;
      // Smallest ancestor rich enough to be the detail pane (not a bare
      // button row, and never the whole page body via runaway walk-up:
      // the loop caps at 10 levels and requires real content).
      let node = button.parentElement;
      for (let level = 0; level < 10 && node && node.nodeType === 1; level++) {
        const text = node.textContent ? node.textContent.trim() : '';
        if (text.length >= 150) return node;
        node = node.parentElement;
      }
      if (button.parentElement) return button.parentElement;
    }
  } catch {
    // ignore
  }
  return null;
}

// Generic UI/help headings are never job titles. Small pattern set (not a
// company blacklist): questions, feedback widgets, upsell cards, page chrome.
const UI_TITLE_BLOCK = /(helpful\?|are these results|premium|^beta\b|show match|tailor my|messaging|learn more|how promoted|jobs based on|^sign in|^join now|apply now|^job details$|you'd be)/i;

function isPlausibleTitle(text) {
  if (!text) return false;
  const t = String(text).replace(/\s+/g, ' ').trim();
  if (t.length < 3 || t.length > 140) return false;
  if (t.endsWith('?')) return false;
  if (UI_TITLE_BLOCK.test(t)) return false;
  return true;
}

// Document-order index list for proximity ranking (nearest candidate to the
// company anchor wins).
function documentOrderList(root) {
  const list = [];
  const walk = (node) => {
    if (!node) return;
    if (node.nodeType === 1) {
      list.push(node);
      const kids = node.childNodes || node.children || [];
      for (const child of kids) walk(child);
    }
  };
  try {
    walk(root);
  } catch {
    // ignore
  }
  return list;
}

// Job title: classic top-card selectors first (validated), then candidate
// h1/h2 headings inside the detail pane ranked by proximity to the company
// anchor — so feedback widgets and upsell cards can never win over the
// actual job heading. Never document-wide generic heading selection.
function extractTitle(detail) {
  const classic = firstText([
    '.job-details-jobs-unified-top-card__job-title',
    '.jobs-unified-top-card__job-title',
    '.jobs-details__main-content h1',
    'h1.t-24',
    '.job-details-jobs-unified-top-card__job-title a',
  ]);
  if (isPlausibleTitle(classic)) return classic;

  const scope = detail || null;
  if (!scope || !scope.querySelectorAll) return '';
  let candidates = [];
  try {
    const nodes = scope.querySelectorAll('h1, h2');
    for (const node of nodes) {
      const text = node.textContent ? node.textContent.replace(/\s+/g, ' ').trim() : '';
      if (isPlausibleTitle(text)) candidates.push({ text, node });
    }
  } catch {
    return '';
  }
  if (!candidates.length) return '';
  candidates = candidates.slice(0, 12);

  let anchor = null;
  try {
    anchor =
      scope.querySelector('a[href*="/company/"]') ||
      [...scope.querySelectorAll('button')].find((b) =>
        /^apply\b/i.test(b.textContent ? b.textContent.trim() : '')
      ) ||
      null;
  } catch {
    anchor = null;
  }
  if (!anchor) return candidates[0].text;
  const orderRoot = scope.documentElement || scope;
  const order = documentOrderList(orderRoot);
  const anchorIndex = order.indexOf(anchor);
  if (anchorIndex < 0) return candidates[0].text;
  let best = candidates[0];
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    const distance = Math.abs(order.indexOf(candidate.node) - anchorIndex);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best.text;
}

// Company: /company/ profile links inside the detail pane are the most
// stable signal on LinkedIn (class names rotate; link paths do not).
function extractCompany(detail) {
  if (detail) {
    try {
      const links = detail.querySelectorAll('a[href*="/company/"]');
      for (const link of links) {
        const name = link && link.textContent ? link.textContent.trim() : '';
        if (name && name.length <= 80 && !/^(jobs|careers|home|linkedin)$/i.test(name)) {
          return name;
        }
      }
    } catch {
      // fall through to classic selectors
    }
  }
  return firstText([
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name',
    '.job-details-jobs-unified-top-card__primary-description span',
  ]);
}

// Location validation: rejects accessibility/control text ("Selected, …"),
// help/feedback strings, and echoes of the job title itself. Generic rules,
// no company-specific logic.
function isPlausibleLocation(value, role) {
  if (!value) return false;
  const text = String(value).split('·')[0].trim();
  if (!text || text.length > 80) return false;
  if (/^\s*selected\b/i.test(text)) return false;
  if (/results|helpful|premium|^beta\b|sign in|join now|apply now|messaging/i.test(text)) return false;
  if (role) {
    const head = role.trim().slice(0, 24).toLowerCase();
    if (head.length >= 16 && text.toLowerCase().includes(head)) return false;
  }
  return true;
}

// Structural location: the metadata line directly following the extracted
// title heading. Works for ANY city worldwide with no gazetteer, because
// LinkedIn always renders [company row] [title] [metadata line] [pills].
function extractLocationAfterTitle(detail, role) {
  if (!detail || !role) return '';
  try {
    const headings = detail.querySelectorAll('h1, h2');
    for (const heading of headings) {
      const headingText = heading.textContent
        ? heading.textContent.replace(/\s+/g, ' ').trim()
        : '';
      if (headingText !== role) continue;
      let sibling = heading.nextElementSibling;
      for (let hops = 0; sibling && hops < 4; hops++) {
        const text = sibling.textContent
          ? sibling.textContent.replace(/\s+/g, ' ').trim()
          : '';
        if (text) {
          const candidate = text.split('·')[0].trim();
          // Position is the evidence here (line right after the title), so
          // accept comma/place lines plus digit-free lines of real length.
          // Digit-led lines ("1 connection works here") are never locations.
          const looksLikePlace =
            /,/.test(candidate) ||
            /\b(remote|hybrid|on-?site|bengaluru|hyderabad|delhi|mumbai|chennai|pune|kolkata|noida|gurgaon|gandhinagar|india|karnataka|telangana|maharashtra)\b/i.test(
              candidate
            ) ||
            (!/\d/.test(candidate) && candidate.length >= 8);
          if (looksLikePlace && isPlausibleLocation(candidate, role)) {
            return candidate;
          }
          // First non-empty sibling is THE metadata line: do not wander.
          return '';
        }
        sibling = sibling.nextElementSibling;
      }
      return '';
    }
  } catch {
    // fall through
  }
  return '';
}

// Location: metadata line head ("Bengaluru, Karnataka, India · ..."),
// then the title-following structural line, else any plausible place-like
// line inside the detail pane.
function extractLocation(detail, role) {
  if (detail) {
    const secondary = firstText(
      [
        '.job-details-jobs-unified-top-card__primary-description',
        '.jobs-unified-top-card__primary-description',
      ],
      detail
    );
    if (secondary) {
      const head = secondary.split('·')[0].trim();
      if (isPlausibleLocation(head, role)) return head;
    }
    // Structural: metadata line right after the title heading.
    const structural = extractLocationAfterTitle(detail, role);
    if (structural) return structural;
  }
  if (detail) {
    try {
      const walker = [];
      const push = (node) => {
        if (!node) return;
        if (node.nodeType === 3) {
          const text = node.textContent.trim();
          if (text) walker.push(text);
          return;
        }
        if (node.nodeType === 1) {
          for (const child of node.childNodes) push(child);
        }
      };
      push(detail);
      const joined = walker.join('\n');
      const line = joined
        .split('\n')
        .map((s) => s.trim())
        .find(
          (s) =>
            s.length > 2 &&
            s.length <= 80 &&
            /[A-Za-z]/.test(s) &&
            (/,/.test(s) ||
              /\b(remote|hybrid|on-?site|bengaluru|hyderabad|delhi|mumbai|chennai|pune|kolkata|noida|gurgaon|gandhinagar|india|karnataka|telangana|maharashtra)\b/i.test(
                s
              )) &&
            isPlausibleLocation(s, role)
        );
      if (line) return line.split('·')[0].trim();
    } catch {
      // fall through
    }
  }
  return '';
}

// Employment pills ("✓ Full-time", "✓ On-site", "Hybrid"): match short leaf
// texts against known vocabularies instead of generated classes.
const EMPLOYMENT_WORDS = ['full-time', 'full time', 'part-time', 'part time', 'contract', 'temporary', 'internship', 'intern'];
const WORKMODE_WORDS = ['remote', 'hybrid', 'on-site', 'on site', 'work from home', 'wfh'];

function extractPills(detail) {
  const found = { employmentType: '', workMode: '' };
  // Detail scope only: document-wide pill scans mix jobs from the list.
  if (!detail || !detail.querySelectorAll) return found;
  try {
    const nodes = detail.querySelectorAll('li, span, div');
    for (const node of nodes) {
      if (found.employmentType && found.workMode) break;
      // Leaf-only: skip containers so list text never matches.
      if (node.children && node.children.length > 0) continue;
      const text = node.textContent ? node.textContent.replace(/^[✓✔√]+\s*/, '').trim().toLowerCase() : '';
      if (!text || text.length > 24) continue;
      if (!found.employmentType && EMPLOYMENT_WORDS.includes(text)) {
        found.employmentType = node.textContent.replace(/^[✓✔√]+\s*/, '').trim();
      }
      if (!found.workMode && WORKMODE_WORDS.includes(text)) {
        found.workMode = node.textContent.replace(/^[✓✔√]+\s*/, '').trim();
      }
    }
  } catch {
    // ignore
  }
  return found;
}

// Description: the "About the job" section of the detail pane first,
// then classic containers. Never the search list or page chrome.
function extractDescription(detail) {
  const findAboutSection = (root) => {
    if (!root || !root.querySelectorAll) return '';
    try {
      const headings = root.querySelectorAll('h1, h2, h3, h4');
      for (const heading of headings) {
        const label = heading.textContent ? heading.textContent.trim().toLowerCase() : '';
        if (label === 'about the job' || label === 'about the role' || label === 'job description') {
          const section = heading.parentElement;
          if (section && section.innerText) {
            const text = section.innerText.replace(/\s+/g, ' ').trim();
            if (text.length >= 120) return text.slice(0, 1200);
          }
        }
      }
    } catch {
      // ignore
    }
    return '';
  };

  if (detail) {
    const section = findAboutSection(detail);
    if (section) return section;
  }
  const descNode = query('.jobs-description__content, .jobs-box__html-content, #job-details');
  if (descNode && descNode.innerText) {
    return descNode.innerText.replace(/\s+/g, ' ').trim().slice(0, 1200);
  }
  return '';
}

// Canonical job URL: currentJobId in the search URL maps to /jobs/view/<id>/.
function extractJobUrl() {
  try {
    const href = window.location.href;
    const match = href.match(/[?&]currentJobId=(\d+)/);
    if (match) {
      return `https://www.linkedin.com/jobs/view/${match[1]}/`;
    }
    return href.split('#')[0];
  } catch {
    return '';
  }
}

export const LinkedInExtractor = {
  id: 'linkedin',
  label: 'LinkedIn',

  matches(url) {
    return !!url && url.includes('linkedin.com/jobs');
  },

  extract() {
    const detail = findDetailContainer();
    const role = extractTitle(detail);
    const company = extractCompany(detail);
    const location = extractLocation(detail, role);
    const pills = extractPills(detail);
    const description = extractDescription(detail);
    const jobUrl = extractJobUrl();

    return {
      company,
      role,
      location,
      description,
      employmentType: pills.employmentType,
      workMode: pills.workMode,
      jobUrl,
    };
  },
};
