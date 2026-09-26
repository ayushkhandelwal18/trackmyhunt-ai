// Tiny guarded DOM helpers shared by every extractor. Never throws.

export function text(selector, root) {
  try {
    const node = (root || document).querySelector(selector);
    return node && node.textContent ? node.textContent.trim() : '';
  } catch {
    return '';
  }
}

export function allText(selector, root, limit) {
  try {
    const nodes = (root || document).querySelectorAll(selector);
    const out = [];
    nodes.forEach((node) => {
      const t = node && node.textContent ? node.textContent.trim() : '';
      if (t) out.push(t);
      if (limit && out.length >= limit) return;
    });
    return out;
  } catch {
    return [];
  }
}

// Find a value next to a visible label ("Location", "Employment Type", ...).
// Matches "Label" headings/cells and reads the adjacent value node.
export function labeledValue(labels) {
  const wanted = labels.map((l) => l.toLowerCase());
  try {
    const candidates = document.querySelectorAll('dt, th, b, strong, span, div, p, h1, h2, h3, h4, h5, label');
    for (const node of candidates) {
      const own = (node.firstChild && node.firstChild.nodeType === 3 ? node.firstChild.textContent : node.textContent) || '';
      const label = own.trim().replace(/[:\s]+$/, '').toLowerCase();
      if (!wanted.includes(label)) continue;
      // Value: next sibling, or parent's next text chunk.
      const sib = node.nextElementSibling;
      if (sib && sib.textContent && sib.textContent.trim()) {
        const value = sib.textContent.replace(/\s+/g, ' ').trim();
        if (value && value.length <= 160 && value.toLowerCase() !== label) return value;
      }
      const parent = node.parentElement;
      if (parent) {
        const full = parent.textContent.replace(/\s+/g, ' ').trim();
        const rest = full.slice(node.textContent.trim().length).trim().replace(/^[:\-–—]\s*/, '');
        if (rest && rest.length <= 160) return rest;
      }
    }
  } catch { /* layout varies */ }
  return '';
}

// Largest readable article-ish container, cleaned and capped.
export function articleText(selectors, max) {
  for (const selector of selectors) {
    try {
      const node = document.querySelector(selector);
      if (node && node.innerText) {
        const text = node.innerText.replace(/\s+/g, ' ').trim();
        if (text.length >= 120) return text.slice(0, max || 1200);
      }
    } catch { /* ignore */ }
  }
  return '';
}
