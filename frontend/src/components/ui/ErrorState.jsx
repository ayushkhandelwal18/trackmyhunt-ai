import { AlertCircle } from "lucide-react";

function ErrorState({ message = "Something went wrong. Please try again.", onRetry }) {
  return (
    <div className="app-error-state" role="alert">
      <AlertCircle size={18} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="app-button app-button-secondary" style={{ minHeight: 32 }}>
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorState;
