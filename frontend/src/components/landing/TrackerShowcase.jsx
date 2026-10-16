import { CheckCircle2, FileText, History } from "lucide-react";
import { useRef, useEffect } from "react";

// The six real pipeline stages in TrackMyHunt.
const STAGES = [
  {
    status: "Applied",
    cards: [
      { company: "Frontend Intern", role: "Nova Labs", meta: "Applied Jan 12", resume: "Frontend-2026.pdf" },
      { company: "Backend Intern", role: "Datawise", meta: "Applied Jan 15", resume: "Backend-2026.pdf" },
    ],
  },
  {
    status: "Resume Shortlisted",
    cards: [{ company: "SDE Intern", role: "Cloudnine", meta: "Shortlisted Jan 18", resume: "Backend-2026.pdf" }],
  },
  {
    status: "OA Done",
    cards: [{ company: "SDE Intern", role: "Cloudnine", meta: "Assessment cleared", resume: "Backend-2026.pdf" }],
  },
  {
    status: "Interview Scheduled",
    cards: [{ company: "Full-Stack Intern", role: "Brightstack", meta: "Fri · 10:00 AM", resume: "Fullstack-2026.pdf", hot: true }],
  },
  {
    status: "Interview Done",
    cards: [{ company: "Web Dev Intern", role: "PixelWorks", meta: "Round 2 done · awaiting result" }],
  },
  { status: "Rejected", cards: [] },
];

const TIMELINE = ["Applied Jan 12", "Shortlisted Jan 18", "OA Done Jan 22", "Interview Fri 10 AM"];

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

function TrackerShowcase() {
  const ref = useRevealGroup();

  return (
    <section id="tracker" ref={ref} className="landing-section" aria-labelledby="tracker-heading" style={{ paddingTop: 0 }}>
      <div className="landing-container">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="section-kicker"><span className="dot" /> Application tracker</p>
          <h2 id="tracker-heading" className="section-title mt-3">Your pipeline, exactly as hiring happens.</h2>
          <p className="section-copy mt-3">
            Six real stages — Applied, Resume Shortlisted, OA Done, Interview Scheduled,
            Interview Done, Rejected. Drag cards between them; every move is recorded on
            the application timeline. Illustrative preview with sample content.
          </p>
        </div>

        <div className="reveal mock-panel mt-8">
          <div className="preview-frame-bar">
            <span className="preview-dot" />
            <span className="preview-dot" />
            <span className="preview-dot brand" />
            <span className="ml-2 min-w-0 truncate">trackmyhunt — kanban</span>
            <span className="app-badge app-badge-neutral ml-auto hidden sm:inline-flex">Sample data</span>
          </div>
          <div className="hscroll" style={{ padding: "1rem" }} tabIndex={0} role="region" aria-label="Sample Kanban board across the six real pipeline stages">
            {STAGES.map((col) => (
              <div key={col.status} style={{ flex: "0 0 218px" }} className="rounded-xl border p-2.5" aria-label={`${col.status}: ${col.cards.length} applications`}>
                <div className="mb-2 flex items-center justify-between gap-2 px-1" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.04em", color: "var(--text)" }}>{col.status}</span>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--faint)" }}>{col.cards.length}</span>
                </div>
                <div className="grid gap-2">
                  {col.cards.map((card) => (
                    <div key={`${col.status}-${card.company}`} className="app-card p-3">
                      <p className="truncate" style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "var(--text-strong)" }}>{card.company}</p>
                      <p className="truncate" style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "var(--muted)" }}>{card.role}</p>
                      <p className="truncate" style={{ margin: "6px 0 0", fontSize: "0.68rem", fontWeight: card.hot ? 700 : 500, color: card.hot ? "var(--brand)" : "var(--muted)" }}>
                        {card.meta}
                      </p>
                      {card.resume && (
                        <p className="truncate" style={{ margin: "4px 0 0", fontSize: "0.66rem", color: "var(--faint)", display: "flex", alignItems: "center", gap: 4 }}>
                          <FileText size={11} aria-hidden="true" /> {card.resume}
                        </p>
                      )}
                    </div>
                  ))}
                  {col.cards.length === 0 && (
                    <p style={{ margin: 0, padding: "0.4rem 0.2rem", fontSize: "0.7rem", color: "var(--faint)" }}>No applications</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2.5 border-t px-4 py-3.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            <History size={15} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <p style={{ margin: 0, fontSize: "0.76rem", lineHeight: 1.6, color: "var(--muted)" }}>
              <strong style={{ color: "var(--text)" }}>SDE Intern · Cloudnine — timeline: </strong>
              {TIMELINE.join("  →  ")}
            </p>
          </div>
        </div>

        <ul className="reveal workflow-list mx-auto mt-6 max-w-2xl sm:grid sm:grid-cols-3 sm:gap-4" style={{ listStyle: "none" }}>
          <li><CheckCircle2 size={15} /> Add manually or via the Copilot extension</li>
          <li><CheckCircle2 size={15} /> Link the exact resume used per application</li>
          <li><CheckCircle2 size={15} /> Dashboard stats, interviews &amp; recent activity</li>
        </ul>
      </div>
    </section>
  );
}

export default TrackerShowcase;
