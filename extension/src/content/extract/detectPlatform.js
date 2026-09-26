// Platform detection: URL first, DOM signals second. Returns one of:
// linkedin | indeed | naukri | internshala | greenhouse | lever |
// workday | ashby | google_forms | company_careers | generic

const HOST_RULES = [
  [/linkedin\.com\/jobs/i, 'linkedin'],
  [/indeed\.com/i, 'indeed'],
  [/naukri\.com/i, 'naukri'],
  [/internshala\.com/i, 'internshala'],
  [/greenhouse\.io/i, 'greenhouse'],
  [/lever\.co/i, 'lever'],
  [/myworkdayjobs\.com|workdayjobs\.com/i, 'workday'],
  [/ashbyhq\.com/i, 'ashby'],
];

const FORM_URL = /^(https?:\/\/)?(docs\.google\.com\/forms|forms\.google\.com|forms\.gle)/i;
const CAREER_PATH = /\/(careers?|jobs?|openings?|vacanc|positions?|work-with-us|join-us)(\/|$)/i;

export function detectPlatform(url, doc) {
  const target = String(url || '');
  for (const [pattern, id] of HOST_RULES) {
    if (pattern.test(target)) return id;
  }
  if (FORM_URL.test(target)) return 'google_forms';
  // DOM signal: Google Forms embedded on another domain.
  try {
    const documentRef = doc || (typeof document !== 'undefined' ? document : null);
    if (documentRef) {
      if (
        documentRef.querySelector('.freebirdFormviewerView, form[action*="docs.google.com/forms"]')
      ) {
        return 'google_forms';
      }
    }
  } catch { /* DOM unreadable: fall through */ }
  if (CAREER_PATH.test(target)) return 'company_careers';
  return 'generic';
}
