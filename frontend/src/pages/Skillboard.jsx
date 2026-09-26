import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { getSkills, createSkill, updateSkill, deleteSkill } from "../services/api";
import SkillCard from "../components/skills/SkillCard";
import SkillForm from "../components/skills/SkillForm";
import AppButton from "../components/ui/AppButton";
import PageHeader from "../components/ui/PageHeader";
import SearchInput from "../components/ui/SearchInput";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const CATEGORIES = ["All", "Frontend", "Backend", "Tools", "Soft Skills", "Other"];

function Skillboard() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");

  async function fetchSkills() {
    try {
      setLoading(true);
      setError("");
      const data = await getSkills();
      setSkills(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load skills.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSkills();
  }, []);

  async function handleFormSubmit(formData) {
    try {
      setSubmitLoading(true);
      setFormError("");
      if (editingSkill) {
        const updated = await updateSkill(editingSkill._id, formData);
        setSkills((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
      } else {
        const created = await createSkill(formData);
        setSkills((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
      setEditingSkill(null);
    } catch (err) {
      setFormError(err.message || "Unable to save skill.");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await deleteSkill(deleteTarget._id);
      setSkills((prev) => prev.filter((s) => s._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || "Unable to delete skill.");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return skills.filter((s) => {
      const matchesQuery = !query || (s.name || "").toLowerCase().includes(query);
      const matchesCat = category === "All" || s.category === category;
      return matchesQuery && matchesCat;
    });
  }, [skills, searchQuery, category]);

  const grouped = useMemo(() => {
    const cats = category === "All" ? ["Frontend", "Backend", "Tools", "Soft Skills", "Other"] : [category];
    return cats
      .map((cat) => ({ cat, items: filtered.filter((s) => s.category === cat) }))
      .filter((group) => group.items.length > 0);
  }, [filtered, category]);

  return (
    <div className="app-page">
      <PageHeader
        eyebrow="Growth"
        title="Skillboard"
        description="Track what you're learning and where you want to improve."
        action={
          <AppButton onClick={() => { setEditingSkill(null); setFormError(""); setIsModalOpen(true); }}>
            <Plus size={16} /> Add skill
          </AppButton>
        }
      />

      <div className="app-toolbar">
        <div style={{ flex: "1 1 220px", maxWidth: 360 }}>
          <SearchInput placeholder="Search skills…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="app-select-inline" aria-label="Filter by category">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === "All" ? "All categories" : c}</option>
          ))}
        </select>
      </div>

      {formError && <ErrorState message={formError} />}

      {loading ? (
        <LoadingState rows={4} />
      ) : error ? (
        <ErrorState message="Unable to load skills right now. Please try again shortly." onRetry={fetchSkills} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No skills found"
          description="Build a focused list of skills you want to practice and improve."
          action={
            <AppButton onClick={() => { setEditingSkill(null); setIsModalOpen(true); }}>
              <Plus size={15} /> Add skill
            </AppButton>
          }
        />
      ) : (
        <div className="space-y-7">
          {grouped.map((group) => (
            <section key={group.cat}>
              <h2 style={{ margin: "0 0 0.8rem", fontSize: "0.72rem", fontWeight: 750, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--faint)" }}>
                {group.cat} · {group.items.length}
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((skill) => (
                  <SkillCard
                    key={skill._id}
                    skill={skill}
                    onEdit={(s) => { setEditingSkill(s); setFormError(""); setIsModalOpen(true); }}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <SkillForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingSkill}
        loading={submitLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete skill?"
        description={`Remove ${deleteTarget?.name || "this skill"} from your skillboard?`}
        loading={deleteLoading}
      />
    </div>
  );
}

export default Skillboard;
