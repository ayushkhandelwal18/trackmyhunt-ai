// Shared job-type guess shared by every platform scraper.
// Returns one of the TrackMyHunt application type enum values:
// "Intern" | "Full-Time" | "Remote" | "Freelance" | "Intern + Offer" | "Other"
export function detectJobType(pageText) {
  const text = String(pageText || '').toLowerCase();
  if (/\binternship\b|\binterns?\b/.test(text)) {
    // "Intern + Offer" only on explicit PPO/placement signals; a bare
    // "offer" (as in "we offer benefits") must not trigger it.
    return /\bppo\b|\bpre-placement\b|\bplacement\b/.test(text) ? 'Intern + Offer' : 'Intern';
  }
  if (/\bfull-?time\b/.test(text)) {
    return 'Full-Time';
  }
  if (/\bremote\b|\bwork from home\b|\bwfh\b/.test(text)) {
    return 'Remote';
  }
  if (/\bfreelance\b|\bcontract\b|\bgig\b/.test(text)) {
    return 'Freelance';
  }
  return 'Other';
}
