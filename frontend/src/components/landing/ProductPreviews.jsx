import { Calendar, Clock, MailCheck } from "lucide-react";

const COLUMNS = [
  {
    status: "Applied",
    cards: [
      { company: "Frontend Intern", role: "Nova Labs", meta: "Applied Jan 12" },
      { company: "Backend Intern", role: "Datawise", meta: "Applied Jan 15" },
    ],
  },
  {
    status: "OA Done",
    cards: [{ company: "SDE Intern", role: "Cloudnine", meta: "OA completed" }],
  },
  {
    status: "Interview Scheduled",
    cards: [{ company: "Full-Stack Intern", role: "Brightstack", meta: "Fri · 10:00 AM", hot: true }],
  },
  {
    status: "Rejected",
    cards: [],
  },
];

const TIMELINE = [
  { when: "Today", text: "Backend Intern — follow up", icon: MailCheck },
  { when: "Tomorrow", text: "SDE Interview — 10:00 AM", icon: Clock },
  { when: "Friday", text: "Application deadline", icon: Calendar },
];

function KanbanPreview() {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "var(--text-strong)" }}>
          Your pipeline, visualized
        </h3>
        <span className="app-badge app-badge-neutral">Product preview</span>
      </div>
      <p className="mt-1.5 text-sm leading-6" style={{ color: "var(--muted)" }}>
        Drag cards between real stages — Applied, OA Done, Interview Scheduled, Rejected — and the status updates.
      </p>
      <div className="mt-4 sm:overflow-x-auto sm:pb-1" role="img" aria-label="Preview of the TrackMyHunt Kanban board with application cards across Applied, OA Done, Interview Scheduled, and Rejected columns">
        <div className="flex flex-col gap-2.5 sm:min-w-[560px] sm:flex-row">
          {COLUMNS.map((col) => (
            <div key={col.status} className="flex-1 rounded-xl border p-2.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <span style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.04em", color: "var(--text)" }}>{col.status}</span>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--faint)" }}>{col.cards.length}</span>
              </div>
              <div className="grid gap-2">
                {col.cards.map((card) => (
                  <div key={card.company} className="app-card cursor-grab p-3">
                    <p className="truncate" style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: "var(--text-strong)" }}>
                      {card.company}
                    </p>
                    <p className="truncate" style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "var(--muted)" }}>
                      {card.role}
                    </p>
                    <p
                      className="truncate"
                      style={{
                        margin: "6px 0 0",
                        fontSize: "0.7rem",
                        fontWeight: card.hot ? 700 : 500,
                        color: card.hot ? "var(--brand)" : "var(--muted)",
                      }}
                    >
                      {card.meta}
                    </p>
                  </div>
                ))}
                {col.cards.length === 0 && (
                  <p style={{ margin: 0, padding: "0.4rem 0.2rem", fontSize: "0.72rem", color: "var(--faint)" }}>No applications</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReminderPreview() {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "var(--text-strong)" }}>
          Never miss a date
        </h3>
        <span className="app-badge app-badge-neutral">Example</span>
      </div>
      <p className="mt-1.5 text-sm leading-6" style={{ color: "var(--muted)" }}>
        Opt-in email reminders — follow-up digests and interview alerts, managed in your Profile.
      </p>
      <div className="mt-4 grid gap-2" role="img" aria-label="Example reminder timeline showing a follow-up today, an interview tomorrow, and a deadline Friday">
        {TIMELINE.map((row) => (
          <div key={row.when} className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <span
              style={{
                display: "grid",
                placeItems: "center",
                height: 30,
                width: 30,
                flexShrink: 0,
                borderRadius: 999,
                background: "var(--brand-soft)",
                border: "1px solid var(--brand-border)",
                color: "var(--brand)",
              }}
            >
              <row.icon size={14} />
            </span>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--faint)", minWidth: 64 }}>
              {row.when}
            </span>
            <span className="min-w-0 truncate" style={{ fontSize: "0.83rem", color: "var(--text)" }}>{row.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductPreviews() {
  return (
    <section id="preview" className="landing-section" aria-labelledby="preview-heading" style={{ paddingTop: 0 }}>
      <div className="landing-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-kicker"><span className="dot" /> See it in action</p>
          <h2 id="preview-heading" className="section-title mt-3">Built to look like your hunt feels.</h2>
        </div>
        <div className="mt-8 grid items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="landing-card p-5">
            <KanbanPreview />
          </div>
          <div className="landing-card p-5">
            <ReminderPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductPreviews;
