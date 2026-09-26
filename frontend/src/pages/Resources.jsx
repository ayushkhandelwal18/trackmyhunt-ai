import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { getResources, createResource, updateResource, deleteResource } from "../services/api";
import ResourceCard from "../components/resources/ResourceCard";
import ResourceForm from "../components/resources/ResourceForm";
import AppButton from "../components/ui/AppButton";
import PageHeader from "../components/ui/PageHeader";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import ConfirmDialog from "../components/ui/ConfirmDialog";

function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  async function fetchResources() {
    try {
      setLoading(true);
      setError("");
      const data = await getResources();
      setResources(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load resources.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResources();
  }, []);

  async function handleFormSubmit(formData) {
    try {
      setSubmitLoading(true);
      setFormError("");
      if (editingResource) {
        const updated = await updateResource(editingResource._id, formData);
        setResources((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      } else {
        const created = await createResource(formData);
        setResources((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
      setEditingResource(null);
    } catch (err) {
      setFormError(err.message || "Unable to save resource.");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await deleteResource(deleteTarget._id);
      setResources((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || "Unable to delete resource.");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return resources.filter((r) => {
      if (!query) return true;
      return (
        (r.title || "").toLowerCase().includes(query) ||
        (r.description || "").toLowerCase().includes(query) ||
        (r.type || "").toLowerCase().includes(query)
      );
    });
  }, [resources, searchQuery]);

  return (
    <div className="app-page">
      <PageHeader
        eyebrow="Library"
        title="Resources"
        description="Save any useful link — repos, docs, videos, sheets, posts, and more."
        action={
          <AppButton onClick={() => { setEditingResource(null); setFormError(""); setIsModalOpen(true); }}>
            <Plus size={16} /> Add resource
          </AppButton>
        }
      />

      <div className="app-toolbar">
        <div style={{ flex: "1 1 220px", maxWidth: 360 }}>
          <SearchInput placeholder="Search title, type, or description…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {formError && <ErrorState message={formError} />}

      {loading ? (
        <LoadingState rows={4} />
      ) : error ? (
        <ErrorState message="Unable to load resources right now. Please try again shortly." onRetry={fetchResources} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No resources found"
          description="Keep the articles, guides, and references that help your search moving."
          action={
            <AppButton onClick={() => { setEditingResource(null); setIsModalOpen(true); }}>
              <Plus size={15} /> Add resource
            </AppButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((res) => (
            <ResourceCard
              key={res._id}
              resource={res}
              onEdit={(r) => { setEditingResource(r); setFormError(""); setIsModalOpen(true); }}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <ResourceForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingResource}
        loading={submitLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete resource?"
        description={`Remove ${deleteTarget?.title || "this resource"}? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}

export default Resources;
