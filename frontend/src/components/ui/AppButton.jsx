import { Loader2 } from "lucide-react";

function AppButton({ children, variant = "primary", loading = false, className = "", ...props }) {
  const valid = ["primary", "secondary", "ghost", "danger"].includes(variant) ? variant : "primary";
  return (
    <button className={`app-button app-button-${valid} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export default AppButton;