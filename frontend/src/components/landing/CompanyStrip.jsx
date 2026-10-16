import { Puzzle } from "lucide-react";
import useReveal from "../../hooks/useReveal";

// Only sources the extension actually supports — text names, no logos,
// no partnership claims.
const SOURCES = [
  "LinkedIn",
  "Indeed",
  "Wellfound",
  "Greenhouse",
  "Supported ATS forms",
];

function CompanyStrip() {
  const ref = useReveal();

  return (
    <section aria-label="Job sources supported by the TrackMyHunt extension" className="landing-section" style={{ paddingTop: 0, paddingBottom: "clamp(1.5rem, 3vw, 2.25rem)" }}>
      <div ref={ref} className="reveal landing-container">
        <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold uppercase" style={{ letterSpacing: "0.14em", color: "var(--faint)" }}>
          <Puzzle size={13} aria-hidden="true" />
          Copilot captures from these supported sources
        </p>
      </div>
      <div className="marquee mt-5" role="presentation">
        <div className="marquee-track">
          {[...SOURCES, ...SOURCES].map((name, i) => (
            <span key={`${name}-${i}`} className="marquee-item" aria-hidden={i >= SOURCES.length}>
              {name}
            </span>
          ))}
        </div>
      </div>
      <p className="landing-container mt-4 text-center text-xs" style={{ color: "var(--faint)" }}>
        Company, role, description, and URL are extracted where available — you review before saving. All trademarks belong to their respective owners.
      </p>
    </section>
  );
}

export default CompanyStrip;
