import { Quote } from "lucide-react";


const TESTIMONIALS = [
  {
    name: "Ankit Kumar",
    detail: "Mern Stack Developer",
    quote: "TrackMyHunt makes it much easier to keep my job applications organized and track where I am in the process.",
  },
  {
    name: "Rohit Kumar",
    detail: "B.Tech Student",
    quote: "Having applications, opportunities, and preparation resources in one place makes the job search much easier to manage.",
  },
  {
    name: "Rishabh Sharma",
    detail: "Aspiring Software Engineer",
    quote: "The centralized application tracking makes it easier to stay organized instead of maintaining everything across different notes and spreadsheets.",
  },
  {
    name: "Ayush Kumar",
    detail: "B.Tech Student",
    quote: "The Kanban-style workflow gives a clear view of which applications are still pending and which ones need attention.",
  },
  {
    name: "Minakshi Sharma",
    detail: "Upcoming SDE Intern",
    quote: "The resume analyzer and application tracking features make the overall job-hunting workflow more structured and easier to follow.",
  },
];

function Testimonials() {
  return (
    <section id="stories" className="landing-section" aria-labelledby="stories-heading" style={{ paddingTop: 0 }}>
      <div className="landing-container">
        <div className="mx-auto mb-6 max-w-2xl text-center">
          <p className="section-kicker"><span className="dot" /> Testimonials</p>
          <h2 id="stories-heading" className="section-title mt-3">What Students Say</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <figure key={item.name} className="landing-card flex h-full flex-col p-5" style={{ margin: 0 }}>
              <Quote size={18} style={{ color: "var(--brand)" }} aria-hidden="true" />
              <blockquote className="mt-3 flex-1" style={{ margin: "0.75rem 0 0", fontSize: "0.86rem", lineHeight: 1.65, color: "var(--text)" }}>
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "var(--text-strong)" }}>{item.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>{item.detail}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
