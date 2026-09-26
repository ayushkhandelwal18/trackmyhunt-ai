import { ExternalLink, CalendarClock, Pencil, Trash2 } from "lucide-react";

function OpportunityCard({ item, onEdit, onDelete }) {
  return (
    <div className="app-card flex h-full flex-col p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-strong)" }} className="truncate">
            {item.company}
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--muted)" }} className="truncate">
            {item.role}
          </p>
        </div>
        <span className="app-badge app-badge-warning">{item.type}</span>
      </div>

      <div className="mb-4 flex-1 space-y-2" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
        <div className="flex items-center gap-2">
          <CalendarClock size={14} />
          <span>
            Opening: <strong style={{ color: "var(--text)" }}>{item.openingMonth} {item.openingYear}</strong>
          </span>
        </div>
        {item.skills && <div className="line-clamp-2">{item.skills}</div>}
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--brand)", fontWeight: 600 }}
          >
            <ExternalLink size={13} /> Apply link
          </a>
        )}
      </div>

      <div className="flex justify-end gap-2" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.8rem" }}>
        <button type="button" onClick={() => onEdit(item)} className="app-icon-button" aria-label={`Edit ${item.company} opportunity`}>
          <Pencil size={15} />
        </button>
        <button type="button" onClick={() => onDelete(item)} className="app-icon-button danger" aria-label={`Delete ${item.company} opportunity`}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

export default OpportunityCard;
