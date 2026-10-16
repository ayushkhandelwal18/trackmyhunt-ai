import { FileUp, ScanSearch, CheckCircle2, FileText } from "lucide-react";
import useReveal from "../../hooks/useReveal";

// Mirrors the real report structure: score + summary, weighted breakdown,
// matched / missing-must-have / good-to-have, final recommendation.
// Sample values only — clearly labeled illustrative content.
const BREAKDOWN = [
  { label: "Skills & Technical Match", weight: "55%", value: 82 },
  { label: "Experience", weight: "20%", value: 70 },
  { label: "Responsibilities", weight: "15%", value: 75 },
  { label: "Education", weight: "10%", value: 90 },
];

const MATCHED = ["React", "Node.js", "REST APIs", "MongoDB"];
const MISSING = ["PostgreSQL", "Docker"];
const GOOD_TO_HAVE = [
  "Add one Docker-based deployment to strengthen DevOps readiness.",
  "Quantify project impact with metrics (latency, users, uptime).",
];

function AnalyzerHighlight() {
  const ref = useReveal();
  return (
    <section id="analyzer" className="landing-section" aria-labelledby="analyzer-heading" style={{ paddingTop: 0 }}>
      <div className="landing-container">
        <div ref={ref} className="reveal landing-card grid items-start gap-8 p-5 sm:p-9 lg:grid-cols-2">
          <div>
            <p className="section-kicker"><span className="dot" /> AI Resume Analyzer</p>
            <h2 id="analyzer-heading" className="mt-3" style={{ fontSize: "clamp(1.5rem, 2.6vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-strong)" }}>
              Know exactly where you stand for each role.
            </h2>
            <p className="section-copy mt-3">
              Upload your resume PDF, paste the job description, and get a structured,
              explainable report: an overall Resume Match Score, what drives it, which
              must-have skills are missing, and what to improve next. Analysis explains
              fit — it never guarantees hiring outcomes.
            </p>
            <ol style={{ listStyle: "none", margin: "1.25rem 0 0", padding: 0, display: "grid", gap: "0.6rem" }}>
              {[
                { icon: FileUp, text: "Resume PDF + Job Description go in" },
                { icon: ScanSearch, text: "Evidence-based AI analysis runs" },
                { icon: CheckCircle2, text: "Structured match report comes out" },
              ].map((step, i) => (
                <li key={step.text} className="flex items-center gap-3">
                  <span
                    style={{
                      display: "grid",
                      placeItems: "center",
                      height: 30,
                      width: 30,
                      flexShrink: 0,
                      borderRadius: 999,
                      background: "var(--brand-soft)",
                      border: "1px solid var(--brand-border)",
                      color: "var(--brand)",
                    }}
                  >
                    <step.icon size={14} />
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text)" }}>
                    <strong style={{ color: "var(--faint)", marginRight: 6 }}>{`0${i + 1}`}</strong>{step.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div
            className="rounded-xl border p-5"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
            role="img"
            aria-label="Illustrative AI analysis: 78 percent match with breakdown bars, matched and missing skills, improvements, and a final recommendation"
          >
            <div className="flex items-center justify-between gap-2">
              <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--faint)" }}>
                Example analysis
              </p>
              <span className="app-badge app-badge-warning">Sample</span>
            </div>

            <div className="mt-3 flex items-center gap-4">
              <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true" style={{ flexShrink: 0 }}>
                <circle cx="38" cy="38" r="32" fill="none" stroke="var(--border-strong)" strokeWidth="8" />
                <circle cx="38" cy="38" r="32" fill="none" stroke="var(--brand)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${0.78 * 2 * Math.PI * 32} ${2 * Math.PI * 32}`} transform="rotate(-90 38 38)" />
                <text x="38" y="44" textAnchor="middle" fontSize="17" fontWeight="800" fill="var(--text-strong)">78%</text>
              </svg>
              <div className="min-w-0">
                <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "var(--brand)" }}>Good Match</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.74rem", lineHeight: 1.55, color: "var(--muted)" }}>
                  Strong backend alignment; two must-have skills need attention.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2.5" aria-hidden="true">
              {BREAKDOWN.map((b) => (
                <div key={b.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", marginBottom: 4, color: "var(--text)" }}>
                    <span>{b.label} <span style={{ color: "var(--faint)" }}>· {b.weight}</span></span>
                    <strong style={{ color: "var(--text-strong)" }}>{b.value}%</strong>
                  </div>
                  <div className="score-bar"><span style={{ width: `${b.value}%` }} /></div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <p style={{ margin: "0 0 0.4rem", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--success)" }}>Matched skills</p>
              <div className="flex flex-wrap gap-1.5">
                {MATCHED.map((s) => <span key={s} className="app-badge app-badge-success">{s}</span>)}
              </div>
            </div>
            <div className="mt-3">
              <p style={{ margin: "0 0 0.4rem", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--brand)" }}>Missing — must have</p>
              <div className="flex flex-wrap gap-1.5">
                {MISSING.map((s) => <span key={s} className="app-badge app-badge-warning">{s}</span>)}
              </div>
            </div>
            <div className="mt-3 rounded-lg border px-3 py-2.5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "var(--text-strong)" }}>Good to have / Improvements</p>
              <ul style={{ margin: "0.3rem 0 0", paddingLeft: "1rem", fontSize: "0.74rem", lineHeight: 1.6, color: "var(--muted)" }}>
                {GOOD_TO_HAVE.map((g) => <li key={g}>{g}</li>)}
              </ul>
            </div>
            <div className="mt-2.5 rounded-lg border px-3 py-2.5" style={{ borderColor: "var(--brand-border)", background: "var(--brand-soft)" }}>
              <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "var(--text-strong)" }}>Final recommendation</p>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.74rem", lineHeight: 1.6, color: "var(--text)" }}>
                Strong backend fit — close the two must-have gaps before applying.
              </p>
            </div>

            <p className="mt-3 flex items-center gap-1.5" style={{ margin: "0.75rem 0 0", fontSize: "0.72rem", color: "var(--faint)" }}>
              <FileText size={12} /> Illustrative sample — reports never predict hiring results.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AnalyzerHighlight;
