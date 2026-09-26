import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import AppButton from "../ui/AppButton";
import { Field, TextInput, Select, Textarea } from "../ui/FormField";

const TYPES = ["GitHub", "YouTube", "Blog", "Article", "Course", "Website", "Documentation", "LinkedIn", "Google Drive", "Google Sheets", "PDF", "Other"];

function emptyForm() {
  return { title: "", type: "", link: "", description: "" };
}

function ResourceForm({ isOpen, onClose, onSubmit, initialData = null, loading }) {
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
      title={initialData ? "Edit resource" : "Add resource"}
      size="max-w-xl"
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </AppButton>
          <AppButton loading={loading} onClick={handleSubmit}>
            {initialData ? "Update resource" : "Save resource"}
          </AppButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Title" required>
          <TextInput name="title" required value={formData.title} onChange={handleChange} placeholder="e.g. Striver A2Z DSA Sheet" />
        </Field>
        <Field label="Type" required>
          <Select name="type" required value={formData.type} onChange={handleChange}>
            <option value="">Select type</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field label="Link" required>
          <TextInput type="url" name="link" required value={formData.link} onChange={handleChange} placeholder="https://…" />
        </Field>
        <Field label="Description">
          <Textarea name="description" rows={3} value={formData.description} onChange={handleChange} placeholder="Why is this useful?" />
        </Field>
      </form>
    </Modal>
  );
}

export default ResourceForm;
