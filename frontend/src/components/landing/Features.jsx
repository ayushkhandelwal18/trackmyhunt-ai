import {
  Briefcase,
  KanbanSquare,
  CalendarClock,
  MailCheck,
  ScanSearch,
  FileText,
  GraduationCap,
  BookOpen,
  NotebookPen,
  MousePointerClick,
} from "lucide-react";

const GROUPS = [
  {
    label: "Core job tracking",
    items: [
      {
        title: "Application Tracking",
        desc: "Every application in one workspace — company, role, status, applied date, links, and notes. No more scattered spreadsheets.",
        icon: Briefcase,
      },
      {
        title: "Drag & Drop Kanban",
        desc: "A visual pipeline from Applied to Interview Scheduled and beyond. Drag cards between stages; the status updates.",
        icon: KanbanSquare,
      },
      {
        title: "Opportunity Planner",
        desc: "Line up upcoming roles with deadlines and next actions before applications open.",
        icon: CalendarClock,
      },
      {
        title: "Email Reminders",
        desc: "Opt-in follow-up digests and interview reminders by email, controlled from your profile settings.",
        icon: MailCheck,
      },
    ],
  },
  {
    label: "AI + resume",
    items: [
      {
        title: "AI Resume Analyzer",
        desc: "Upload a resume PDF, paste a job description, and get an explainable Resume Match Score with matched skills, must-have gaps, and improvements.",
        icon: ScanSearch,
      },
      {
        title: "Resume Manager",
        desc: "Keep links to each resume version organized in one place for different roles.",
        icon: FileText,
      },
    ],
  },
  {
    label: "Career workspace",
    items: [
      {
        title: "Skillboard",
        desc: "Track the skills you're learning against what target roles require, and spot what to improve next.",
        icon: GraduationCap,
      },
      {
        title: "Resources Hub",
        desc: "Organize prep links, guides, and reference material where you'll actually find them.",
        icon: BookOpen,
      },
      {
        title: "Notes / Brain Dump",
        desc: "Capture interview prep, takeaways, and job-specific thoughts in seconds.",
        icon: NotebookPen,
      },
      {
        title: "Job Capture Extension",
        desc: "Save openings from LinkedIn, Indeed, Wellfound, and Greenhouse in one click. Distributed via GitHub.",
        icon: MousePointerClick,
      },
    ],
  },
];

function FeatureCard({ item }) {
  return (
    <article className="landing-card p-5">
      <div
        style={{
          display: "grid",
          placeItems: "center",
          height: 34,
          width: 34,
          borderRadius: 9,
          background: "var(--brand-soft)",
          border: "1px solid var(--brand-border)",
          color: "var(--brand)",
        }}
      >
        <item.icon size={17} />
      </div>
      <h3 className="mt-3" style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, color: "var(--text-strong)" }}>{item.title}</h3>
      <p className="mt-1.5 text-sm leading-6" style={{ color: "var(--muted)" }}>{item.desc}</p>
    </article>
  );
}

function Features() {
  return (
    <section id="features" className="landing-section" aria-labelledby="features-heading">
      <div className="landing-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-kicker"><span className="dot" /> Features</p>
          <h2 id="features-heading" className="section-title mt-3">More than an application tracker.</h2>
          <p className="section-copy mt-3">Track your applications, organize your job hunt, improve your resume, and stay on top of every opportunity — all in one place.</p>
        </div>
        {GROUPS.map((group) => (
          <div key={group.label} className="mt-6 sm:mt-8">
            <h3 style={{ margin: "0 0 0.8rem", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--faint)" }}>
              {group.label}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {group.items.map((item) => (
                <FeatureCard key={item.title} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;
