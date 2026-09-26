import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Lightbulb,
  GraduationCap,
  BookOpen,
  NotebookPen,
  FileText,
  ScanSearch,
  LogOut,
  User as UserIcon,
  X,
  Crosshair,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { logout, user } = useAuth();

  const workspace = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Applications", path: "/applications", icon: Briefcase },
    { name: "Opportunities", path: "/opportunities", icon: Lightbulb },
    { name: "Skillboard", path: "/skillboard", icon: GraduationCap },
    { name: "Resources", path: "/resources", icon: BookOpen },
    { name: "Resumes", path: "/resumes", icon: FileText },
    { name: "AI Analyzer", path: "/ai-analyzer", icon: ScanSearch },
    { name: "Notes", path: "/notes", icon: NotebookPen },
  ];

  return (
    <aside
      className={`app-sidebar fixed left-0 top-0 z-50 flex h-screen w-[248px] flex-col transition-transform duration-200 ease-out ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <Link to="/dashboard" className="flex items-center gap-2" onClick={onClose} aria-label="TrackMyHunt dashboard">
          <span
            style={{
              display: "grid",
              placeItems: "center",
              height: 28,
              width: 28,
              borderRadius: 8,
              background: "var(--brand)",
              color: "#fff",
            }}
          >
            <Crosshair size={16} />
          </span>
          <span style={{ fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-strong)", fontSize: "0.95rem" }}>
            TrackMyHunt
          </span>
        </Link>
        <button onClick={onClose} aria-label="Close navigation" className="app-icon-button app-sidebar-close md:hidden">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        <div>
          <div className="app-nav-section-label">Workspace</div>
          <div className="space-y-1">
            {workspace.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`app-nav-link ${isActive ? "active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon size={17} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div className="app-nav-section-label">Account</div>
          <Link
            to="/profile"
            onClick={onClose}
            className={`app-nav-link ${location.pathname === "/profile" ? "active" : ""}`}
          >
            <UserIcon size={17} />
            <span>Profile</span>
          </Link>
        </div>
      </nav>

      <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
        {user && (
          <div className="mb-2 truncate px-2 text-xs" style={{ color: "var(--muted)" }}>
            {user.email}
          </div>
        )}
        <button type="button" className="app-nav-link w-full" onClick={logout} style={{ color: "var(--danger)" }}>
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
