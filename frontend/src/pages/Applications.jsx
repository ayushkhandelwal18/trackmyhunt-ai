import { useEffect, useMemo, useState } from "react";
import { Plus, LayoutGrid, KanbanSquare } from "lucide-react";
import { getApplications, createApplication, updateApplication, deleteApplication } from "../services/api";
import ApplicationCard from "../components/applications/ApplicationCard";
import ApplicationForm from "../components/applications/ApplicationForm";
import AppButton from "../components/ui/AppButton";
import PageHeader from "../components/ui/PageHeader";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import DuplicateDialog from "../components/applications/DuplicateDialog";
import KanbanBoard from "../components/applications/KanbanBoard";

const STATUS_FILTERS = ["All", "Applied", "Resume Shortlisted", "OA Done", "Interview Scheduled", "Interview Done", "Rejected", "Other"];
const KANBAN_COLUMNS = ["Applied", "Resume Shortlisted", "OA Done", "Interview Scheduled", "Interview Done", "Rejected", "Other"];

function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [duplicateFound, setDuplicateFound] = useState(null);
  const [moveError, setMoveError] = useState("");
  const [movingId, setMovingId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("recent");
  const [view, setView] = useState("list");

  async function fetchApps() {
    try {
      setLoading(true);
      setError("");
      const data = await getApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load applications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchApps();
  }, []);

  function handleAddClick() {
    setEditingApp(null);
    setFormError("");
    setIsModalOpen(true);
  }

  function handleEditClick(app) {
    setEditingApp(app);
    setFormError("");
    setIsModalOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await deleteApplication(deleteTarget._id);
      setApplications((prev) => prev.filter((app) => app._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || "Unable to delete application.");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleFormSubmit(formData) {
    try {
      setSubmitLoading(true);
      setFormError("");
      if (editingApp) {
        const updated = await updateApplication(editingApp._id, formData);
        setApplications((prev) => prev.map((app) => (app._id === updated._id ? updated : app)));
      } else {
        const created = await createApplication(formData);
        setApplications((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
      setEditingApp(null);
    } catch (err) {
      // 409 from the backend: the job is already tracked. Keep the form
      // open and show the existing application instead of an error.
      if (err.status === 409 && err.duplicate) {
        setDuplicateFound(err.duplicate);
      } else {
        setFormError(err.message || "Unable to save application.");
      }
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleKanbanMove(app, toStatus) {
    // Same-column drops never reach here (guarded by the board), but bail
    // out defensively so no API call is wasted.
    if (!app || app.status === toStatus || movingId) return;
    const previousStatus = app.status;
    setMoveError("");
    setMovingId(app._id);
    // Optimistic move so the UI responds immediately.
    setApplications((prev) => prev.map((item) => (item._id === app._id ? { ...item, status: toStatus } : item)));
    try {
      // Status-only patch: resume mapping and status details are left
      // untouched by the backend when their keys are absent.
      const updated = await updateApplication(app._id, { status: toStatus });
      setApplications((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
    } catch (err) {
      // Roll back so refresh-free state always matches the backend.
      setApplications((prev) => prev.map((item) => (item._id === app._id ? { ...item, status: previousStatus } : item)));
      setMoveError(err.message || "Could not move the application. It was kept in its previous column.");
    } finally {
      setMovingId(null);
    }
  }

  function handleViewDuplicate() {    const existing = duplicateFound;
    setDuplicateFound(null);
    if (!existing?._id) return;
    // Open the existing application in the form so the user sees its
    // current status and details. Merge with the local copy when present
    // so populated fields (resume, status details) are preserved.
    const local = applications.find((app) => app._id === existing._id);
    setEditingApp(local ? { ...existing, ...local } : existing);
    setFormError("");
    setIsModalOpen(true);
  }

  const filteredApps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let list = applications.filter((app) => {
      const matchesQuery =
        !query ||
        (app.company || "").toLowerCase().includes(query) ||
        (app.role || "").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || app.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "company") return (a.company || "").localeCompare(b.company || "");
      const aDate = new Date(a.appliedDate || a.updatedAt || 0).getTime();
      const bDate = new Date(b.appliedDate || b.updatedAt || 0).getTime();
      return sortBy === "oldest" ? aDate - bDate : bDate - aDate;
    });
    return list;
  }, [applications, searchQuery, statusFilter, sortBy]);

  return (
    <div className="app-page">
      <PageHeader
        eyebrow="Tracker"
        title="Applications"
        description="Roles you've already applied to. Opportunities are for roles you plan to pursue."
        action={
          <AppButton onClick={handleAddClick}>
            <Plus size={16} /> Add application
          </AppButton>
        }
      />

      <div className="app-toolbar">
        <div style={{ flex: "1 1 220px", maxWidth: 360 }}>
          <SearchInput placeholder="Search company or role…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="app-select-inline" aria-label="Filter by status">
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>{s === "All" ? "All statuses" : s}</option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="app-select-inline" aria-label="Sort applications">
          <option value="recent">Most recent</option>
          <option value="oldest">Oldest first</option>
          <option value="company">Company A–Z</option>
        </select>
        <div className="flex gap-1" role="tablist" aria-label="View mode">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`app-icon-button ${view === "list" ? "active" : ""}`}
            style={view === "list" ? { background: "var(--brand-soft)", color: "var(--brand)", borderColor: "var(--brand-border)" } : undefined}
            aria-label="List view"
            title="List view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setView("kanban")}
            className="app-icon-button"
            style={view === "kanban" ? { background: "var(--brand-soft)", color: "var(--brand)", borderColor: "var(--brand-border)" } : undefined}
            aria-label="Pipeline view"
            title="Pipeline view"
          >
            <KanbanSquare size={16} />
          </button>
        </div>
      </div>

      {formError && <ErrorState message={formError} />}

      {loading ? (
        <LoadingState rows={4} />
      ) : error ? (
        <ErrorState message="Unable to load applications right now. Please try again shortly." onRetry={fetchApps} />
      ) : filteredApps.length === 0 ? (
        <EmptyState
          title={searchQuery || statusFilter !== "All" ? "No applications match" : "No applications yet"}
          description="Start tracking the roles you're applying to."
          action={
            <AppButton onClick={handleAddClick}>
              <Plus size={15} /> Add application
            </AppButton>
          }
        />
      ) : view === "kanban" ? (
        <>
          {moveError && <ErrorState message={moveError} />}
          <KanbanBoard
            columns={KANBAN_COLUMNS.map((status) => ({
              status,
              items: filteredApps.filter((app) => app.status === status),
            }))}
            onMove={handleKanbanMove}
            onEdit={handleEditClick}
            onDelete={setDeleteTarget}
          />
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredApps.map((app) => (
            <ApplicationCard key={app._id} app={app} onEdit={handleEditClick} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      <ApplicationForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingApp}
        loading={submitLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete application?"
        description={`Remove ${deleteTarget?.company || "this application"} from your tracker? This cannot be undone.`}
        loading={deleteLoading}
      />

      <DuplicateDialog
        isOpen={!!duplicateFound}
        onClose={() => setDuplicateFound(null)}
        duplicate={duplicateFound}
        onView={handleViewDuplicate}
      />
    </div>
  );
}

export default Applications;
