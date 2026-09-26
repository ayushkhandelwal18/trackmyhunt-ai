import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "../../context/AuthContext";
import LoadingState from "../ui/LoadingState";

function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer on route change (covers programmatic navigation).
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Close the mobile drawer with Escape.
  useEffect(() => {
    if (!isSidebarOpen) return;
    function handleKey(event) {
      if (event.key === "Escape") setIsSidebarOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isSidebarOpen]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!isSidebarOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isSidebarOpen]);

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center p-6">
        <div style={{ width: "min(100%, 480px)" }}>
          <LoadingState rows={3} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="app-shell relative flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col md:ml-[248px]">
        <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="app-main">
          <div className="app-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default ProtectedLayout;
