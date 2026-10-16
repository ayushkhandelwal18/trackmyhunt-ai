import { FileText, GraduationCap, BookOpen, NotebookPen, Link2 } from "lucide-react";
import { useRef, useEffect } from "react";

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

const CARDS = [
  {
    icon: FileText,
    title: "Resume Manager",
    desc: "Save links to each resume version — one for backend roles, one for frontend, one general. Link the exact resume to every application so you always know what you sent.",
    points: ["Links, not files — Drive, Dropbox, or Docs URLs", "Mapped per application", "See usage at a glance"],
    sample: "Backend-2026.pdf ↗ · used in 3 applications",
  },
  {
    icon: GraduationCap,
    title: "Skillboard",
    desc: "Track what you're learning against what target roles demand. Attach a note or a resource to any skill and watch gaps close.",
    points: ["Learning vs. required status", "Notes attached per skill", "Resources attached per skill"],
    sample: "Docker → in progress · 2 notes · 1 resource",
  },
  {
    icon: BookOpen,
    title: "Resources Hub",
    desc: "One shelf for everything useful: repos, docs, dev tools, videos, spreadsheets, posts, and guides — saved with context, found in seconds.",
    points: ["Any link type, organized in one place", "Kept alongside your preparation", "Always within reach"],
    sample: "12 saved · DSA sheet · System design primer",
  },
  {
    icon: NotebookPen,
    title: "Notes & Brain Dump",
    desc: "A lightweight scratchpad for interview takeaways, prep checklists, ideas, and reminders — the miscellany that doesn't belong anywhere else.",
    points: ["Free-form, captured in seconds", "Interview prep & takeaways", "Lists, ideas & reminders"],
    sample: "Round 2 takeaways · 3 questions to ask",
  },
];

function PreparationHub() {
  const ref = useRevealGroup();

  return (
    <section id="workspace" ref={ref} className="landing-section" aria-labelledby="workspace-heading" style={{ paddingTop: 0 }}>
      <div className="landing-container">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="section-kicker"><span className="dot" /> Preparation workspace</p>
          <h2 id="workspace-heading" className="section-title mt-3">Everything around the application, in reach.</h2>
          <p className="section-copy mt-3">Resumes, skills, resources, and notes — four quiet tools that keep preparation attached to the hunt instead of scattered across tabs.</p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {CARDS.map((c) => (
            <article key={c.title} className="reveal landing-card flex flex-col p-5">
              <div className="flex items-center gap-3">
                <span className="feature-icon"><c.icon size={17} /></span>
                <h3 style={{ margin: 0, fontSize: "0.94rem", fontWeight: 700, color: "var(--text-strong)" }}>{c.title}</h3>
              </div>
              <p className="mt-2.5 text-sm leading-6" style={{ color: "var(--muted)" }}>{c.desc}</p>
              <ul className="mt-2 grid gap-1" style={{ listStyle: "none", margin: "0.5rem 0 0", padding: 0 }}>
                {c.points.map((p) => (
                  <li key={p} style={{ fontSize: "0.78rem", color: "var(--text)", display: "flex", gap: 8, alignItems: "flex-start", lineHeight: 1.55 }}>
                    <Link2 size={12} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 3 }} aria-hidden="true" />{p}
                  </li>
                ))}
              </ul>
              <div className="feature-mini">
                <div className="feature-mini-visual" aria-hidden="true">{c.sample}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PreparationHub;
