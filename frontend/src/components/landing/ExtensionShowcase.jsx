import { Chrome, ExternalLink, Eye } from "lucide-react";
import { TRACKMYHUNT_EXTENSION_GITHUB_URL } from "../../config/landingConfig";
import useReveal from "../../hooks/useReveal";
import dashboardPreview from "../../assets/dashboardpreview2.png";

const STEPS = [
  { n: "01", title: "Spot a role", desc: "On LinkedIn, Indeed, Wellfound, Greenhouse, or a supported application form." },
  { n: "02", title: "Review the capture", desc: "Company, role, description, and URL come pre-filled — confirm before saving." },
  { n: "03", title: "Track it", desc: "The role lands in your dashboard. Prefer manual? Add applications by hand anytime." },
];

const FIELDS = ["Company", "Role", "Description", "Job URL"];

function ExtensionShowcase() {
  const ref = useReveal();
  return (
    <section id="extension" className="landing-section" aria-labelledby="extension-heading" style={{ paddingTop: 0 }}>
      <div ref={ref} className="reveal landing-container grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="section-kicker"><span className="dot" /> Chrome extension · Copilot</p>
          <h2 id="extension-heading" className="section-title mt-3">Save the next opportunity where you find it.</h2>
          <p className="section-copy mt-3">
            TrackMyHunt Copilot extracts the available details from supported portals and
            career pages, shows them for review, and saves straight to your dashboard.
            When automatic capture isn&rsquo;t available, manual entry works just as well.
            Distributed via GitHub — not the Chrome Web Store.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Details the extension can extract where available">
            {FIELDS.map((f) => (
              <span key={f} className="app-badge app-badge-neutral">{f}</span>
            ))}
            <span className="app-badge app-badge-warning">
              <Eye size={11} style={{ marginRight: 4 }} aria-hidden="true" /> Review before saving
            </span>
          </div>
          <ol style={{ listStyle: "none", margin: "1.25rem 0 0", padding: 0, display: "grid", gap: "0.6rem" }}>
            {STEPS.map((step) => (
              <li key={step.n} className="landing-card flex items-center gap-3 px-4 py-3">
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
                    fontSize: "0.72rem",
                    fontWeight: 800,
                  }}
                >
                  {step.n}
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--text)" }}>
                  <strong>{step.title}</strong> <span style={{ color: "var(--muted)" }}>— {step.desc}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-5">
            <a href={TRACKMYHUNT_EXTENSION_GITHUB_URL} target="_blank" rel="noopener noreferrer" className="app-button app-button-secondary">
              <Chrome size={15} /> View extension on GitHub <ExternalLink size={13} />
            </a>
          </div>
        </div>

        <div className="landing-card overflow-hidden">
          <div className="flex items-center gap-2 border-b px-4 py-2.5 text-xs" style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface-2)" }}>
            <span style={{ height: 8, width: 8, borderRadius: 999, background: "var(--border-strong)" }} />
            <span style={{ height: 8, width: 8, borderRadius: 999, background: "var(--border-strong)" }} />
            <span style={{ height: 8, width: 8, borderRadius: 999, background: "var(--brand)" }} />
            <span className="ml-2 min-w-0 truncate" style={{ fontWeight: 600 }}>trackmyhunt / extension → dashboard</span>
          </div>
          <img src={dashboardPreview} alt="Jobs saved through the extension appear in the TrackMyHunt dashboard" className="h-auto w-full" loading="lazy" />
        </div>
      </div>
    </section>
  );
}

export default ExtensionShowcase;
