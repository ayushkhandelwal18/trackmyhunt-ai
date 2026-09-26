import { ExternalLink, Pencil, Trash2 } from "lucide-react";

function ResourceCard({ resource, onEdit, onDelete }) {
  return (
    <div className="app-card flex h-full flex-col p-5">
      <div className="mb-2">
        <div style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--faint)", marginBottom: 4 }}>
            {resource.type}
          </span>
          <h3 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, color: "var(--text-strong)", lineHeight: 1.35 }} className="line-clamp-2">
            {resource.title}
          </h3>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {resource.description && (
          <p style={{ margin: 0, fontSize: "0.82rem", lineHeight: 1.6, color: "var(--muted)" }} className="line-clamp-3">
            {resource.description}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.8rem" }}>
        <a
          href={resource.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.8rem", fontWeight: 600, color: "var(--brand)" }}
        >
          <ExternalLink size={13} /> Open link
        </a>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => onEdit(resource)} className="app-icon-button" aria-label={`Edit ${resource.title}`}>
            <Pencil size={15} />
          </button>
          <button type="button" onClick={() => onDelete(resource)} className="app-icon-button danger" aria-label={`Delete ${resource.title}`}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResourceCard;
