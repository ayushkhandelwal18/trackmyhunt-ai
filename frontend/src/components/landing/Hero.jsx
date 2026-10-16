import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, PlayCircle, ScanSearch, CalendarClock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import dashboardPreview from "../../assets/image.png";

function Hero() {
  const { isAuthenticated } = useAuth();

  return (
    <section id="home" className="tmh-hero landing-section" style={{ paddingTop: "clamp(2.5rem, 5vw, 4rem)" }}>
      <div className="landing-container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="hero-badge hero-enter" style={{ ["--enter-delay"]: "0ms" }}>
            <span className="pulse" aria-hidden="true" />
            Job-search command center
          </p>
          <h1 className="hero-title hero-enter mt-5" style={{ ["--enter-delay"]: "80ms" }}>
            Your entire job hunt,{" "}
            <span className="accent">
              organized
              <svg viewBox="0 0 220 12" preserveAspectRatio="none" aria-hidden="true">
                <path d="M3 9 C 60 3, 160 3, 217 8" fill="none" stroke="var(--brand)" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
              </svg>
            </span>{" "}
            in one place.
          </h1>
          <p className="hero-sub hero-enter mx-auto mt-5" style={{ ["--enter-delay"]: "160ms" }}>
            Track applications across a 6-stage pipeline, capture roles with the
            Copilot extension, analyze your resume against any job description,
            and get reminded of follow-ups — free for job seekers.
          </p>
          <div className="hero-enter mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row" style={{ ["--enter-delay"]: "240ms" }}>
            <Link
              to={isAuthenticated ? "/dashboard" : "/auth"}
              className="app-button app-button-primary hero-cta-primary w-full sm:w-auto"
            >
              Start tracking — it&rsquo;s free <ArrowRight size={16} />
            </Link>
            <a href="#features" className="app-button app-button-secondary hero-cta-secondary w-full sm:w-auto">
              <PlayCircle size={16} /> See how it works
            </a>
          </div>
          <div className="hero-ticks hero-enter mt-6 justify-center" style={{ ["--enter-delay"]: "320ms" }}>
            <span><CheckCircle2 size={15} /> 6-stage Kanban</span>
            <span><CheckCircle2 size={15} /> AI match analysis</span>
            <span><CheckCircle2 size={15} /> Follow-up & interview reminders</span>
          </div>
        </div>

        <div className="hero-enter mx-auto mt-10 max-w-4xl" style={{ ["--enter-delay"]: "400ms" }}>
          <div className="preview-frame">
            <div className="preview-frame-bar">
              <span className="preview-dot" />
              <span className="preview-dot" />
              <span className="preview-dot brand" />
              <span className="ml-2 min-w-0 truncate">trackmyhunt — dashboard</span>
              <span className="app-badge app-badge-warning ml-auto hidden sm:inline-flex">Live product</span>
            </div>
            <img
              src={dashboardPreview}
              alt="TrackMyHunt dashboard showing tracked job applications across pipeline stages"
              className="h-auto w-full"
              loading="eager"
              fetchPriority="high"
            />
            <div className="float-card" style={{ left: "1.25rem", bottom: "1.25rem" }} aria-hidden="true">
              <span className="ic"><CalendarClock size={15} /></span>
              <span><strong>Interview · Fri 10:00 AM</strong><small>SDE Intern — reminder set</small></span>
            </div>
            <div className="float-card" style={{ right: "1.25rem", top: "3.5rem", animationDelay: "1.2s" }} aria-hidden="true">
              <span className="ic"><ScanSearch size={15} /></span>
              <span><strong>Resume match · 78%</strong><small>Good fit for backend role</small></span>
            </div>
          </div>
          <p className="mt-3 text-center text-xs" style={{ color: "var(--faint)" }}>
            Real TrackMyHunt dashboard — your applications, pipeline, and reminders in one view.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Hero;
