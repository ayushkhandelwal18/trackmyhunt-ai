// Minimal fake DOM for offline extractor tests (no jsdom dependency).
// Supports the selector shapes used by the extension extractors:
// tag, .class(.class)*, tag.class, [attr="v"], [attr^="v"], tag[attr],
// comma groups, and single-level descendant combinators ("A B").

function makeTextNode(text, parent) {
  return {
    nodeType: 3,
    textContent: String(text),
    parentElement: parent,
  };
}

export function el(tag, options = {}) {
  const allKids = [];
  const node = {
    nodeType: 1,
    tagName: String(tag).toUpperCase(),
    classes: [...(options.classes || [])],
    attrs: { ...(options.attrs || {}) },
    parentElement: null,
    nextElementSibling: null,
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
    },
  };
  // children: element children only (like real DOM). childNodes: all kids.
  Object.defineProperty(node, 'children', {
    get() {
      return allKids.filter((c) => c.nodeType === 1);
    },
  });
  Object.defineProperty(node, 'childNodes', {
    get() {
      return allKids;
    },
  });
  const kids = options.children || [];
  let prevElement = null;
  for (const kid of kids) {
    let child;
    if (typeof kid === 'string') {
      child = makeTextNode(kid, node);
    } else {
      child = kid;
      child.parentElement = node;
      if (prevElement) prevElement.nextElementSibling = child;
      prevElement = child;
    }
    allKids.push(child);
  }
  Object.defineProperty(node, 'firstChild', {
    get() {
      return allKids.length ? allKids[0] : null;
    },
  });
  Object.defineProperty(node, 'textContent', {
    get() {
      return allKids.map((c) => c.textContent).join('');
    },
  });
  Object.defineProperty(node, 'innerText', {
    get() {
      return allKids.map((c) => (c.nodeType === 3 ? c.textContent : c.innerText)).join('\n');
    },
  });
  node.querySelector = (selector) => querySelector(node, selector);
  node.querySelectorAll = (selector) => querySelectorAll(node, selector);
  return node;
}

function parseCompound(part) {
  const out = { tag: null, classes: [], attrs: [] };
  const tagMatch = part.match(/^([a-zA-Z][a-zA-Z0-9]*)/);
  let rest = part;
  if (tagMatch) {
    out.tag = tagMatch[1].toUpperCase();
    rest = part.slice(tagMatch[1].length);
  }
  const re = /(\.[a-zA-Z0-9_-]+|\[[^\]]+\])/g;
  let m;
  while ((m = re.exec(rest)) !== null) {
    const token = m[0];
    if (token.startsWith('.')) {
      out.classes.push(token.slice(1));
    } else {
      const attr = token.slice(1, -1);
      const eq = attr.match(/^([a-zA-Z0-9_:-]+)(\^=|\*=|=)"([^"]*)"$/);
      if (eq) out.attrs.push({ name: eq[1], op: eq[2], value: eq[3] });
      else out.attrs.push({ name: attr, op: 'exists', value: '' });
    }
  }
  return out;
}

function matchesCompound(node, compound) {
  if (node.nodeType !== 1) return false;
  if (compound.tag && node.tagName !== compound.tag) return false;
  for (const cls of compound.classes) {
    if (!node.classes.includes(cls)) return false;
  }
  for (const attr of compound.attrs) {
    const value = node.getAttribute(attr.name);
    if (value === null || value === undefined) return false;
    if (attr.op === '=') {
      // Case-insensitive compare (matches job-board class casing drift).
      if (String(value).toLowerCase() !== attr.value.toLowerCase()) return false;
    } else if (attr.op === '^=') {
      if (!String(value).startsWith(attr.value)) return false;
    } else if (attr.op === '*=') {
      if (!String(value).includes(attr.value)) return false;
    }
  }
  return true;
}

function descendants(root, compound, out) {
  for (const child of root.children || []) {
    if (child.nodeType === 1) {
      if (matchesCompound(child, compound)) out.push(child);
      descendants(child, compound, out);
    }
  }
  return out;
}

function querySequence(root, sequence) {
  const parts = sequence.trim().split(/\s+/).map(parseCompound);
  let current = [root];
  for (const part of parts) {
    const next = [];
    for (const node of current) descendants(node, part, next);
    current = next;
    if (!current.length) return [];
  }
  return current;
}

function querySelectorAll(root, selector) {
  const out = [];
  for (const sequence of String(selector).split(',')) {
    if (!sequence.trim()) continue;
    for (const node of querySequence(root, sequence)) {
      if (!out.includes(node)) out.push(node);
    }
  }
  return out;
}

function querySelector(root, selector) {
  const all = querySelectorAll(root, selector);
  return all.length ? all[0] : null;
}

export function makeDocument({ title = '', url = 'https://example.com/', bodyChildren = [], headChildren = [] } = {}) {
  const head = el('head', { children: headChildren });
  const body = el('body', { children: bodyChildren });
  const html = el('html', { children: [head, body] });
  const doc = {
    title,
    body,
    documentElement: html,
    querySelector: (selector) => querySelector(html, selector),
    querySelectorAll: (selector) => querySelectorAll(html, selector),
  };
  const win = {
    location: { href: url, pathname: new URL(url).pathname },
  };
  return { doc, win };
}

export function installGlobals(doc, win) {
  globalThis.document = doc;
  globalThis.window = win;
}
