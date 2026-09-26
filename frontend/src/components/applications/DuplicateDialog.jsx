import { ExternalLink } from "lucide-react";
import Modal from "../ui/Modal";
import AppButton from "../ui/AppButton";
import StatusBadge from "../ui/StatusBadge";
import { formatLongDate } from "../../utils/datetime";

/**
 * Shown when the backend rejects a create with 409: the job is already
 * tracked. Nothing was created, modified, or deleted. Offers a way to view
 * the existing application or go back to the form.
 */
function DuplicateDialog({ isOpen, onClose, duplicate, onView }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Already tracked"
      size="max-w-md"
      zIndex={70}
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose}>
            Back to form
          </AppButton>
          <AppButton onClick={onView}>
            View application
          </AppButton>
        </>
      }
    >
      {!duplicate ? (
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.6 }}>
          This job is already in your applications.
        </p>
      ) : (
        <div className="space-y-3">
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.6 }}>
            {duplicate.role} at {duplicate.company} is already in your applications. No new
            entry was created.
          </p>
          <div
            className="rounded-lg border p-4"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            <div className="flex items-start justify-between gap-2">
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-strong)" }} className="truncate">
                  {duplicate.company}
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--muted)" }} className="truncate">
                  {duplicate.role}
                </div>
              </div>
              <StatusBadge status={duplicate.status} />
            </div>
            <div style={{ marginTop: "0.6rem", fontSize: "0.78rem", color: "var(--muted)" }}>
              Applied {duplicate.appliedDate ? formatLongDate(duplicate.appliedDate) : "—"}
            </div>
            {duplicate.applicationLink && (
              <a
                href={duplicate.applicationLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: "0.5rem", fontSize: "0.8rem", fontWeight: 600, color: "var(--brand)" }}
              >
                <ExternalLink size={13} /> Open job link
              </a>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default DuplicateDialog;
