import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="app-shell flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <p className="app-eyebrow">404</p>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-strong)" }}>
        Page not found
      </h1>
      <p style={{ margin: "0 0 1.5rem", maxWidth: 420, fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.6 }}>
        The page you're looking for might have been removed, renamed, or is temporarily unavailable.
      </p>
      <Link to="/" className="app-button app-button-primary">
        Go to home
      </Link>
    </div>
  );
}

export default NotFound;
