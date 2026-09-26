import { FileUp, FileText, ScanSearch, CheckCircle2, AlertTriangle, Lightbulb, Flag } from "lucide-react";

const EXAMPLE_OUTPUT = [
  { icon: CheckCircle2, label: "Matched Skills", desc: "Node.js, React, REST APIs, MongoDB", tone: "var(--success)" },
  { icon: AlertTriangle, label: "Missing Must-Have Skills", desc: "PostgreSQL, Docker", tone: "var(--brand)" },
  { icon: Lightbulb, label: "Improvement Suggestions", desc: "Surface testing work, quantify project impact", tone: "var(--brand)" },
  { icon: Flag, label: "Final Recommendation", desc: "Strong backend fit; add one DevOps project", tone: "var(--brand)" },
];

function AnalyzerHighlight() {
  return (
    <section id="analyzer" className="landing-section" aria-labelledby="analyzer-heading" style={{ paddingTop: 0 }}>
      <div className="landing-container">
        <div className="landing-card grid items-center gap-8 p-5 sm:p-9 lg:grid-cols-2">
          <div>
            <p className="section-kicker"><span className="dot" /> AI Resume Analyzer</p>
            <h2 id="analyzer-heading" className="mt-3" style={{ fontSize: "clamp(1.5rem, 2.6vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-strong)" }}>
              Know exactly where you stand for each role.
            </h2>
            <p className="section-copy mt-3">
              Upload your resume PDF, paste the job description, and get an explainable
              Resume Match Score — matched skills, must-have gaps, and concrete improvements,
              all grounded in that specific JD. It is analysis, not a chatbot, and never a hiring prediction.
            </p>
            <ol style={{ listStyle: "none", margin: "1.25rem 0 0", padding: 0, display: "grid", gap: "0.6rem" }}>
              {[
                { icon: FileUp, text: "Resume PDF + Job Description go in" },
                { icon: ScanSearch, text: "Evidence-based AI analysis runs" },
                { icon: CheckCircle2, text: "Resume Match Score comes out" },
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
            aria-label="Example of an AI Resume Analyzer result showing matched skills, missing skills, improvements, and a recommendation"
          >
            <div className="flex items-center justify-between gap-2">
              <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--faint)" }}>
                Example analysis
              </p>
              <span className="app-badge app-badge-warning">Sample</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--text-strong)" }}>78%</span>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--brand)" }}>Good Match</span>
            </div>
            <div className="mt-3 grid gap-2">
              {EXAMPLE_OUTPUT.map((row) => (
                <div key={row.label} className="flex items-start gap-2.5 rounded-lg border px-3 py-2.5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <row.icon size={15} style={{ color: row.tone, flexShrink: 0, marginTop: 2 }} />
                  <div className="min-w-0">
                    <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "var(--text-strong)" }}>{row.label}</p>
                    <p className="truncate" style={{ margin: "2px 0 0", fontSize: "0.76rem", color: "var(--muted)" }}>{row.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5" style={{ margin: "0.75rem 0 0", fontSize: "0.72rem", color: "var(--faint)" }}>
              <FileText size={12} /> Illustrative sample — your report is generated from your resume and JD.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AnalyzerHighlight;
