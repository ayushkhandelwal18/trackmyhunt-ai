import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import AppButton from "../ui/AppButton";
import { Field, TextInput, Select, Textarea } from "../ui/FormField";

const CATEGORIES = ["Frontend", "Backend", "Tools", "Soft Skills", "Other"];
const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

function emptyForm() {
  return { name: "", category: "Frontend", proficiency: "Beginner", target: "" };
}

function SkillForm({ isOpen, onClose, onSubmit, initialData = null, loading }) {
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
      title={initialData ? "Edit skill" : "Add skill"}
      size="max-w-lg"
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </AppButton>
          <AppButton loading={loading} onClick={handleSubmit}>
            {initialData ? "Update skill" : "Save skill"}
          </AppButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Skill name" required>
          <TextInput name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. React" />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Category">
            <Select name="category" value={formData.category} onChange={handleChange}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Proficiency">
            <Select name="proficiency" value={formData.proficiency} onChange={handleChange}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Target / improvement plan">
          <Textarea name="target" rows={3} value={formData.target} onChange={handleChange} placeholder="e.g. Build 2 projects…" />
        </Field>
      </form>
    </Modal>
  );
}

export default SkillForm;
