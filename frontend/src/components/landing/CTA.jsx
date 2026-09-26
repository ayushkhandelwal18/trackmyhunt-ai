import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function CTA() {
  const { isAuthenticated } = useAuth();
  return (
    <section id="cta" className="landing-section" style={{ paddingTop: 0 }}>
      <div className="landing-container">
        <div className="landing-card px-5 py-10 text-center sm:px-12 sm:py-12">
          <h2 className="mx-auto" style={{ maxWidth: "34rem", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-strong)" }}>
            Stop managing your job hunt across spreadsheets and scattered notes.
          </h2>
          <p className="mx-auto mt-3" style={{ maxWidth: "32rem", color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.65 }}>
            Bring your applications, resumes, skills, and opportunities together with TrackMyHunt.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
            <Link to={isAuthenticated ? "/dashboard" : "/auth"} className="app-button app-button-primary" style={{ minHeight: 44 }}>
              Start Tracking Your Job Hunt <ArrowRight size={16} />
            </Link>
            <a href="#features" className="app-button app-button-secondary" style={{ minHeight: 44 }}>
              View features
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;
