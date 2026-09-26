import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import AppButton from "../ui/AppButton";
import { Field, TextInput, Select, Textarea } from "../ui/FormField";
import ResumePicker from "./ResumePicker";
import QuickAddResumeModal from "./QuickAddResumeModal";
import StatusDetailsFields from "./StatusDetailsFields";
import { getResumes } from "../../services/api";
import { toDateInputValue } from "../../utils/datetime";

const TYPES = ["Intern", "Full-Time", "Remote", "Freelance", "Intern + Offer", "Other"];
const STATUSES = ["Applied", "Resume Shortlisted", "OA Done", "Interview Scheduled", "Interview Done", "Rejected", "Other"];

function emptyForm() {
  return {
    company: "",
    role: "",
    type: "Full-Time",
    status: "Applied",
    applicationLink: "",
    skills: "",
    notes: "",
    appliedDate: new Date().toISOString().split("T")[0],
    resumeId: "",
    statusDetails: { interview: {}, oa: {}, rejection: {} },
  };
}

function toStatusDetails(value) {
  const base = { interview: {}, oa: {}, rejection: {} };
  if (!value || typeof value !== "object") return base;
  const pick = (group, keys) => {
    const source = value[group] || {};
    const out = {};
    keys.forEach((key) => {
      if (key === "date") {
        out.date = toDateInputValue(source.date);
      } else if (source[key] != null) {
        out[key] = String(source[key]);
      } else {
        out[key] = "";
      }
    });
    return out;
  };
  return {
    interview: pick("interview", ["date", "time", "type", "link", "notes"]),
    oa: pick("oa", ["date", "link", "notes"]),
    rejection: pick("rejection", ["date", "reason"]),
  };
}

function toResumeId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value._id || "";
  return "";
}

function ApplicationForm({ isOpen, onClose, onSubmit, initialData = null, loading }) {
  const [formData, setFormData] = useState(emptyForm());
  const [resumes, setResumes] = useState([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setFormData({
        ...emptyForm(),
        ...initialData,
        resumeId: toResumeId(initialData.resumeId),
        statusDetails: toStatusDetails(initialData.statusDetails),
        appliedDate: initialData.appliedDate ? initialData.appliedDate.split("T")[0] : new Date().toISOString().split("T")[0],
      });
    } else {
      setFormData(emptyForm());
    }
    setShowQuickAdd(false);

    let active = true;
    async function loadResumes() {
      try {
        setResumesLoading(true);
        const data = await getResumes();
        const list = Array.isArray(data?.resumes) ? data.resumes : Array.isArray(data) ? data : [];
        if (active) setResumes(list);
      } catch {
        if (active) setResumes([]);
      } finally {
        if (active) setResumesLoading(false);
      }
    }
    loadResumes();
    return () => {
      active = false;
    };
  }, [initialData, isOpen]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ ...formData, resumeId: formData.resumeId || null });
  }

  function handleQuickAddSaved(resume) {
    setResumes((prev) => (prev.some((r) => r._id === resume._id) ? prev : [resume, ...prev]));
    setFormData((prev) => ({ ...prev, resumeId: resume._id }));
  }

  const resumeStale = Boolean(formData.resumeId) && !resumesLoading && !resumes.some((r) => r._id === formData.resumeId);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={initialData ? "Edit application" : "Add application"}
        size="max-w-2xl"
        footer={
          <>
            <AppButton variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </AppButton>
            <AppButton loading={loading} onClick={handleSubmit}>
              {initialData ? "Update application" : "Save application"}
            </AppButton>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Company" required>
            <TextInput name="company" required value={formData.company} onChange={handleChange} placeholder="e.g. Google" />
          </Field>
          <Field label="Role" required>
            <TextInput name="role" required value={formData.role} onChange={handleChange} placeholder="e.g. Frontend Engineer" />
          </Field>
          <Field label="Type">
            <Select name="type" value={formData.type} onChange={handleChange}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" value={formData.status} onChange={handleChange}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <StatusDetailsFields
            status={formData.status}
            details={formData.statusDetails || {}}
            onChange={(statusDetails) => setFormData((prev) => ({ ...prev, statusDetails }))}
          />
          <Field label="Applied date">
            <TextInput type="date" name="appliedDate" required value={formData.appliedDate} onChange={handleChange} />
          </Field>
          <Field label="Application link">
            <TextInput type="url" name="applicationLink" value={formData.applicationLink} onChange={handleChange} placeholder="https://…" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Resume used" hint="Optional — pick a saved resume or add one without leaving this form.">
              <ResumePicker
                resumes={resumes}
                loading={resumesLoading}
                value={formData.resumeId}
                stale={resumeStale}
                onChange={(value) => setFormData((prev) => ({ ...prev, resumeId: value }))}
                onAddClick={() => setShowQuickAdd(true)}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Skills" hint="Comma separated">
              <TextInput name="skills" value={formData.skills} onChange={handleChange} placeholder="React, Node.js…" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Notes">
              <Textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} placeholder="Any additional details…" />
            </Field>
          </div>
        </form>
      </Modal>

      <QuickAddResumeModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        existingResumes={resumes}
        onSaved={handleQuickAddSaved}
      />
    </>
  );
}

export default ApplicationForm;
