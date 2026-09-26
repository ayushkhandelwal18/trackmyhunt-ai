import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink } from "lucide-react";
import Modal from "../ui/Modal";
import AppButton from "../ui/AppButton";
import { Field, TextInput, Textarea } from "../ui/FormField";
import { addResume } from "../../services/api";

function normalizeLink(link) {
  return (link || "").trim();
}

/**
 * Create-a-resume flow launched from inside the application form.
 * - Exact link matching: if the typed link already exists in
 *   `existingResumes`, offer to use it instead of creating a duplicate.
 * - onSaved(resume): called with the created (or matched) resume so the
 *   caller can append it to its list and auto-select it.
 */
function QuickAddResumeModal({ isOpen, onClose, existingResumes = [], onSaved }) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setTitle("");
    setLink("");
    setDescription("");
    setError("");
    setSaving(false);
  }, [isOpen]);

  const matchedResume = useMemo(() => {
    const needle = normalizeLink(link);
    if (!needle) return null;
    return (
      existingResumes.find((resume) => normalizeLink(resume.link) === needle) || null
    );
  }, [link, existingResumes]);

  async function handleSave() {
    if (!title.trim() || !normalizeLink(link)) {
      setError("Please provide both a title and a resume link.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const response = await addResume({
        title: title.trim(),
        link: normalizeLink(link),
        description: description.trim(),
      });
      const created = response?.resume || response;
      if (!created?._id) throw new Error("Failed to save resume.");
      onSaved(created);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save resume.");
    } finally {
      setSaving(false);
    }
  }

  function handleUseExisting() {
    if (!matchedResume) return;
    onSaved(matchedResume);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add resume"
      size="max-w-md"
      zIndex={70}
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </AppButton>
          <AppButton loading={saving} onClick={handleSave}>
            Save &amp; use
          </AppButton>
        </>
      }
    >
      {error && <div className="app-form-error">{error}</div>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-4"
      >
        <Field label="Title" required>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Backend Developer Resume"
            required
          />
        </Field>
        <Field label="Resume link" required>
          <TextInput
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://drive.google.com/…"
            required
          />
        </Field>
        {matchedResume && (
          <div
            className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5"
            style={{ borderColor: "var(--brand-border)", background: "var(--brand-soft)" }}
          >
            <CheckCircle2 size={15} style={{ color: "var(--brand)", flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 160, fontSize: "0.8rem", color: "var(--text)" }}>
              Existing resume found: <strong>{matchedResume.title}</strong>
            </span>
            <button
              type="button"
              onClick={handleUseExisting}
              style={{
                background: "none",
                border: 0,
                cursor: "pointer",
                padding: 0,
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "var(--brand)",
              }}
            >
              Use existing
            </button>
          </div>
        )}
        <Field label="Description">
          <Textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. For Node.js/backend roles"
          />
        </Field>
        {matchedResume?.link && (
          <a
            href={matchedResume.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.78rem", fontWeight: 600, color: "var(--brand)" }}
          >
            <ExternalLink size={12} /> Preview matched resume
          </a>
        )}
      </form>
    </Modal>
  );
}

export default QuickAddResumeModal;
