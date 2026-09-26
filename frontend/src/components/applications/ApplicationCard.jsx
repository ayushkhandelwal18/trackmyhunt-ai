import { ExternalLink, Calendar, Clock, Pencil, Trash2, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import StatusBadge from "../ui/StatusBadge";
import { formatShortDate, formatTime } from "../../utils/datetime";

function ApplicationCard({ app, onEdit, onDelete }) {
  const resumeRef = app.resumeId;
  const mappedResume = resumeRef && typeof resumeRef === "object" && resumeRef.title ? resumeRef : null;
  const resumeMissing = Boolean(resumeRef) && !mappedResume;
  const details = app.statusDetails || {};
  const interview = details.interview || {};
  const oa = details.oa || {};
  const rejection = details.rejection || {};
  const showInterview = (app.status === "Interview Scheduled" || app.status === "Interview Done") &&
    (interview.date || interview.time || interview.type || interview.link);
  const showOa = app.status === "OA Done" && (oa.date || oa.link);
  const showRejection = app.status === "Rejected" && (rejection.date || rejection.reason);
  const interviewWhen = [formatShortDate(interview.date), formatTime(interview.time)].filter(Boolean).join(" · ");
  return (
    <div className="app-card flex h-full flex-col p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <Link to={`/applications/${app._id}`} state={{ app }} style={{ minWidth: 0, textDecoration: "none" }} aria-label={`View ${app.company} application details`}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-strong)" }} className="truncate">
            {app.company}
          </h3>
          <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--muted)" }} className="truncate">
            {app.role}
          </p>
        </Link>
        <StatusBadge status={app.status} />
      </div>

      <div className="mb-4 flex-1 space-y-2" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="app-badge app-badge-neutral">{app.type}</span>
          {app.applicationLink && (
            <a
              href={app.applicationLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--brand)", fontWeight: 600 }}
            >
              <ExternalLink size={12} /> Link
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={13} />
          <span>Applied {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : "—"}</span>
        </div>
        {showInterview && (
          <div className="flex items-center gap-1.5">
            <Clock size={13} style={{ flexShrink: 0 }} />
            <span className="truncate">
              {[interviewWhen, interview.type ? `${interview.type} interview` : ""].filter(Boolean).join(" · ")}
            </span>
            {app.status === "Interview Scheduled" && interview.link && (
              <a
                href={interview.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0, color: "var(--brand)", fontWeight: 600 }}
                aria-label={`Join interview for ${app.company}`}
              >
                <ExternalLink size={12} /> Join
              </a>
            )}
          </div>
        )}
        {showOa && (
          <div className="flex items-center gap-1.5">
            <Clock size={13} style={{ flexShrink: 0 }} />
            <span className="truncate">OA{oa.date ? ` · ${formatShortDate(oa.date)}` : ""}</span>
            {oa.link && (
              <a
                href={oa.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0, color: "var(--brand)", fontWeight: 600 }}
                aria-label={`Open assessment link for ${app.company}`}
              >
                <ExternalLink size={12} /> Open
              </a>
            )}
          </div>
        )}
        {showRejection && (
          <div className="truncate">
            {[rejection.date ? formatShortDate(rejection.date) : "", rejection.reason].filter(Boolean).join(" · ")}
          </div>
        )}
        {app.skills && <div className="truncate">Skills: {app.skills}</div>}
        {mappedResume && (
          <div className="flex items-center gap-1.5">
            <FileText size={13} style={{ flexShrink: 0 }} />
            <span className="truncate">
              Resume: <strong style={{ color: "var(--text)", fontWeight: 600 }}>{mappedResume.title}</strong>
            </span>
            {mappedResume.link && (
              <a
                href={mappedResume.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0, color: "var(--brand)", fontWeight: 600 }}
                aria-label={`View ${mappedResume.title}`}
              >
                <ExternalLink size={12} /> View
              </a>
            )}
          </div>
        )}
        {resumeMissing && (
          <div className="flex items-center gap-1.5">
            <FileText size={13} style={{ flexShrink: 0 }} />
            <span>Resume no longer available — edit to select another.</span>
          </div>
        )}
        {app.notes && <div className="line-clamp-2">{app.notes}</div>}
      </div>

      <div className="flex justify-end gap-2" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.8rem" }}>
        <button type="button" onClick={() => onEdit(app)} className="app-icon-button" aria-label={`Edit ${app.company} application`}>
          <Pencil size={15} />
        </button>
        <button type="button" onClick={() => onDelete(app)} className="app-icon-button danger" aria-label={`Delete ${app.company} application`}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

export default ApplicationCard;
