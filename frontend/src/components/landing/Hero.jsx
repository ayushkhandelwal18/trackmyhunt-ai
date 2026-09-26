import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import dashboardPreview from "../../assets/image.png";

function Hero() {
  const { isAuthenticated } = useAuth();
  return (
    <section id="home" className="landing-section" style={{ paddingTop: "clamp(2.5rem, 5vw, 4rem)" }}>
      <div className="landing-container grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="section-kicker"><span className="dot" /> Job-search command center</p>
          <h1 className="mt-4" style={{ fontSize: "clamp(2.1rem, 4.4vw, 3.1rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, color: "var(--text-strong)" }}>
            Your entire job hunt, organized in one place.
          </h1>
          <p className="section-copy mt-4" style={{ maxWidth: "34rem" }}>
            Track applications, manage your opportunities, analyze your resume against job
            descriptions, and stay on top of every deadline.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Link to={isAuthenticated ? "/dashboard" : "/auth"} className="app-button app-button-primary" style={{ minHeight: 44, padding: "0.7rem 1.4rem" }}>
              Start Tracking <ArrowRight size={16} />
            </Link>
            <a href="#features" className="app-button app-button-secondary" style={{ minHeight: 44, padding: "0.7rem 1.4rem" }}>
              Explore Features
            </a>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm" style={{ color: "var(--muted)" }}>
            <span><strong style={{ color: "var(--text-strong)" }}>Kanban</strong> pipeline</span>
            <span><strong style={{ color: "var(--text-strong)" }}>AI</strong> resume analysis</span>
            <span><strong style={{ color: "var(--text-strong)" }}>Free</strong> for job seekers</span>
          </div>
        </div>

        <div className="landing-card overflow-hidden">
          <div className="flex items-center gap-2 border-b px-4 py-2.5 text-xs" style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface-2)" }}>
            <span style={{ height: 8, width: 8, borderRadius: 999, background: "var(--border-strong)" }} />
            <span style={{ height: 8, width: 8, borderRadius: 999, background: "var(--border-strong)" }} />
            <span style={{ height: 8, width: 8, borderRadius: 999, background: "var(--brand)" }} />
            <span className="ml-2 min-w-0 truncate" style={{ fontWeight: 600 }}>trackmyhunt / dashboard</span>
          </div>
          <img src={dashboardPreview} alt="TrackMyHunt dashboard showing tracked applications" className="h-auto w-full" loading="lazy" />
        </div>
      </div>
    </section>
  );
}

export default Hero;
