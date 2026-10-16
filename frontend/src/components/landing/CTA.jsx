import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import useReveal from "../../hooks/useReveal";

function CTA() {
  const { isAuthenticated } = useAuth();
  const ref = useReveal();

  return (
    <section id="cta" className="landing-section" aria-labelledby="cta-heading" style={{ paddingTop: 0 }}>
      <div className="landing-container">
        <div ref={ref} className="reveal cta-panel">
          <div style={{ position: "relative", zIndex: 1 }}>
            <p className="section-kicker"><span className="dot" /> Get started</p>
            <h2 id="cta-heading" className="mx-auto mt-4" style={{ maxWidth: "34rem", fontSize: "clamp(1.5rem, 3.2vw, 2.1rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2, color: "var(--text-strong)", textWrap: "balance" }}>
              Stop managing your job hunt across spreadsheets and scattered notes.
            </h2>
            <p className="mx-auto mt-3" style={{ maxWidth: "32rem", color: "var(--muted)", fontSize: "0.93rem", lineHeight: 1.65 }}>
              Bring your applications, resumes, skills, and opportunities together with TrackMyHunt. Free for job seekers.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
              <Link to={isAuthenticated ? "/dashboard" : "/auth"} className="app-button app-button-primary hero-cta-primary">
                Start tracking your job hunt <ArrowRight size={16} />
              </Link>
              <a href="#features" className="app-button app-button-secondary hero-cta-secondary">
                View features
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;
