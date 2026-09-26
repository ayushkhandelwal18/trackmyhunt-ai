import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import AppButton from "../ui/AppButton";
import { Field, TextInput, Textarea } from "../ui/FormField";

function emptyForm() {
  return { title: "", tags: "", content: "" };
}

function NoteForm({ isOpen, onClose, onSubmit, initialData = null, loading }) {
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
      title={initialData ? "Edit note" : "Add note"}
      size="max-w-2xl"
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </AppButton>
          <AppButton loading={loading} onClick={handleSubmit}>
            {initialData ? "Update note" : "Save note"}
          </AppButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Title" required>
          <TextInput name="title" required value={formData.title} onChange={handleChange} placeholder="e.g. Interview takeaways" />
        </Field>
        <Field label="Tags" hint="Comma separated">
          <TextInput name="tags" value={formData.tags} onChange={handleChange} placeholder="e.g. DSA, React" />
        </Field>
        <Field label="Content" required>
          <Textarea name="content" required rows={8} value={formData.content} onChange={handleChange} placeholder="Write your thoughts…" />
        </Field>
      </form>
    </Modal>
  );
}

export default NoteForm;
