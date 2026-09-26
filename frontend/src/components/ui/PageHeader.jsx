function PageHeader({ title, description, action, eyebrow }) {
  return (
    <header className="app-page-header">
      <div>
        {eyebrow && <p className="app-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="app-page-header-action">{action}</div>}
    </header>
  );
}

export default PageHeader;