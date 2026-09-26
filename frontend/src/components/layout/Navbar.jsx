import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Github, Crosshair } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { landingNavigation, TRACKMYHUNT_EXTENSION_GITHUB_URL } from "../../config/landingConfig";
import ThemeToggle from "../ui/ThemeToggle";

function Navbar({ openAuth }) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") closeMenu();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <nav className="landing-nav">
      <div className="landing-container flex min-h-[56px] items-center justify-between gap-3 md:min-h-[64px]">
        <Link to="/" className="flex items-center gap-2" onClick={closeMenu} aria-label="TrackMyHunt home">
          <span style={{ display: "grid", placeItems: "center", height: 28, width: 28, borderRadius: 8, background: "var(--brand)", color: "#fff" }}>
            <Crosshair size={15} />
          </span>
          <span style={{ fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-strong)" }}>TrackMyHunt</span>
        </Link>

        <div className="hidden items-center gap-6 text-sm md:flex">
          {landingNavigation.map((item) => (
            <a key={item.href} href={item.href} style={{ color: "var(--muted)", fontWeight: 500 }}>
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href={TRACKMYHUNT_EXTENSION_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="app-icon-button"
            title="Chrome Extension on GitHub"
            aria-label="Chrome Extension on GitHub"
          >
            <Github size={17} />
          </a>
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="app-button app-button-secondary">
                Open dashboard
              </Link>
              <button type="button" onClick={logout} className="app-button app-button-ghost">
                Logout
              </button>
            </div>
          ) : (
            <button type="button" onClick={openAuth} className="app-button app-button-primary">
              Login / Signup
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button type="button" onClick={() => setIsOpen(!isOpen)} aria-label={isOpen ? "Close menu" : "Open menu"} aria-expanded={isOpen} className="app-icon-button">
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t px-5 py-4 md:hidden" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="grid gap-1">
            {landingNavigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="app-nav-link"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="mt-3 grid gap-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
            <a href={TRACKMYHUNT_EXTENSION_GITHUB_URL} target="_blank" rel="noopener noreferrer" className="app-button app-button-secondary w-full">
              <Github size={15} /> Extension on GitHub
            </a>
            {user ? (
              <>
                <Link to="/dashboard" onClick={closeMenu} className="app-button app-button-primary w-full">
                  Open dashboard
                </Link>
                <button type="button" onClick={() => { logout(); closeMenu(); }} className="app-button app-button-ghost w-full">
                  Logout
                </button>
              </>
            ) : (
              <button type="button" onClick={() => { openAuth(); closeMenu(); }} className="app-button app-button-primary w-full">
                Login / Signup
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
