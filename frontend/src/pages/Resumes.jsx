import { useEffect, useRef, useState } from "react";
import { Plus, FileText, ExternalLink, Pencil, Trash2, Copy, Check } from "lucide-react";
import { getResumes, addResume, deleteResume, updateResume, getApplications } from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { Field, TextInput, Textarea } from "../components/ui/FormField";

function ResumeCard({ resume, usageCount, onEdit, onDelete }) {
  const [copyState, setCopyState] = useState("idle");
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy() {
    if (!resume.link) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      if (!navigator?.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(resume.link);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    timerRef.current = setTimeout(() => setCopyState("idle"), 1600);
  }

  return (
    <AppCard className="flex h-full flex-col p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div
          style={{
            display: "grid",
            placeItems: "center",
            height: 36,
            width: 36,
            borderRadius: 10,
            background: "var(--brand-soft)",
            border: "1px solid var(--brand-border)",
            color: "var(--brand)",
          }}
        >
          <FileText size={17} />
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={onEdit} className="app-icon-button" aria-label={`Edit ${resume.title}`}>
            <Pencil size={15} />
          </button>
          <button type="button" onClick={onDelete} className="app-icon-button danger" aria-label={`Delete ${resume.title}`}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <h3 style={{ margin: "0 0 4px", fontSize: "0.93rem", fontWeight: 700, color: "var(--text-strong)" }}>
        {resume.title}
      </h3>
      {resume.description ? (
        <p style={{ margin: "0 0 0.4rem", fontSize: "0.82rem", lineHeight: 1.6, color: "var(--muted)" }} className="line-clamp-2 flex-1">
          {resume.description}
        </p>
      ) : (
        <div className="flex-1" />
      )}
      {usageCount > 0 && (
        <p style={{ margin: "0 0 0.8rem", fontSize: "0.75rem", color: "var(--faint)" }}>
          Used in {usageCount} application{usageCount === 1 ? "" : "s"}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.8rem", fontSize: "0.75rem", color: "var(--faint)" }}>
        <span>{resume.createdAt ? new Date(resume.createdAt).toLocaleDateString() : ""}</span>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy link"
            aria-label={`Copy link for ${resume.title}`}
            aria-live="polite"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.8rem", fontWeight: 600, color: "var(--brand)", background: "none", border: "none", cursor: "pointer", padding: "6px 4px" }}
          >
            {copyState === "copied" ? (
              <>
                <Check size={13} /> Copied!
              </>
            ) : copyState === "error" ? (
              <>Copy failed</>
            ) : (
              <>
                <Copy size={13} /> Copy link
              </>
            )}
          </button>
          <a
            href={resume.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.8rem", fontWeight: 600, color: "var(--brand)", padding: "6px 0 6px 4px" }}
          >
            Open link <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </AppCard>
  );
}

function Resumes() {
  const [resumes, setResumes] = useState([]);
  const [usageCounts, setUsageCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({ title: "", link: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function fetchResumes() {
    try {
      setLoading(true);
      setError("");
      const data = await getResumes();
      setResumes(Array.isArray(data?.resumes) ? data.resumes : Array.isArray(data) ? data : []);
      try {
        const apps = await getApplications();
        const counts = {};
        (Array.isArray(apps) ? apps : []).forEach((app) => {
          const ref = app.resumeId;
          const id = typeof ref === "string" ? ref : ref?._id;
          if (id) counts[id] = (counts[id] || 0) + 1;
        });
        setUsageCounts(counts);
      } catch {
        setUsageCounts({});
      }
    } catch (err) {
      setError(err.message || "Unable to load resumes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResumes();
  }, []);

  function openAddModal() {
    setFormData({ title: "", link: "", description: "" });
    setEditingId(null);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(resume) {
    setFormData({ title: resume.title || "", link: resume.link || "", description: resume.description || "" });
    setEditingId(resume._id);
    setFormError("");
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title || !formData.link) return;
    try {
      setSubmitting(true);
      setFormError("");
      if (editingId) {
        await updateResume(editingId, formData);
      } else {
        await addResume(formData);
      }
      setShowModal(false);
      setEditingId(null);
      fetchResumes();
    } catch (err) {
      setFormError(err.message || "Failed to save resume.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      setResumes((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      await deleteResume(deleteTarget._id);
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || "Failed to delete resume.");
      setDeleteTarget(null);
      fetchResumes();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="app-page">
      <PageHeader
        eyebrow="Documents"
        title="Resumes"
        description="Keep links to your resume versions organized in one place."
        action={
          <AppButton onClick={openAddModal}>
            <Plus size={16} /> Add resume
          </AppButton>
        }
      />

      {loading ? (
        <LoadingState rows={3} />
      ) : error ? (
        <ErrorState message="Unable to load resumes right now. Please try again shortly." onRetry={fetchResumes} />
      ) : resumes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description="Save links to each resume version you use for different roles."
          action={
            <AppButton onClick={openAddModal}>
              <Plus size={15} /> Add resume
            </AppButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resumes.map((resume) => (
            <ResumeCard
              key={resume._id}
              resume={resume}
              usageCount={usageCounts[resume._id] || 0}
              onEdit={() => openEditModal(resume)}
              onDelete={() => setDeleteTarget(resume)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit resume" : "Add resume"}
        size="max-w-md"
        footer={
          <>
            <AppButton variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </AppButton>
            <AppButton loading={submitting} onClick={handleSubmit}>
              {editingId ? "Update link" : "Add link"}
            </AppButton>
          </>
        }
      >
        {formError && <div className="app-form-error">{formError}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Title" required>
            <TextInput value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Frontend Developer Resume" required />
          </Field>
          <Field label="Link URL" required>
            <TextInput type="url" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} placeholder="https://drive.google.com/…" required />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. Use this for React roles" />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete resume?"
        description={`Remove ${deleteTarget?.title || "this resume"}? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}

export default Resumes;
