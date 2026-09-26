import { createElement } from "react";

function AppCard({ children, className = "", as: Tag = "section", style, ...rest }) {
  return createElement(Tag, { className: `app-card ${className}`, style, ...rest }, children);
}

export default AppCard;
