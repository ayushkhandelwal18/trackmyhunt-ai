import { Plus, FileText } from "lucide-react";
import { Select } from "../ui/FormField";

/**
 * Resume Used picker for the application form.
 * - value: resume _id string ("" = no mapping)
 * - resumes: the authenticated user's saved resumes
 * - stale: true when the stored id matches no loaded resume (e.g. deleted
 *   outside the normal flow) — shows a warning instead of crashing.
 */
function ResumePicker({ resumes, loading, value, stale, onChange, onAddClick }) {
  if (loading) {
    return (
      <div className="app-skeleton" style={{ height: 40 }} aria-label="Loading resumes" />
    );
  }

  if (!resumes || resumes.length === 0) {
    return (
      <div
        className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed px-3 py-2.5"
        style={{ borderColor: "var(--border-strong)" }}
      >
        <FileText size={15} style={{ color: "var(--faint)", flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 140, fontSize: "0.82rem", color: "var(--muted)" }}>
          No saved resumes yet.
        </span>
        <button
          type="button"
          onClick={onAddClick}
          className="app-button app-button-secondary"
          style={{ minHeight: 32, padding: "0.35rem 0.7rem", fontSize: "0.78rem" }}
        >
          <Plus size={14} /> Add resume
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {stale && (
        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--danger)" }}>
          The previously mapped resume is no longer available. Select another one below.
        </p>
      )}
      <Select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Resume used">
        <option value="">No resume — skip</option>
        {resumes.map((resume) => (
          <option key={resume._id} value={resume._id}>
            {resume.title}
          </option>
        ))}
      </Select>
      <button
        type="button"
        onClick={onAddClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          background: "none",
          border: 0,
          cursor: "pointer",
          padding: 0,
          fontSize: "0.78rem",
          fontWeight: 600,
          color: "var(--brand)",
        }}
      >
        <Plus size={14} /> Add a new resume
      </button>
    </div>
  );
}

export default ResumePicker;
