import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { getNotes, createNote, updateNote, deleteNote } from "../services/api";
import NoteCard from "../components/notes/NoteCard";
import NoteForm from "../components/notes/NoteForm";
import AppButton from "../components/ui/AppButton";
import PageHeader from "../components/ui/PageHeader";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import ConfirmDialog from "../components/ui/ConfirmDialog";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  async function fetchNotes() {
    try {
      setLoading(true);
      setError("");
      const data = await getNotes();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load notes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  async function handleFormSubmit(formData) {
    try {
      setSubmitLoading(true);
      setFormError("");
      if (editingNote) {
        const updated = await updateNote(editingNote._id, formData);
        setNotes((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));
      } else {
        const created = await createNote(formData);
        setNotes((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
      setEditingNote(null);
    } catch (err) {
      setFormError(err.message || "Unable to save note.");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await deleteNote(deleteTarget._id);
      setNotes((prev) => prev.filter((n) => n._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || "Unable to delete note.");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return notes;
    return notes.filter(
      (n) =>
        (n.title || "").toLowerCase().includes(query) ||
        (n.content || "").toLowerCase().includes(query) ||
        (n.tags || "").toLowerCase().includes(query)
    );
  }, [notes, searchQuery]);

  return (
    <div className="app-page">
      <PageHeader
        eyebrow="Capture"
        title="Notes"
        description="Interview takeaways, ideas, and reminders in one lightweight place."
        action={
          <AppButton onClick={() => { setEditingNote(null); setFormError(""); setIsModalOpen(true); }}>
            <Plus size={16} /> Add note
          </AppButton>
        }
      />

      <div className="app-toolbar">
        <div style={{ flex: "1 1 220px", maxWidth: 360 }}>
          <SearchInput placeholder="Search notes…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {formError && <ErrorState message={formError} />}

      {loading ? (
        <LoadingState rows={4} />
      ) : error ? (
        <ErrorState message="Unable to load notes right now. Please try again shortly." onRetry={fetchNotes} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No notes match" : "No notes yet"}
          description="Capture interview takeaways, ideas, and reminders in one place."
          action={
            <AppButton onClick={() => { setEditingNote(null); setIsModalOpen(true); }}>
              <Plus size={15} /> Add note
            </AppButton>
          }
        />
      ) : (
        <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
          {filtered.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              onEdit={(n) => { setEditingNote(n); setFormError(""); setIsModalOpen(true); }}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <NoteForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingNote}
        loading={submitLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete note?"
        description={`Remove ${deleteTarget?.title || "this note"}? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}

export default Notes;
