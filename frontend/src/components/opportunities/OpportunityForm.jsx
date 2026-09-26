import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import AppButton from "../ui/AppButton";
import { Field, TextInput, Select, Textarea } from "../ui/FormField";

const TYPES = ["Intern", "Full-Time", "Remote", "Freelance", "Intern + Offer", "Other"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = [2024, 2025, 2026, 2027];

function emptyForm() {
  return {
    company: "",
    role: "",
    type: "Full-Time",
    openingMonth: "January",
    openingYear: new Date().getFullYear(),
    skills: "",
    link: "",
    notes: "",
  };
}

function OpportunityForm({ isOpen, onClose, onSubmit, initialData = null, loading }) {
  const [formData, setFormData] = useState(emptyForm());

  useEffect(() => {
    if (!isOpen) return;
    setFormData(initialData ? { ...emptyForm(), ...initialData } : emptyForm());
  }, [initialData, isOpen]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(formData);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit opportunity" : "Add opportunity"}
      size="max-w-2xl"
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </AppButton>
          <AppButton loading={loading} onClick={handleSubmit}>
            {initialData ? "Update opportunity" : "Save opportunity"}
          </AppButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Company" required>
          <TextInput name="company" required value={formData.company} onChange={handleChange} placeholder="e.g. Microsoft" />
        </Field>
        <Field label="Role" required>
          <TextInput name="role" required value={formData.role} onChange={handleChange} placeholder="e.g. SDE" />
        </Field>
        <Field label="Type">
          <Select name="type" value={formData.type} onChange={handleChange}>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Month">
            <Select name="openingMonth" value={formData.openingMonth} onChange={handleChange}>
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </Field>
          <Field label="Year">
            <Select name="openingYear" value={formData.openingYear} onChange={handleChange}>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Link">
            <TextInput type="url" name="link" value={formData.link} onChange={handleChange} placeholder="https://careers…" />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Skills required">
            <TextInput name="skills" value={formData.skills} onChange={handleChange} placeholder="Java, System Design…" />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Notes">
            <Textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} placeholder="Referral info, prep topics…" />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

export default OpportunityForm;
