import { ExternalLink } from "lucide-react";
import { formatLongDate, formatTime } from "../../utils/datetime";

/**
 * Reusable vertical timeline for one application's persisted history.
 * Events come from the backend (created + status changes with snapshots);
 * nothing here is fabricated. Oldest first, matching the suggested layout.
 *
 * When there is no history yet (applications created before events were
 * recorded), callers pass appliedDate to render the single submitted entry.
 */
function ApplicationTimeline({ events = [], appliedDate }) {
  const items = Array.isArray(events) ? events : [];

  if (items.length === 0) {
    return (
      <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
        <TimelineItem
          isLast
          date={appliedDate ? formatLongDate(appliedDate) : ""}
          title="Application submitted"
          lines={[]}
        />
      </ol>
    );
  }

  return (
    <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {items.map((event, index) => {
        const described = describeEvent(event);
        return (
          <TimelineItem
            key={event._id || index}
            isLast={index === items.length - 1}
            date={event.createdAt ? formatLongDate(event.createdAt) : ""}
            title={described.title}
            lines={described.lines}
            action={described.action}
          />
        );
      })}
    </ol>
  );
}

function describeEvent(event) {
  const snapshot = event.snapshot || {};
  const interview = snapshot.interview || {};
  const oa = snapshot.oa || {};
  const rejection = snapshot.rejection || {};
  const interviewWhen = [formatLongDate(interview.date), formatTime(interview.time)]
    .filter(Boolean)
    .join(" · ");

  if (event.type === "created") {
    return {
      title: "Application submitted",
      lines: event.toStatus ? [`Status: ${event.toStatus}`] : [],
    };
  }

  const lines = [];
  let title = event.toStatus ? `Status changed to ${event.toStatus}` : "Status changed";

  if (event.toStatus === "OA Done") {
    title = "OA completed";
    if (oa.date) lines.push(formatLongDate(oa.date));
  } else if (event.toStatus === "Interview Scheduled") {
    title = "Interview scheduled";
    if (interviewWhen) lines.push(interviewWhen);
    if (interview.type) lines.push(`${interview.type} interview`);
  } else if (event.toStatus === "Interview Done") {
    title = "Interview completed";
    if (interview.type) lines.push(`${interview.type} interview`);
  } else if (event.toStatus === "Rejected") {
    title = "Application rejected";
    if (rejection.reason) lines.push(rejection.reason);
  } else if (event.toStatus === "Resume Shortlisted") {
    title = "Resume shortlisted";
  } else if (event.toStatus === "Applied") {
    title = "Moved back to Applied";
  }

  if (snapshot.resumeTitle) lines.push(`Resume: ${snapshot.resumeTitle}`);

  const action =
    event.toStatus === "Interview Scheduled" && interview.link
      ? { label: "Join interview", href: interview.link }
      : null;

  return { title, lines, action };
}

function TimelineItem({ date, title, lines, action, isLast }) {
  return (
    <li style={{ position: "relative", paddingLeft: 22, paddingBottom: isLast ? 0 : 18 }}>
      {!isLast && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 5,
            top: 16,
            bottom: -2,
            width: 2,
            background: "var(--border)",
            borderRadius: 2,
          }}
        />
      )}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: 4,
          height: 12,
          width: 12,
          borderRadius: 999,
          background: "var(--brand)",
          border: "2px solid var(--surface)",
          boxShadow: "0 0 0 1px var(--brand-border)",
        }}
      />
      {date && (
        <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--faint)" }}>{date}</div>
      )}
      <div style={{ marginTop: 2, fontSize: "0.85rem", fontWeight: 650, color: "var(--text-strong)" }}>
        {title}
      </div>
      {lines.map((line, index) => (
        <div key={index} style={{ marginTop: 2, fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.55 }}>
          {line}
        </div>
      ))}
      {action && (
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: "0.78rem", fontWeight: 600, color: "var(--brand)" }}
        >
          <ExternalLink size={12} /> {action.label}
        </a>
      )}
    </li>
  );
}

export default ApplicationTimeline;
