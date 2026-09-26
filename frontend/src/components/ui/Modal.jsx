import { useEffect } from "react";
import { X } from "lucide-react";

function Modal({ isOpen, onClose, title, children, footer, size = "max-w-xl", zIndex }) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(event) {
      if (event.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="app-modal-backdrop"
      style={zIndex ? { zIndex } : undefined}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={`app-modal ${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="app-modal-header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} className="app-icon-button" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <div className="app-modal-body">{children}</div>
        {footer && <div className="app-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
