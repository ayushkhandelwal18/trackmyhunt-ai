export function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="app-form-label">
        {label} {required && <span style={{ color: "var(--danger)" }}>*</span>}
      </label>
      {children}
      {hint && <p className="app-form-hint">{hint}</p>}
    </div>
  );
}

export function TextInput(props) {
  return <input {...props} className={`app-form-input ${props.className || ""}`} />;
}

export function Select(props) {
  return <select {...props} className={`app-form-select ${props.className || ""}`} />;
}

export function Textarea(props) {
  return <textarea {...props} className={`app-form-textarea ${props.className || ""}`} />;
}
