import { useRef, useEffect, useState } from "react";
import { BellRing, Bookmark, CalendarClock, ExternalLink, Pencil, Trash2, Save } from "lucide-react";
import Toggle from "../ui/Toggle";
import { Field, Select } from "../ui/FormField";

function useRevealGroup() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const els = root.querySelectorAll(".reveal");
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); observer.unobserve(e.target); }
      }),
      { threshold: 0.1 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return ref;
}

function ReminderRow({ label, description, control }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
      <div className="min-w-0">
        <p style={{ margin: 0, fontSize: "0.83rem", fontWeight: 700, color: "var(--text-strong)" }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: "0.74rem", lineHeight: 1.55, color: "var(--muted)" }}>{description}</p>
      </div>
      {control}
    </div>
  );
}

// Illustrative sample opportunities shaped exactly like the real
// OpportunityCard: name, role, type, opening month + year, edit/delete.
const SAMPLE_OPPORTUNITIES = [
  { company: "VisionAI", role: "ML Intern", type: "Intern", openingMonth: "March", openingYear: 2027, skills: "Python, PyTorch", link: "https://careers.example.com" },
  { company: "CodeFest 2027", role: "Hackathon Participant", type: "Other", openingMonth: "December", openingYear: 2026, skills: "Team of 4 · AI track", link: "" },
  { company: "Brightstack", role: "Frontend Intern", type: "Remote", openingMonth: "February", openingYear: 2027, skills: "React, TypeScript", link: "https://careers.example.com" },
];

function OpportunityPreviewCard({ item }) {
  return (
    <div className="app-card flex h-full flex-col p-4" aria-label={`${item.company}, ${item.role}, opening ${item.openingMonth} ${item.openingYear}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div style={{ minWidth: 0 }}>
          <h4 style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "var(--text-strong)" }} className="truncate">
            {item.company}
          </h4>
          <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--muted)" }} className="truncate">
            {item.role}
          </p>
        </div>
        <span className="app-badge app-badge-warning">{item.type}</span>
      </div>
      <div className="mb-3 flex-1 space-y-2" style={{ fontSize: "0.76rem", color: "var(--muted)" }}>
        <div className="flex items-center gap-2">
          <CalendarClock size={13} aria-hidden="true" />
          <span>
            Opening: <strong style={{ color: "var(--text)" }}>{item.openingMonth} {item.openingYear}</strong>
          </span>
        </div>
        {item.skills && <div className="line-clamp-2">{item.skills}</div>}
        {item.link && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--brand)", fontWeight: 600 }}>
            <ExternalLink size={12} aria-hidden="true" /> Apply link
          </span>
        )}
      </div>
      <div className="flex justify-end gap-2" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.7rem" }}>
        <button type="button" className="app-icon-button" disabled title="Preview only" aria-label={`Edit ${item.company} opportunity (preview)`}>
          <Pencil size={14} />
        </button>
        <button type="button" className="app-icon-button danger" disabled title="Preview only" aria-label={`Delete ${item.company} opportunity (preview)`}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

const FOLLOW_UP_DAYS = [3, 5, 7, 10, 14, 21, 30];
const PENDING_COUNTS = [2, 3, 4, 5, 8, 10];
const REMINDER_HOURS = [1, 2, 6, 12, 24, 48];

function StayAhead() {
  const ref = useRevealGroup();
  const [prefs, setPrefs] = useState({
    emailReminders: true,
    followupReminders: true,
    followupAfterDays: 7,
    minPendingApplications: 3,
    interviewReminders: true,
    interviewReminderHours: 24,
  });
  const [savedNote, setSavedNote] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    setSavedNote(true);
  }

  return (
    <section id="reminders" ref={ref} className="landing-section" aria-labelledby="stay-heading" style={{ paddingTop: 0 }}>
      <div className="landing-container">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="section-kicker"><span className="dot" /> Stay ahead</p>
          <h2 id="stay-heading" className="section-title mt-3">Never miss a follow-up. Never lose a lead.</h2>
          <p className="section-copy mt-3">Configurable email reminders keep active applications moving; the planner keeps future opportunities waiting politely. Illustrative previews with sample content.</p>
        </div>

        <div className="mt-8 grid items-start gap-4 lg:grid-cols-2">
          {/* Email reminders — mirrors Profile → Email reminders */}
          <div className="reveal landing-card p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "var(--text-strong)", display: "flex", alignItems: "center", gap: 8 }}>
                <BellRing size={16} style={{ color: "var(--brand)" }} /> Email reminders
              </h3>
              <span className="app-badge app-badge-neutral">Interactive preview</span>
            </div>
            <p className="mt-1.5 text-sm leading-6" style={{ color: "var(--muted)" }}>
              The same controls as Profile → Email reminders. Try them — nothing here is saved.
            </p>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <ReminderRow
                label="Email reminders"
                description="Master switch. Turning this off disables all reminder emails."
                control={
                  <Toggle
                    label="Email reminders"
                    checked={prefs.emailReminders}
                    onChange={(value) => setPrefs({ ...prefs, emailReminders: value })}
                  />
                }
              />
              <div style={{ opacity: prefs.emailReminders ? 1 : 0.55 }}>
                <ReminderRow
                  label="Application follow-ups"
                  description="One digest email when enough applications have waited past the follow-up window."
                  control={
                    <Toggle
                      label="Application follow-up reminders"
                      checked={prefs.followupReminders}
                      disabled={!prefs.emailReminders}
                      onChange={(value) => setPrefs({ ...prefs, followupReminders: value })}
                    />
                  }
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" style={{ marginTop: "0.75rem" }}>
                  <Field label="Follow up after">
                    <Select
                      value={prefs.followupAfterDays}
                      disabled={!prefs.emailReminders}
                      onChange={(e) => setPrefs({ ...prefs, followupAfterDays: Number(e.target.value) })}
                      aria-label="Follow up after"
                    >
                      {FOLLOW_UP_DAYS.map((days) => (
                        <option key={days} value={days}>{days} days</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Send when">
                    <Select
                      value={prefs.minPendingApplications}
                      disabled={!prefs.emailReminders}
                      onChange={(e) => setPrefs({ ...prefs, minPendingApplications: Number(e.target.value) })}
                      aria-label="Send digest when"
                    >
                      {PENDING_COUNTS.map((count) => (
                        <option key={count} value={count}>{count} applications</option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div style={{ marginTop: "0.75rem" }}>
                  <ReminderRow
                    label="Interview reminders"
                    description="One consolidated email for interviews entering the reminder window."
                    control={
                      <Toggle
                        label="Interview reminders"
                        checked={prefs.interviewReminders}
                        disabled={!prefs.emailReminders}
                        onChange={(value) => setPrefs({ ...prefs, interviewReminders: value })}
                      />
                    }
                  />
                </div>
                <div style={{ marginTop: "0.75rem", maxWidth: 280 }}>
                  <Field label="Remind me">
                    <Select
                      value={prefs.interviewReminderHours}
                      disabled={!prefs.emailReminders}
                      onChange={(e) => setPrefs({ ...prefs, interviewReminderHours: Number(e.target.value) })}
                      aria-label="Remind me"
                    >
                      {REMINDER_HOURS.map((hours) => (
                        <option key={hours} value={hours}>{hours === 1 ? "1 hour before" : `${hours} hours before`}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </div>
              <button type="submit" className="app-button app-button-primary stay-save">
                <Save size={15} /> Save reminder preferences
              </button>
              {savedNote && (
                <p className="app-form-success" style={{ margin: 0 }} role="status">
                  Preview only — sign up to save these for real in your Profile.
                </p>
              )}
            </form>
          </div>

          {/* Opportunity planner — wishlist cards like the real product */}
          <div className="reveal landing-card p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "var(--text-strong)", display: "flex", alignItems: "center", gap: 8 }}>
                <Bookmark size={16} style={{ color: "var(--brand)" }} /> Opportunity planner
              </h3>
              <span className="app-badge app-badge-neutral">Wishlist · Sample</span>
            </div>
            <p className="mt-1.5 text-sm leading-6" style={{ color: "var(--muted)" }}>
              A wishlist for future openings, internships, hackathons, and hiring events —
              saved for later, separate from active applications. Edit or delete anytime.
            </p>
            <div className="mt-4 grid gap-3" role="img" aria-label="Sample opportunity wishlist cards showing name, type, opening date, and edit and delete actions">
              {SAMPLE_OPPORTUNITIES.map((item) => (
                <OpportunityPreviewCard key={`${item.company}-${item.role}`} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default StayAhead;
