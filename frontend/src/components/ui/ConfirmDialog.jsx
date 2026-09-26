import Modal from "./Modal";
import AppButton from "./AppButton";

function ConfirmDialog({ isOpen, onClose, onConfirm, title = "Delete item?", description = "This action cannot be undone.", confirmLabel = "Delete", loading = false }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="max-w-md"
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </AppButton>
          <AppButton variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </AppButton>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.6, color: "var(--muted)" }}>{description}</p>
    </Modal>
  );
}

export default ConfirmDialog;
