import { Github, Mail, Crosshair } from "lucide-react";
import { Link } from "react-router-dom";
import { TRACKMYHUNT_EXTENSION_GITHUB_URL } from "../../config/landingConfig";

function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
      <div className="landing-container grid gap-6 py-8 md:grid-cols-[1.4fr_1fr_1fr] md:gap-8 md:py-10">
        <div>
          <div className="flex items-center gap-2">
            <span style={{ display: "grid", placeItems: "center", height: 26, width: 26, borderRadius: 8, background: "var(--brand)", color: "#fff" }}>
              <Crosshair size={14} />
            </span>
            <span style={{ fontWeight: 800, color: "var(--text-strong)" }}>TrackMyHunt</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-6" style={{ color: "var(--muted)" }}>
            A focused job-search workspace for students. Track applications, analyze your resume against job descriptions, and stay on top of every deadline.
          </p>
        </div>
        <div>
          <h4 style={{ margin: "0 0 0.8rem", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-strong)" }}>Product</h4>
          <ul className="space-y-2.5 text-sm" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            <li><a href="#features" style={{ color: "var(--muted)" }}>Features</a></li>
            <li><a href="#analyzer" style={{ color: "var(--muted)" }}>AI Resume Analyzer</a></li>
            <li><a href="#howitworks" style={{ color: "var(--muted)" }}>How it works</a></li>
            <li><a href="#stories" style={{ color: "var(--muted)" }}>Testimonials</a></li>
            <li><Link to="/auth" style={{ color: "var(--muted)" }}>Login / Signup</Link></li>
          </ul>
        </div>
        <div>
          <h4 style={{ margin: "0 0 0.8rem", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-strong)" }}>Connect</h4>
          <ul className="space-y-2.5 text-sm" style={{ listStyle: "none", margin: 0, padding: 0, color: "var(--muted)" }}>
            <li>
              <a href="mailto:ayushdev186@gmail.com" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--muted)" }}>
                <Mail size={14} /> ayushdev186@gmail.com
              </a>
            </li>
            <li>
              <a href={TRACKMYHUNT_EXTENSION_GITHUB_URL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--muted)" }}>
                <Github size={14} /> Extension on GitHub
              </a>
            </li>
            <li>
              <a href="https://x.com/ak_h2518" target="_blank" rel="noopener noreferrer" style={{ color: "var(--muted)" }}>
                X / Twitter
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="landing-container border-t py-5 text-sm" style={{ borderColor: "var(--border)", color: "var(--faint)" }}>
        © {new Date().getFullYear()} TrackMyHunt. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
