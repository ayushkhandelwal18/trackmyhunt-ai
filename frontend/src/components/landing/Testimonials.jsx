import { useCallback, useEffect, useRef, useState } from "react";
import { Quote, ArrowLeft, ArrowRight } from "lucide-react";
import useReveal from "../../hooks/useReveal";

// Existing early-user feedback, kept as-is. Presented as a carousel with
// a clear "early feedback" label rather than marketing claims.
const TESTIMONIALS = [
  {
    name: "Ankit Kumar",
    detail: "MERN Stack Developer",
    quote: "TrackMyHunt makes it much easier to keep my job applications organized and track where I am in the process.",
  },
  {
    name: "Rohit Kumar",
    detail: "B.Tech Student",
    quote: "Having applications, opportunities, and preparation resources in one place makes the job search much easier to manage.",
  },
  {
    name: "Rishabh Sharma",
    detail: "Aspiring Software Engineer",
    quote: "The centralized application tracking makes it easier to stay organized instead of maintaining everything across different notes and spreadsheets.",
  },
  {
    name: "Ayush Kumar",
    detail: "B.Tech Student",
    quote: "The Kanban-style workflow gives a clear view of which applications are still pending and which ones need attention.",
  },
  {
    name: "Minakshi Sharma",
    detail: "Upcoming SDE Intern",
    quote: "The resume analyzer and application tracking features make the overall job-hunting workflow more structured and easier to follow.",
  },
];

function initials(name) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function Testimonials() {
  const sectionRef = useReveal();
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [pageCount, setPageCount] = useState(TESTIMONIALS.length);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector(":scope > *");
    const step = card ? card.getBoundingClientRect().width + 16 : 356;
    const visible = Math.max(1, Math.floor(el.clientWidth / step));
    setPageCount(Math.max(1, TESTIMONIALS.length - visible + 1));
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  function goTo(next) {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(pageCount - 1, next));
    const card = el.querySelector(":scope > *");
    const step = card ? card.getBoundingClientRect().width + 16 : 356;
    el.scrollTo({ left: clamped * step, behavior: "smooth" });
    setIndex(clamped);
  }

  function handleScroll() {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector(":scope > *");
    const step = card ? card.getBoundingClientRect().width + 16 : 356;
    setIndex(Math.max(0, Math.min(pageCount - 1, Math.round(el.scrollLeft / step))));
  }

  return (
    <section id="stories" className="landing-section" aria-labelledby="stories-heading" style={{ paddingTop: 0 }}>
      <div ref={sectionRef} className="reveal landing-container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="mx-auto max-w-2xl text-center" style={{ marginInline: "auto", width: "100%" }}>
            <p className="section-kicker"><span className="dot" /> Early feedback</p>
            <h2 id="stories-heading" className="section-title mt-3">What early users say</h2>
            <p className="section-copy mt-3">Feedback shared by early student users of TrackMyHunt.</p>
          </div>
        </div>

        <div
          ref={trackRef}
          className="hscroll mt-7"
          onScroll={handleScroll}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Early user feedback — scroll or use the buttons to browse"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") goTo(index + 1);
            if (e.key === "ArrowLeft") goTo(index - 1);
          }}
        >
          {TESTIMONIALS.map((item) => (
            <figure key={item.name} className="t-card" style={{ margin: 0 }}>
              <Quote size={18} style={{ color: "var(--brand)" }} aria-hidden="true" />
              <blockquote>&ldquo;{item.quote}&rdquo;</blockquote>
              <figcaption className="mt-4 flex items-center gap-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                <span className="t-avatar" aria-hidden="true">{initials(item.name)}</span>
                <span>
                  <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-strong)" }}>{item.name}</span>
                  <span style={{ display: "block", fontSize: "0.74rem", color: "var(--muted)" }}>{item.detail}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-center gap-3">
          <button type="button" className="carousel-btn" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Previous testimonials">
            <ArrowLeft size={17} />
          </button>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Testimonial pages">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-current={i === index}
                aria-label={`Go to testimonial page ${i + 1}`}
                className="carousel-dot"
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <button type="button" className="carousel-btn" onClick={() => goTo(index + 1)} disabled={index >= pageCount - 1} aria-label="Next testimonials">
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
