// Google Forms extractor: public hiring/application forms.
// A form is often only an application channel, so company/role stay blank
// unless clearly identifiable. The form title + description + question
// labels become reviewable context, never fabricated facts.
// Interface: { id, label, matches(url), extract(ctx) -> Partial<JobData> }.

import { text } from '../extract/dom.js';

export const GoogleFormsExtractor = {
  id: 'google_forms',
  label: 'Google Form',

  matches(url) {
    return (
      !!url &&
      (/docs\.google\.com\/forms/i.test(url) ||
        /forms\.google\.com/i.test(url) ||
        /forms\.gle/i.test(url))
    );
  },

  extract() {
    const formTitle = text(
      '.freebirdFormviewerViewHeaderTitle, div[role="heading"], h1'
    );
    const headerDesc = text('.freebirdFormviewerViewHeaderDescription');

    const questions = [];
    try {
      document
        .querySelectorAll('.freebirdFormviewerViewNumberedItemContainer [role="heading"], .freebirdFormviewerViewNumberedItemContainer [aria-level]')
        .forEach((node) => {
          const t = node && node.textContent ? node.textContent.replace(/\s+/g, ' ').trim() : '';
          if (t && t.length <= 160 && !questions.includes(t)) questions.push(t);
          if (questions.length >= 12) return;
        });
    } catch { /* ignore */ }

    const parts = [headerDesc, questions.length ? `Questions: ${questions.join(' | ')}` : '']
      .filter(Boolean)
      .join(' ');
    return {
      company: '',
      role: '',
      location: '',
      description: parts.slice(0, 600),
      formTitle,
      employmentType: '',
      workMode: '',
    };
  },
};
