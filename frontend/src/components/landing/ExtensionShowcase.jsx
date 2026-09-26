import { Chrome, ExternalLink } from "lucide-react";
import { TRACKMYHUNT_EXTENSION_GITHUB_URL } from "../../config/landingConfig";
import dashboardPreview from "../../assets/dashboardpreview2.png";

const STEPS = [
  { n: "01", title: "Find a role", desc: "Spot an opening on LinkedIn or any job portal." },
  { n: "02", title: "Capture details", desc: "Save company, role, type, and link in one click." },
  { n: "03", title: "Track it", desc: "Follow status, notes, and next steps in your dashboard." },
];

function ExtensionShowcase() {
  return (
    <section id="extension" className="landing-section" style={{ paddingTop: 0 }}>
      <div className="landing-container grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="section-kicker"><span className="dot" /> Chrome extension</p>
          <h2 className="section-title mt-3">Save the next opportunity where you find it.</h2>
          <p className="section-copy mt-3">
            The TrackMyHunt extension captures job details from your active tab and syncs them
            to your dashboard. It is distributed via GitHub — not the Chrome Web Store.
          </p>
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
