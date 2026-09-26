import { Fragment } from "react";
import { ChevronDown } from "lucide-react";

function HowItWorks() {
  const steps = [
    { step: "01", title: "Add your opportunities", desc: "Save roles manually or capture them with the extension." },
    { step: "02", title: "Organize your pipeline", desc: "Track every application and drag cards through each stage." },
    { step: "03", title: "Analyze your resume", desc: "Upload your PDF, paste the JD, and get an explainable match score." },
    { step: "04", title: "Stay on top of deadlines", desc: "Plan next actions and get follow-up and interview email reminders." },
    { step: "05", title: "Track your progress", desc: "Review your dashboard and keep skills, notes, and resources close." },
  ];

  return (
    <section id="howitworks" className="landing-section" style={{ paddingTop: 0 }}>
      <div className="landing-container">
        <div className="landing-card grid gap-8 p-5 sm:p-9 lg:grid-cols-[0.9fr_1.6fr]">
          <div>
            <p className="section-kicker"><span className="dot" /> How it works</p>
            <h2 className="mt-3" style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-strong)" }}>
              From scattered to organized
            </h2>
            <p className="section-copy mt-2 text-sm">No spreadsheets. Just a calmer workflow.</p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {steps.map((item, index) => (
              <Fragment key={item.step}>
                <li className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                  <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em", color: "var(--faint)" }}>{item.step}</p>
                  <h3 className="mt-1.5" style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "var(--text-strong)" }}>{item.title}</h3>
                  <p className="mt-1 text-sm leading-6" style={{ color: "var(--muted)" }}>{item.desc}</p>
                </li>
                {index < steps.length - 1 && (
                  <li aria-hidden="true" className="flex justify-center sm:hidden" style={{ margin: "-0.35rem 0" }}>
                    <ChevronDown size={16} style={{ color: "var(--faint)" }} />
                  </li>
                )}
              </Fragment>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
