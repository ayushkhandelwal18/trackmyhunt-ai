import { useState } from "react";
import { Calendar, Hash, Pencil, Trash2 } from "lucide-react";

function NoteCard({ note, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const contentLimit = 150;
  const content = note.content || "";
  const isLong = content.length > contentLimit;
  const displayContent = expanded || !isLong ? content : `${content.slice(0, contentLimit)}…`;

  return (
    <div className="app-card mb-4 flex break-inside-avoid flex-col p-5">
      <div className="mb-2">
        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-strong)" }}>{note.title}</h3>
        <div className="mt-1 flex items-center gap-1.5" style={{ fontSize: "0.72rem", color: "var(--faint)" }}>
          <Calendar size={12} />
          <span>
            {note.date
              ? new Date(note.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
              : ""}
          </span>
        </div>
      </div>

      <p style={{ margin: "0 0 0.7rem", fontSize: "0.83rem", lineHeight: 1.65, whiteSpace: "pre-wrap", color: "var(--text)" }}>
        {displayContent}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{ alignSelf: "flex-start", marginBottom: "0.7rem", fontSize: "0.75rem", fontWeight: 650, color: "var(--brand)", background: "none", border: 0, cursor: "pointer", padding: 0 }}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {note.tags && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {note.tags.split(",").map((tag, idx) => (
            <span key={idx} className="app-badge app-badge-neutral">
              <Hash size={10} /> {tag.trim()}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-1.5" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.8rem" }}>
        <button type="button" onClick={() => onEdit(note)} className="app-icon-button" aria-label={`Edit ${note.title}`}>
          <Pencil size={15} />
        </button>
        <button type="button" onClick={() => onDelete(note)} className="app-icon-button danger" aria-label={`Delete ${note.title}`}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

export default NoteCard;
