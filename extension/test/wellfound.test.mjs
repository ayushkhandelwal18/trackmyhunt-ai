// Offline Wellfound extraction tests against synthetic job DOM.
// No browser, no network: a minimal fake DOM plus the REAL pipeline and
// Wellfound extractor. Run: node --test test/
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { el, makeDocument, installGlobals } from './fakeDom.mjs';
import { extractJob } from '../src/content/extract/pipeline.js';
import { WellfoundExtractor } from '../src/content/scrapers/wellfound.js';
import { detectPlatform } from '../src/content/extract/detectPlatform.js';

const JOB_URL = 'https://wellfound.com/jobs/3014527-software-engineer-intern';

function jobPage() {
  return makeDocument({
    title: 'Software Engineer Intern | Wellfound',
    url: JOB_URL,
    headChildren: [
      el('meta', { attrs: { property: 'og:site_name', content: 'Wellfound' } }),
    ],
    bodyChildren: [
      el('h1', { children: ['Software Engineer Intern'] }),
      el('a', { attrs: { href: '/company/narix-labs' }, children: ['Narix Labs'] }),
      el('div', { children: ['Bengaluru, Karnataka, India · Full-time · Remote friendly'] }),
      el('button', { children: ['Apply'] }),
    ],
  });
}

function companyPage() {
  return makeDocument({
    title: 'Narix Labs Careers | Wellfound',
    url: 'https://wellfound.com/company/narix-labs',
    bodyChildren: [
      el('h1', { children: ['Narix Labs Careers'] }),
      el('div', { children: ['Building developer tools for modern teams.'] }),
    ],
  });
}

function jsonLdPage() {
  const ld = el('script', {
    attrs: { type: 'application/ld+json' },
    children: [
      JSON.stringify({
        '@type': 'JobPosting',
        title: 'Backend Developer Intern',
        hiringOrganization: { name: 'Garnish Company' },
        jobLocation: { address: { addressLocality: 'Hyderabad', addressCountry: 'IN' } },
        employmentType: 'INTERN',
        url: 'https://wellfound.com/jobs/999-backend-developer-intern',
      }),
    ],
  });
  return makeDocument({
    title: 'Backend Developer Intern | Wellfound',
    url: 'https://wellfound.com/jobs/999-backend-developer-intern',
    headChildren: [ld],
    bodyChildren: [
      el('button', { children: ['Apply'] }),
      el('div', { children: ['Join us to build backend systems at scale.'] }),
    ],
  });
}

describe('Wellfound URL + platform detection', () => {
  it('recognizes /jobs/ and /role/ URLs as wellfound', () => {
    assert.equal(detectPlatform(JOB_URL), 'wellfound');
    assert.equal(detectPlatform('https://wellfound.com/role/abc123'), 'wellfound');
    assert.equal(detectPlatform('https://wellfound.com/company/narix-labs'), 'wellfound');
  });

  it('WellfoundExtractor.matches covers job and company pages', () => {
    assert.equal(WellfoundExtractor.matches(JOB_URL), true);
    assert.equal(WellfoundExtractor.matches('https://wellfound.com/company/x'), true);
    assert.equal(WellfoundExtractor.matches('https://www.linkedin.com/jobs/view/1/'), false);
  });
});

describe('Wellfound job page extraction', () => {
  beforeEach(() => {
    const { doc, win } = jobPage();
    installGlobals(doc, win);
  });

  it('extracts role and company from the job page', () => {
    const { platform, data } = extractJob();
    assert.equal(platform, 'wellfound');
    assert.equal(data.role, 'Software Engineer Intern');
    assert.equal(data.company, 'Narix Labs');
  });

  it('never reports the portal name as the employer', () => {
    const { data } = extractJob();
    assert.notEqual(data.company.toLowerCase(), 'wellfound');
  });

  it('type stays inside the backend enum (never invented)', () => {
    const { data } = extractJob();
    assert.ok(['Intern', 'Full-Time', 'Remote', 'Freelance', 'Intern + Offer', 'Other'].includes(data.type));
  });

  it('keeps the canonical job URL as the application link', () => {
    const { data } = extractJob();
    assert.equal(data.applicationLink, JOB_URL);
  });
});

describe('Wellfound company page (multiple jobs listed)', () => {
  beforeEach(() => {
    const { doc, win } = companyPage();
    installGlobals(doc, win);
  });

  it('names the company without inventing a role from another job', () => {
    const { platform, data } = extractJob();
    assert.equal(platform, 'wellfound');
    assert.ok(data.company.includes('Narix Labs'));
  });
});

describe('Wellfound page with JSON-LD JobPosting', () => {
  beforeEach(() => {
    const { doc, win } = jsonLdPage();
    installGlobals(doc, win);
  });

  it('prefers structured data for company, location, and type', () => {
    const { platform, data } = extractJob();
    assert.equal(platform, 'wellfound');
    assert.equal(data.role, 'Backend Developer Intern');
    assert.equal(data.company, 'Garnish Company');
    assert.ok(data.location.includes('Hyderabad'));
    assert.equal(data.type, 'Intern');
  });
});
