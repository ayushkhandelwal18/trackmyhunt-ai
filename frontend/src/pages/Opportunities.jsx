import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { getOpportunities, createOpportunity, updateOpportunity, deleteOpportunity } from "../services/api";
import OpportunityCard from "../components/opportunities/OpportunityCard";
import OpportunityForm from "../components/opportunities/OpportunityForm";
import AppButton from "../components/ui/AppButton";
import PageHeader from "../components/ui/PageHeader";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import ConfirmDialog from "../components/ui/ConfirmDialog";

function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  async function fetchOpportunities() {
    try {
      setLoading(true);
      setError("");
      const data = await getOpportunities();
      setOpportunities(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load opportunities.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOpportunities();
  }, []);

  async function handleFormSubmit(formData) {
    try {
      setSubmitLoading(true);
      setFormError("");
      if (editingOpp) {
        const updated = await updateOpportunity(editingOpp._id, formData);
        setOpportunities((prev) => prev.map((op) => (op._id === updated._id ? updated : op)));
      } else {
        const created = await createOpportunity(formData);
        setOpportunities((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
      setEditingOpp(null);
    } catch (err) {
      setFormError(err.message || "Unable to save opportunity.");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await deleteOpportunity(deleteTarget._id);
      setOpportunities((prev) => prev.filter((op) => op._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || "Unable to delete opportunity.");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  const filteredOpps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return opportunities.filter((op) => {
      const matchesQuery =
        !query ||
        (op.company || "").toLowerCase().includes(query) ||
        (op.role || "").toLowerCase().includes(query);
      const matchesType = typeFilter === "All" || op.type === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [opportunities, searchQuery, typeFilter]);

  return (
    <div className="app-page">
      <PageHeader
        eyebrow="Planner"
        title="Opportunities"
        description="Roles you plan to pursue. Move them to Applications once you've applied."
        action={
          <AppButton onClick={() => { setEditingOpp(null); setFormError(""); setIsModalOpen(true); }}>
            <Plus size={16} /> Add opportunity
          </AppButton>
        }
      />

      <div className="app-toolbar">
        <div style={{ flex: "1 1 220px", maxWidth: 360 }}>
          <SearchInput placeholder="Search company or role…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="app-select-inline" aria-label="Filter by type">
          {["All", "Intern", "Full-Time", "Remote", "Freelance", "Intern + Offer", "Other"].map((t) => (
            <option key={t} value={t}>{t === "All" ? "All types" : t}</option>
          ))}
        </select>
      </div>

      {formError && <ErrorState message={formError} />}

      {loading ? (
        <LoadingState rows={4} />
      ) : error ? (
        <ErrorState message="Unable to load opportunities right now. Please try again shortly." onRetry={fetchOpportunities} />
      ) : filteredOpps.length === 0 ? (
        <EmptyState
          title={searchQuery || typeFilter !== "All" ? "No opportunities match" : "No opportunities yet"}
          description="Save roles you want to apply to, with deadlines and links."
          action={
            <AppButton onClick={() => { setEditingOpp(null); setIsModalOpen(true); }}>
              <Plus size={15} /> Add opportunity
            </AppButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOpps.map((op) => (
            <OpportunityCard
              key={op._id}
              item={op}
              onEdit={(item) => { setEditingOpp(item); setFormError(""); setIsModalOpen(true); }}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <OpportunityForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingOpp}
        loading={submitLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete opportunity?"
        description={`Remove ${deleteTarget?.company || "this opportunity"}? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}

export default Opportunities;
