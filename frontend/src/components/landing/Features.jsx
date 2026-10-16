import { useCallback, useEffect, useRef, useState } from "react";
import {
  KanbanSquare,
  MousePointerClick,
  ScanSearch,
  Layers,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import useReveal from "../../hooks/useReveal";

// Four pillars — each maps to real tools and anchors to its showcase.
const PILLARS = [
  {
    icon: KanbanSquare,
    tag: "Pillar 01 · Track",
    title: "Track every application",
    desc: "A 6-stage Kanban pipeline with per-application timelines, resume links, stats, and recent activity on your dashboard.",
    includes: ["Application Tracker", "Dashboard overview", "Email reminders"],
    mini: "Applied → Shortlisted → OA → Interviews → Rejected",
    href: "#tracker",
  },
  {
    icon: MousePointerClick,
    tag: "Pillar 02 · Capture",
    title: "Capture roles anywhere",
    desc: "The Copilot extension pulls company, role, description, and URL from supported portals — review, then save.",
    includes: ["Chrome extension", "Review before saving", "Manual entry fallback"],
    mini: "LinkedIn · Indeed · Wellfound · Greenhouse",
    href: "#extension",
  },
  {
    icon: ScanSearch,
    tag: "Pillar 03 · Analyze",
    title: "Analyze fit with AI",
    desc: "Upload your resume PDF, paste the JD, and get a match score with breakdowns, skill gaps, and recommendations.",
    includes: ["Resume Match Score", "Missing must-haves", "Final recommendation"],
    mini: "Score 78% · 2 must-have gaps · 3 fixes",
    href: "#analyzer",
  },
  {
    icon: Layers,
    tag: "Pillar 04 · Prepare",
    title: "Prepare in one workspace",
    desc: "Park future roles on a wishlist, link resumes per application, grow skills, and keep resources and notes close.",
    includes: ["Opportunity Planner", "Resume links", "Skillboard · Resources · Notes"],
    mini: "Wishlist ≠ active pipeline · links, not files",
    href: "#workspace",
  },
];

function Features() {
  const sectionRef = useReveal();
  const trackRef = useRef(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const updatePages = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector(":scope > *");
    const cardWidth = card ? card.getBoundingClientRect().width + 16 : 336;
    const count = Math.max(1, Math.round(el.scrollWidth / Math.max(1, cardWidth)));
    const visible = Math.max(1, Math.round(el.clientWidth / Math.max(1, cardWidth)));
    const total = Math.max(1, count - visible + 1);
    setPages(total);
    setPage((p) => Math.min(p, total - 1));
  }, []);

  useEffect(() => {
    updatePages();
    window.addEventListener("resize", updatePages);
    return () => window.removeEventListener("resize", updatePages);
  }, [updatePages]);

  function scrollToPage(next) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector(":scope > *");
    const step = card ? card.getBoundingClientRect().width + 16 : 336;
    el.scrollTo({ left: next * step, behavior: "smooth" });
  }

  function handleScroll() {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector(":scope > *");
    const step = card ? card.getBoundingClientRect().width + 16 : 336;
    setPage(Math.round(el.scrollLeft / step));
  }

  return (
    <section id="features" className="landing-section" aria-labelledby="features-heading" style={{ paddingTop: "clamp(1rem, 3vw, 2rem)" }}>
      <div ref={sectionRef} className="reveal landing-container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="section-kicker"><span className="dot" /> The workspace</p>
            <h2 id="features-heading" className="section-title mt-3">Four pillars, one calm job hunt.</h2>
            <p className="section-copy mt-3">Ten tools organized into four workflows that feed each other — explore each pillar, then see it in detail below.</p>
          </div>
          <div className="flex items-center gap-2" role="group" aria-label="Scroll pillars">
            <button type="button" className="carousel-btn" onClick={() => scrollToPage(Math.max(0, page - 1))} disabled={page === 0} aria-label="Previous pillars">
              <ArrowLeft size={17} />
            </button>
            <button type="button" className="carousel-btn" onClick={() => scrollToPage(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1} aria-label="Next pillars">
              <ArrowRight size={17} />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="hscroll mt-6"
          onScroll={handleScroll}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") scrollToPage(Math.min(pages - 1, page + 1));
            if (e.key === "ArrowLeft") scrollToPage(Math.max(0, page - 1));
          }}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="TrackMyHunt pillars — use left and right arrow keys to browse"
        >
          {PILLARS.map((f) => (
            <article key={f.title} className="feature-card">
              <div className="flex items-center justify-between gap-2">
                <span className="feature-icon"><f.icon size={17} /></span>
                <span className="feature-tag">{f.tag}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <ul className="mt-3 grid gap-1.5" style={{ listStyle: "none", margin: "0.75rem 0 0", padding: 0 }}>
                {f.includes.map((inc) => (
                  <li key={inc} style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text)" }}>
                    <span style={{ color: "var(--brand)", marginRight: 6 }} aria-hidden="true">—</span>{inc}
                  </li>
                ))}
              </ul>
              <div className="feature-mini">
                <div className="feature-mini-visual" aria-hidden="true">{f.mini}</div>
                <a href={f.href} className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold" style={{ color: "var(--brand)" }}>
                  See it below <ArrowUpRight size={13} />
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-center gap-1.5" role="tablist" aria-label="Pillar pages">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === page}
              aria-current={i === page}
              aria-label={`Go to pillar page ${i + 1}`}
              className="carousel-dot"
              onClick={() => scrollToPage(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
