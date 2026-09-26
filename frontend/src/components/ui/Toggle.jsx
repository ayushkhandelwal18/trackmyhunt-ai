function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        flexShrink: 0,
        width: 40,
        height: 22,
        borderRadius: 999,
        border: "1px solid var(--border-strong)",
        background: checked ? "var(--brand)" : "var(--surface-2)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        padding: 0,
        transition: "background-color 0.15s ease",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 20 : 2,
          height: 16,
          width: 16,
          borderRadius: 999,
          background: "#fff",
          transition: "left 0.15s ease",
          boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
        }}
      />
    </button>
  );
}

export default Toggle;
