import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, FileText } from "lucide-react";
import StatusBadge from "../ui/StatusBadge";
import { formatShortDate, formatTime } from "../../utils/datetime";

/**
 * Kanban board for applications. Presentational: columns and cards render
 * from props, drag events report back through onMove(app, toStatus).
 * Status persistence, optimistic updates, and rollback live in the page.
 */
function KanbanBoard({ columns, onMove, onEdit, onDelete }) {
  const [draggedId, setDraggedId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  function handleDragStart(e, app) {
    e.dataTransfer.setData("text/plain", app._id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(app._id);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setOverColumn(null);
  }

  function handleColumnDragOver(e, status) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overColumn !== status) setOverColumn(status);
  }

  function handleColumnDrop(e, status) {
    e.preventDefault();
    const appId = e.dataTransfer.getData("text/plain") || draggedId;
    setOverColumn(null);
    setDraggedId(null);
    if (!appId) return;
    for (const column of columns) {
      const app = column.items.find((item) => item._id === appId);
      if (app) {
        // Same-column drops never trigger an update.
        if (app.status !== status) onMove(app, status);
        return;
      }
    }
  }

  return (
    <div className="grid grid-flow-col auto-cols-[minmax(240px,280px)] gap-3 overflow-x-auto pb-2" style={{ maxWidth: "100%" }}>
      {columns.map((column) => {
        const isOver = overColumn === column.status;
        return (
          <div
            key={column.status}
            className="app-card app-card-subtle p-3"
            onDragOver={(e) => handleColumnDragOver(e, column.status)}
            onDragLeave={() => setOverColumn((prev) => (prev === column.status ? null : prev))}
            onDrop={(e) => handleColumnDrop(e, column.status)}
            style={isOver ? { borderColor: "var(--brand-border)", background: "var(--brand-soft)" } : undefined}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <StatusBadge status={column.status} />
              <span style={{ fontSize: "0.72rem", color: "var(--faint)", fontWeight: 700 }}>{column.items.length}</span>
            </div>
            <div className="space-y-2">
              {column.items.map((app) => {
                const interview = app.statusDetails?.interview || {};
                const resumeTitle = app.resumeId && typeof app.resumeId === "object" ? app.resumeId.title : "";
                const isDragging = draggedId === app._id;
                return (
                  <div
                    key={app._id}
                    className="app-card cursor-grab p-3 active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => handleDragStart(e, app)}
                    onDragEnd={handleDragEnd}
                    title={`Drag to move ${app.company}`}
                    style={isDragging ? { opacity: 0.45 } : undefined}
                  >
                    <Link to={`/applications/${app._id}`} state={{ app }} style={{ textDecoration: "none" }} aria-label={`View ${app.company} application details`}>
                      <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text-strong)" }} className="truncate">
                        {app.company}
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "var(--muted)" }} className="truncate">
                        {app.role}
                      </div>
                    </Link>
                    <div className="mt-1.5 space-y-1" style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                      {app.appliedDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={11} style={{ flexShrink: 0 }} />
                          <span>Applied {formatShortDate(app.appliedDate)}</span>
                        </div>
                      )}
                      {resumeTitle && (
                        <div className="flex items-center gap-1.5">
                          <FileText size={11} style={{ flexShrink: 0 }} />
                          <span className="truncate">{resumeTitle}</span>
                        </div>
                      )}
                      {app.status === "Interview Scheduled" && (interview.date || interview.time) && (
                        <div className="flex items-center gap-1.5" style={{ fontWeight: 600, color: "var(--brand)" }}>
                          <Clock size={11} style={{ flexShrink: 0 }} />
                          <span>
                            {[formatShortDate(interview.date), formatTime(interview.time)].filter(Boolean).join(" · ")}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <button type="button" className="app-button app-button-secondary" style={{ minHeight: 30, padding: "0.3rem 0.6rem", fontSize: "0.72rem" }} onClick={() => onEdit(app)}>
                        Edit
                      </button>
                      <button type="button" className="app-button app-button-ghost" style={{ minHeight: 30, padding: "0.3rem 0.6rem", fontSize: "0.72rem", color: "var(--danger)" }} onClick={() => onDelete(app)}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
              {column.items.length === 0 && (
                <p style={{ margin: 0, padding: "0.4rem 0", fontSize: "0.75rem", color: "var(--faint)" }}>No applications</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default KanbanBoard;
