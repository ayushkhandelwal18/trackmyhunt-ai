import { createElement } from "react";
import { Inbox } from "lucide-react";

function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="app-empty-state">
      <div className="app-empty-icon">{createElement(Icon, { size: 22 })}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export default EmptyState;