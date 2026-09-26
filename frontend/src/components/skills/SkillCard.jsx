import { Target, Pencil, Trash2 } from "lucide-react";

function SkillCard({ skill, onEdit, onDelete }) {
  return (
    <div className="app-card flex h-full flex-col p-5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-strong)" }}>{skill.name}</h3>
        <span className="app-badge app-badge-neutral">{skill.proficiency}</span>
      </div>

      <div className="flex-1">
        <p style={{ margin: "0 0 0.6rem", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--faint)" }}>
          {skill.category}
        </p>
        {skill.target && (
          <div className="app-card app-card-subtle p-3">
            <div className="mb-1 flex items-center gap-2" style={{ color: "var(--brand)", fontSize: "0.7rem", fontWeight: 700 }}>
              <Target size={13} /> IMPROVEMENT PLAN
            </div>
            <p style={{ margin: 0, fontSize: "0.82rem", lineHeight: 1.55, color: "var(--muted)" }} className="line-clamp-3">
              {skill.target}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-end gap-2" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.8rem" }}>
        <button type="button" onClick={() => onEdit(skill)} className="app-icon-button" aria-label={`Edit ${skill.name} skill`}>
          <Pencil size={15} />
        </button>
        <button type="button" onClick={() => onDelete(skill)} className="app-icon-button danger" aria-label={`Delete ${skill.name} skill`}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

export default SkillCard;
