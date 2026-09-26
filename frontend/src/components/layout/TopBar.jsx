import { Menu, Search, Github } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../ui/ThemeToggle";
import { TRACKMYHUNT_EXTENSION_GITHUB_URL } from "../../config/landingConfig";

function TopBar({ onMenuClick, search, onSearchChange, searchPlaceholder = "Search..." }) {
  const { user } = useAuth();
  const initial = (user?.name || "U").charAt(0).toUpperCase();

  return (
    <div className="app-topbar">
      <div className="mx-auto flex min-h-[60px] w-full max-w-[1200px] items-center gap-2 px-4 sm:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="app-icon-button app-nav-toggle md:hidden"
          aria-label="Open navigation"
          title="Open navigation"
        >
          <Menu size={20} />
        </button>

        {search !== undefined ? (
          <label className="app-search" style={{ flex: 1, maxWidth: 420 }}>
            <Search size={16} />
            <span className="sr-only">{searchPlaceholder}</span>
            <input value={search} onChange={onSearchChange} placeholder={searchPlaceholder} />
          </label>
        ) : (
          <div style={{ flex: 1, minWidth: 0 }} />
        )}

        <div className="flex items-center gap-1.5" role="toolbar" aria-label="Account controls">
          <a
            href={TRACKMYHUNT_EXTENSION_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="app-icon-button"
            aria-label="Get Chrome Extension"
            title="Get Chrome Extension"
          >
            <Github size={17} />
          </a>
          <ThemeToggle />
          <Link
            to="/profile"
            className="app-icon-button"
            aria-label="Open profile settings"
            title={user?.name ? `Profile — ${user.name}` : "Open profile settings"}
            style={{
              borderRadius: 999,
              background: "var(--brand-soft)",
              border: "1px solid var(--brand-border)",
              color: "var(--brand)",
              fontSize: "0.78rem",
              fontWeight: 700,
            }}
          >
            {initial}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TopBar;
