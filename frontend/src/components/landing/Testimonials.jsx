import { Quote } from "lucide-react";

// Placeholder sample quotes. Replace each `quote` with the student's actual
// feedback before publishing — no verified testimonial text exists yet.
// Only this array needs to change; the layout stays the same.
const TESTIMONIALS = [
  {
    name: "Keshab Kashyap",
    detail: "B.Tech CSE — IIIT Kota",
    quote: "Sample student feedback — replace this with Keshab's actual feedback before publishing.",
  },
  {
    name: "Arthav Jain",
    detail: "B.Tech ECE — IIIT Kota",
    quote: "Sample student feedback — replace this with Arthav's actual feedback before publishing.",
  },
  {
    name: "N.S. Santosh",
    detail: "B.Tech ECE — IIIT Kota",
    quote: "Sample student feedback — replace this with Santosh's actual feedback before publishing.",
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
