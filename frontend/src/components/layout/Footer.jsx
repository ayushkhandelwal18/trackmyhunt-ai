import { Link } from "react-router-dom";
import { ArrowRight, Github, Mail, Crosshair } from "lucide-react";
import { TRACKMYHUNT_EXTENSION_GITHUB_URL } from "../../config/landingConfig";

function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
      <div className="landing-container grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:py-12">
        <div>
          <div className="flex items-center gap-2">
            <span style={{ display: "grid", placeItems: "center", height: 28, width: 28, borderRadius: 8, background: "var(--brand)", color: "#fff" }}>
              <Crosshair size={15} />
            </span>
            <span style={{ fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-strong)" }}>TrackMyHunt</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-6" style={{ color: "var(--muted)" }}>
            A focused job-search workspace for students. Track applications, analyze your resume against job descriptions, and stay on top of every deadline.
          </p>
          <Link to="/auth" className="app-button app-button-primary mt-5">
            Get started free <ArrowRight size={15} />
          </Link>
        </div>
        <nav aria-label="Product">
          <h4 style={{ margin: "0 0 0.8rem", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--faint)" }}>Product</h4>
          <ul className="space-y-2.5 text-sm" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            <li><a className="footer-link" href="#features">The workspace</a></li>
            <li><a className="footer-link" href="#tracker">Application tracker</a></li>
            <li><a className="footer-link" href="#analyzer">AI Resume Analyzer</a></li>
            <li><a className="footer-link" href="#workspace">Preparation workspace</a></li>
          </ul>
        </nav>
        <nav aria-label="Resources">
          <h4 style={{ margin: "0 0 0.8rem", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--faint)" }}>Resources</h4>
          <ul className="space-y-2.5 text-sm" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            <li><a className="footer-link" href="#howitworks">How it works</a></li>
            <li><a className="footer-link" href="#extension">Browser extension</a></li>
            <li><Link className="footer-link" to="/auth">Login / Signup</Link></li>
          </ul>
        </nav>
        <div>
          <h4 style={{ margin: "0 0 0.8rem", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--faint)" }}>Connect</h4>
          <ul className="space-y-2.5 text-sm" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            <li>
              <a className="footer-link" href="mailto:ayushdev186@gmail.com" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <Mail size={14} /> ayushdev186@gmail.com
              </a>
            </li>
            <li>
              <a className="footer-link" href={TRACKMYHUNT_EXTENSION_GITHUB_URL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <Github size={14} /> Extension on GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="landing-container flex flex-col gap-1 border-t py-5 text-sm sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border)", color: "var(--faint)" }}>
        <span>© {new Date().getFullYear()} TrackMyHunt. All rights reserved.</span>
        <span className="text-xs">Free for job seekers · Built for focused job hunting</span>
      </div>
    </footer>
  );
}

export default Footer;
