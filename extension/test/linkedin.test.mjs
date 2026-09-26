// Offline LinkedIn extraction tests against synthetic search-results DOM.
// No browser, no network: a minimal fake DOM plus the REAL pipeline and
// LinkedIn extractor. Run: node --test test/
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { el, makeDocument, installGlobals } from './fakeDom.mjs';
import { extractJob } from '../src/content/extract/pipeline.js';
import { LinkedInExtractor } from '../src/content/scrapers/linkedin.js';
import { detectPlatform } from '../src/content/extract/detectPlatform.js';

const SEARCH_URL =
  'https://www.linkedin.com/jobs/search-results/?currentJobId=4470355438&keywords=software%20engineer%20Internship';

function searchPageWithSelection() {
  const list = el('div', {
    classes: ['jobs-search-results-list'],
    children: [
      el('div', {
        classes: ['job-card-container__job-title'],
        children: ['Web App Intern (AI-Assisted Development, REST APIs)'],
      }),
      el('div', { children: ['BEMPU Health'] }),
      el('div', { children: ['Bengaluru'] }),
    ],
  });
  const detail = el('div', {
    classes: ['job-details'],
    children: [
      el('h1', {
        classes: ['job-details-jobs-unified-top-card__job-title'],
        children: ['Software Application Engineer- Apprenticeship'],
      }),
      el('div', {
        classes: ['job-details-jobs-unified-top-card__company-name'],
        children: ['Nbyula - Skillizens without Borders'],
      }),
      el('div', {
        classes: ['job-details-jobs-unified-top-card__primary-description'],
        children: ['Bengaluru, Karnataka, India · 1 year ago · Over 100 people clicked apply'],
      }),
      el('div', {
        classes: ['jobs-description__content'],
        children: [
          'About the role. Build REST APIs with Node.js. Requirements: JavaScript, teamwork.',
        ],
      }),
      el('button', { children: ['Apply'] }),
      el('span', { children: ['Full-time'] }),
    ],
  });
  return makeDocument({
    title: 'Software Application Engineer- Apprenticeship | LinkedIn',
    url: SEARCH_URL,
    bodyChildren: [list, detail],
  });
}

function searchPageNoSelection() {
  return makeDocument({
    title: 'Software engineer Internship jobs | LinkedIn',
    url: 'https://www.linkedin.com/jobs/search-results/?keywords=intern',
    bodyChildren: [
      el('div', {
        classes: ['jobs-search-results-list'],
        children: [
          el('div', { classes: ['job-card-container__job-title'], children: ['Web App Intern'] }),
          el('div', { children: ['BEMPU Health'] }),
        ],
      }),
    ],
  });
}

function directViewPage() {
  const ld = el('script', {
    attrs: { type: 'application/ld+json' },
    children: [
      JSON.stringify({
        '@type': 'JobPosting',
        title: 'Backend Developer intern',
        hiringOrganization: { name: 'Garnish Company' },
        jobLocation: { address: { addressLocality: 'Hyderabad', addressCountry: 'IN' } },
        employmentType: 'INTERN',
        url: 'https://www.linkedin.com/jobs/view/999/',
      }),
    ],
  });
  return makeDocument({
    title: 'Backend Developer intern | LinkedIn',
    url: 'https://www.linkedin.com/jobs/view/999/',
    headChildren: [ld],
    bodyChildren: [
      el('h1', {
        classes: ['job-details-jobs-unified-top-card__job-title'],
        children: ['Backend Developer intern'],
      }),
      el('div', {
        classes: ['job-details-jobs-unified-top-card__company-name'],
        children: ['Garnish Company'],
      }),
    ],
  });
}

function bareListingPage() {
  const links = [];
  for (let i = 0; i < 10; i++) {
    links.push(el('a', { attrs: { href: `/jobs/${i}` }, children: [`Job ${i}`] }));
  }
  return makeDocument({
    title: 'Careers at Acme',
    url: 'https://acme.example.com/careers/',
    bodyChildren: [el('h1', { children: ['Open roles'] }), ...links],
  });
}

describe('LinkedIn URL + platform detection', () => {
  it('recognizes view, search, and search-results URLs as linkedin', () => {
    assert.equal(detectPlatform('https://www.linkedin.com/jobs/view/4470355438/'), 'linkedin');
    assert.equal(detectPlatform('https://www.linkedin.com/jobs/search/?keywords=x'), 'linkedin');
    assert.equal(detectPlatform(SEARCH_URL), 'linkedin');
  });

  it('LinkedInExtractor.matches covers search-results pages', () => {
    assert.equal(LinkedInExtractor.matches(SEARCH_URL), true);
    assert.equal(LinkedInExtractor.matches('https://www.linkedin.com/jobs/view/1/'), true);
  });
});

describe('CASE 2: search-results with a selected job', () => {
  beforeEach(() => {
    const { doc, win } = searchPageWithSelection();
    installGlobals(doc, win);
  });

  it('extracts the SELECTED job, not the list', () => {
    const { platform, data } = extractJob();
    assert.equal(platform, 'linkedin');
    assert.equal(data.role, 'Software Application Engineer- Apprenticeship');
    assert.equal(data.company, 'Nbyula - Skillizens without Borders');
    assert.ok(data.location.startsWith('Bengaluru, Karnataka, India'));
    assert.ok(data.description.includes('About the role'));
    assert.ok(!data.description.includes('BEMPU Health'));
    assert.equal(data.isListingPage, false);
  });

  it('prefers the canonical /jobs/view/ URL over the search URL', () => {
    const { data } = extractJob();
    assert.equal(data.applicationLink, 'https://www.linkedin.com/jobs/view/4470355438/');
  });

  it('detects Full-time employment type from page text', () => {
    const { data } = extractJob();
    // Page-level type signal: any backend-enum value, never invented.
    assert.ok(['Intern', 'Full-Time', 'Remote', 'Freelance', 'Intern + Offer', 'Other'].includes(data.type));
  });
});

describe('CASE 6: search page with no selected job', () => {
  beforeEach(() => {
    const { doc, win } = searchPageNoSelection();
    installGlobals(doc, win);
  });

  it('returns empty company/role on the linkedin platform (never a random job)', () => {
    const { platform, data } = extractJob();
    assert.equal(platform, 'linkedin');
    assert.equal(data.company, '');
    assert.equal(data.role, '');
    assert.equal(data.isListingPage, false);
  });
});

describe('CASE 1: direct /jobs/view/ page with JSON-LD', () => {
  beforeEach(() => {
    const { doc, win } = directViewPage();
    installGlobals(doc, win);
  });

  it('prefers structured data for role/company/location', () => {
    const { platform, data } = extractJob();
    assert.equal(platform, 'linkedin');
    assert.equal(data.role, 'Backend Developer intern');
    assert.equal(data.company, 'Garnish Company');
    assert.ok(data.location.includes('Hyderabad'));
    assert.equal(data.confidence.role, 0.95);
  });
});

describe('listing guard: bare careers index is not a job', () => {
  beforeEach(() => {
    const { doc, win } = bareListingPage();
    installGlobals(doc, win);
  });

  it('flags the listing page instead of inventing a job', () => {
    const { data } = extractJob();
    assert.equal(data.isListingPage, true);
  });
});

function newLayoutDetailPage() {
  // Mirrors the current LinkedIn detail pane WITHOUT classic top-card
  // classes: generic containers, /company/ link, metadata line, insight
  // pills, About-the-job section, currentJobId URL.
  const detail = el('div', {
    classes: ['scaffold-layout__detail'],
    children: [
      el('div', {
        children: [
          el('a', { attrs: { href: '/company/nbyula' }, children: ['Nbyula - Skillizens without Borders'] }),
          el('h2', { children: ['Software Application Engineer- Apprenticeship'] }),
          el('div', { children: ['Bengaluru, Karnataka, India · 1 year ago · Over 100 people clicked apply'] }),
          el('ul', {
            children: [
              el('li', { children: ['✓ On-site'] }),
              el('li', { children: ['✓ Full-time'] }),
            ],
          }),
          el('h3', { children: ['About the job'] }),
          el('div', {
            children: ['About the job. Build backend systems at scale. Requirements: Node.js, teamwork.'],
          }),
          el('button', { children: ['Apply'] }),
        ],
      }),
    ],
  });
  const list = el('div', {
    children: [
      el('h2', { children: ['Web App Intern (AI-Assisted Development, REST APIs)'] }),
      el('div', { children: ['BEMPU Health'] }),
    ],
  });
  return makeDocument({
    title: 'Software Application Engineer- Apprenticeship | LinkedIn',
    url: 'https://www.linkedin.com/jobs/search-results/?currentJobId=4470355438&keywords=intern',
    bodyChildren: [list, detail],
  });
}

function noLocationDetailPage() {
  return makeDocument({
    title: 'Designer | LinkedIn',
    url: 'https://www.linkedin.com/jobs/view/555/',
    bodyChildren: [
      el('div', {
        classes: ['scaffold-layout__detail'],
        children: [
          el('a', { attrs: { href: '/company/acme' }, children: ['Acme Corp'] }),
          el('h2', { children: ['Product Designer'] }),
          el('div', { children: ['51 applicants · Posted 2 days ago · Actively hiring'] }),
          el('button', { children: ['Apply'] }),
        ],
      }),
    ],
  });
}

describe('new-layout detail pane without classic classes', () => {
  beforeEach(() => {
    const { doc, win } = newLayoutDetailPage();
    installGlobals(doc, win);
  });

  it('extracts title, company, location from semantic signals', () => {
    const { platform, data } = extractJob();
    assert.equal(platform, 'linkedin');
    assert.equal(data.role, 'Software Application Engineer- Apprenticeship');
    assert.equal(data.company, 'Nbyula - Skillizens without Borders');
    assert.ok(data.location.startsWith('Bengaluru, Karnataka, India'));
  });

  it('reads employment pills and builds the canonical job URL', () => {
    const { data } = extractJob();
    assert.equal(data.type, 'Full-Time');
    assert.equal(data.workMode, 'On-site');
    assert.equal(data.applicationLink, 'https://www.linkedin.com/jobs/view/4470355438/');
  });

  it('scopes the description to About-the-job, not the list', () => {
    const { data } = extractJob();
    assert.ok(data.description.includes('About the job'));
    assert.ok(!data.description.includes('BEMPU Health'));
  });
});

describe('detail pane with missing location', () => {
  beforeEach(() => {
    const { doc, win } = noLocationDetailPage();
    installGlobals(doc, win);
  });

  it('still extracts company and role', () => {
    const { data } = extractJob();
    assert.equal(data.company, 'Acme Corp');
    assert.equal(data.role, 'Product Designer');
    assert.equal(data.location, '');
  });
});

describe('SPA job switch re-extracts (stateless pipeline)', () => {
  it('Job A then Job B yields new values, never stale ones', () => {
    let fixture = newLayoutDetailPage();
    installGlobals(fixture.doc, fixture.win);
    const first = extractJob();
    assert.equal(first.data.company, 'Nbyula - Skillizens without Borders');

    fixture = noLocationDetailPage();
    installGlobals(fixture.doc, fixture.win);
    const second = extractJob();
    assert.equal(second.data.company, 'Acme Corp');
    assert.equal(second.data.role, 'Product Designer');
    assert.ok(!second.data.company.includes('Nbyula'));
  });
});

function unclassedDetailPage() {
  // CASE 3 shape: NO classic top-card classes and NO known container
  // classes — only an Apply button anchors the detail pane. The left list
  // carries a DIFFERENT job (Bengaluru) that must never leak in.
  const detail = el('div', {
    children: [
      el('a', { attrs: { href: '/company/narix-labs' }, children: ['Narix Labs'] }),
      el('h2', { children: ['Backend EngineerJunior'] }),
      el('div', { children: ['Greater Jaipur Area · 1 month ago · Over 100 people clicked apply'] }),
      el('ul', {
        children: [
          el('li', { children: ['✓ On-site'] }),
          el('li', { children: ['✓ Full-time'] }),
        ],
      }),
      el('h3', { children: ['About the job'] }),
      el('div', {
        children: ['About the job. Narix Labs builds developer tools for modern teams. You will work on APIs and infrastructure with a small senior team.'],
      }),
      el('button', { children: ['Apply'] }),
    ],
  });
  const list = el('div', {
    children: [
      el('h2', { children: ['People you can reach out to'] }),
      el('div', { children: ['Software Engineering Intern'] }),
      el('div', { children: ['Abstrabit Technologies'] }),
      el('div', { children: ['Bengaluru'] }),
    ],
  });
  return makeDocument({
    title: 'Backend EngineerJunior | LinkedIn',
    url: 'https://www.linkedin.com/jobs/search-results/?currentJobId=999&keywords=backend',
    bodyChildren: [list, detail],
  });
}

function scopelessPage() {
  // No detail scope at all: no known containers, no Apply button.
  // Only a list of jobs. Nothing may be extracted as the selected job.
  return makeDocument({
    title: 'Jobs | LinkedIn',
    url: 'https://www.linkedin.com/jobs/search/',
    bodyChildren: [
      el('div', {
        children: [
          el('div', { children: ['Software Engineering Intern'] }),
          el('div', { children: ['Abstrabit Technologies'] }),
          el('div', { children: ['Bengaluru'] }),
        ],
      }),
    ],
  });
}

describe('apply-anchored scope without classic classes (CASE 3)', () => {
  beforeEach(() => {
    const { doc, win } = unclassedDetailPage();
    installGlobals(doc, win);
  });

  it('extracts the detail job, never the list job', () => {
    const { platform, data } = extractJob();
    assert.equal(platform, 'linkedin');
    assert.equal(data.company, 'Narix Labs');
    assert.equal(data.role, 'Backend EngineerJunior');
    assert.equal(data.location, 'Greater Jaipur Area');
    assert.equal(data.type, 'Full-Time');
    assert.equal(data.workMode, 'On-site');
  });

  it('keeps description inside the detail pane', () => {
    const { data } = extractJob();
    assert.ok(data.description.includes('Narix Labs builds developer tools'));
    assert.ok(!data.description.includes('Abstrabit'));
  });
});

describe('no identifiable detail scope (CASE 6/7)', () => {
  beforeEach(() => {
    const { doc, win } = scopelessPage();
    installGlobals(doc, win);
  });

  it('returns empty fields instead of list or widget text', () => {
    const { platform, data } = extractJob();
    assert.equal(platform, 'linkedin');
    assert.equal(data.role, '');
    assert.equal(data.location, '');
  });
});

function widgetFirstDetailPage() {
  // Reproduces the reported failure: a Beta feedback widget whose h2
  // ("Are these results helpful?") precedes the real job title in DOM
  // order, plus a "Selected, ..." accessibility marker line.
  const detail = el('div', {
    classes: ['scaffold-layout__detail'],
    children: [
      el('div', {
        classes: ['feedback-widget'],
        children: [
          el('h2', { children: ['Are these results helpful?'] }),
          el('span', { children: ['BETA'] }),
        ],
      }),
      el('span', { children: ['Selected, Software Application Engineer- Apprenticeship'] }),
      el('div', {
        children: [
          el('a', { attrs: { href: '/company/nbyula' }, children: ['Nbyula - Skillizens without Borders'] }),
          el('h2', { children: ['Software Application Engineer- Apprenticeship'] }),
          el('div', { children: ['Bengaluru, Karnataka, India · 1 year ago · Over 100 people clicked apply'] }),
          el('ul', {
            children: [
              el('li', { children: ['✓ On-site'] }),
              el('li', { children: ['✓ Full-time'] }),
            ],
          }),
          el('h3', { children: ['About the job'] }),
          el('div', { children: ['About the job. Build backend systems at scale.'] }),
          el('button', { children: ['Apply'] }),
        ],
      }),
    ],
  });
  return makeDocument({
    title: 'Software Application Engineer- Apprenticeship | LinkedIn',
    url: 'https://www.linkedin.com/jobs/search-results/?currentJobId=4470355438&keywords=intern',
    bodyChildren: [detail],
  });
}

describe('feedback-widget headings never win the title', () => {
  beforeEach(() => {
    const { doc, win } = widgetFirstDetailPage();
    installGlobals(doc, win);
  });

  it('rejects "Are these results helpful?" and picks the real title', () => {
    const { data } = extractJob();
    assert.equal(data.role, 'Software Application Engineer- Apprenticeship');
    assert.equal(data.company, 'Nbyula - Skillizens without Borders');
  });

  it('rejects the "Selected, ..." marker as location', () => {
    const { data } = extractJob();
    assert.ok(data.location.startsWith('Bengaluru, Karnataka, India'));
    assert.ok(!data.location.toLowerCase().includes('selected'));
  });
});

describe('role/location across varied LinkedIn titles', () => {
  const cases = [
    ['Software Engineer', 'Acme Corp', 'Bengaluru, India'],
    ['Backend Developer Intern', 'Beta LLC', 'Hyderabad, India'],
    ['Product Manager', 'Gamma Inc', 'Remote'],
    ['Data Analyst', 'Delta Co', 'Mumbai, India'],
    ['Frontend Engineer', 'Epsilon Ltd', 'Delhi, India'],
  ];
  for (const [title, company, location] of cases) {
    it(`extracts "${title}" at ${company}`, () => {
      const { doc, win } = makeDocument({
        title: `${title} | LinkedIn`,
        url: 'https://www.linkedin.com/jobs/view/777/',
        bodyChildren: [
          el('div', {
            classes: ['scaffold-layout__detail'],
            children: [
              el('a', { attrs: { href: '/company/x' }, children: [company] }),
              el('h2', { children: [title] }),
              el('div', { children: [`${location} · 2 days ago`] }),
              el('h2', { children: ['Are these results helpful?'] }),
              el('button', { children: ['Apply'] }),
            ],
          }),
        ],
      });
      installGlobals(doc, win);
      const { data } = extractJob();
      assert.equal(data.role, title);
      assert.equal(data.company, company);
      assert.ok(data.location.startsWith(location));
    });
  }
});
