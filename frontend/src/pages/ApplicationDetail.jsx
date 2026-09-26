import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, ExternalLink, FileText } from "lucide-react";
import { getApplications, getApplicationEvents, updateApplication, deleteApplication } from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import StatusBadge from "../components/ui/StatusBadge";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ApplicationForm from "../components/applications/ApplicationForm";
import ApplicationTimeline from "../components/applications/ApplicationTimeline";
import { formatLongDate, formatTime } from "../utils/datetime";

function ApplicationDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [app, setApp] = useState(location.state?.app || null);
  const [loading, setLoading] = useState(!location.state?.app);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    if (app) return;
    let active = true;
    async function fetchApp() {
      try {
        setLoading(true);
        setError("");
        const data = await getApplications();
        const list = Array.isArray(data) ? data : [];
        const found = list.find((item) => item._id === id);
        if (!active) return;
        if (found) {
          setApp(found);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        if (active) setError(err.message || "Unable to load this application.");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchApp();
    return () => {
      active = false;
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let active = true;
    async function fetchEvents() {
      try {
        setEventsLoading(true);
        const data = await getApplicationEvents(id);
        if (active) setEvents(Array.isArray(data) ? data : []);
      } catch {
        // Timeline is supplementary: a failure hides the section content
        // instead of breaking the page. The empty fallback still renders.
        if (active) setEvents([]);
      } finally {
        if (active) setEventsLoading(false);
      }
    }
    fetchEvents();
    return () => {
      active = false;
    };
  }, [id]);

  async function handleEditSubmit(formData) {
    try {
      setSubmitLoading(true);
      setFormError("");
      const updated = await updateApplication(app._id, formData);
      setApp(updated);
      setIsEditOpen(false);
      // A status change records a new timeline event — refresh the list.
      try {
        const data = await getApplicationEvents(app._id);
        setEvents(Array.isArray(data) ? data : []);
      } catch {
        // Keep the existing timeline content on refresh failure.
      }
    } catch (err) {
      setFormError(err.message || "Unable to save changes.");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    try {
      setDeleteLoading(true);
      await deleteApplication(app._id);
      navigate("/applications");
    } catch (err) {
      setError(err.message || "Unable to delete this application.");
      setDeleteOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="app-page">
        <LoadingState rows={4} />
      </div>
    );
  }

  if (error && !app) {
    return (
      <div className="app-page">
        <BackLink />
        <ErrorState message="Unable to load this application right now. Please try again shortly." onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (notFound || !app) {
    return (
      <div className="app-page">
        <BackLink />
        <EmptyState
          title="Application not found"
          description="It may have been deleted or you may have followed an old link."
          action={
            <Link to="/applications" className="app-button app-button-secondary">
              Back to applications
            </Link>
          }
        />
      </div>
    );
  }

  const details = app.statusDetails || {};
  const interview = details.interview || {};
  const oa = details.oa || {};
  const rejection = details.rejection || {};
  const hasInterview = Boolean(interview.date || interview.time || interview.type || interview.link || interview.notes);
  const hasOa = Boolean(oa.date || oa.link || oa.notes);
  const hasRejection = Boolean(rejection.date || rejection.reason);
  const resumeRef = app.resumeId;
  const mappedResume = resumeRef && typeof resumeRef === "object" && resumeRef.title ? resumeRef : null;
  const resumeMissing = Boolean(resumeRef) && !mappedResume;
  const interviewWhen = [formatLongDate(interview.date), formatTime(interview.time)].filter(Boolean).join(" · ");

  return (
    <div className="app-page">
      <BackLink />

      <PageHeader
        eyebrow="Application details"
        title={app.company}
        description={app.role}
        action={
          <AppButton onClick={() => { setFormError(""); setIsEditOpen(true); }}>
            <Pencil size={15} /> Edit application
          </AppButton>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={app.status} />
        <span className="app-badge app-badge-neutral">{app.type}</span>
      </div>

      {error && <ErrorState message={error} />}
      {formError && <ErrorState message={formError} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
        <div className="space-y-4">
          <AppCard className="p-5">
            <SectionTitle>Overview</SectionTitle>
            <dl style={{ margin: 0, display: "grid", gap: "0.7rem", fontSize: "0.85rem" }}>
              <DetailRow label="Applied date" value={app.appliedDate ? formatLongDate(app.appliedDate) : "—"} />
              <DetailRow label="Current status" value={<StatusBadge status={app.status} />} />
              <DetailRow label="Job type" value={app.type || "—"} />
              {app.skills && <DetailRow label="Skills" value={app.skills} />}
              {app.applicationLink && (
                <DetailRow
                  label="Job posting"
                  value={
                    <a href={app.applicationLink} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 600, color: "var(--brand)" }}>
                      View job posting <ExternalLink size={13} />
                    </a>
                  }
                />
              )}
            </dl>
          </AppCard>

          <AppCard className="p-5">
            <SectionTitle>Application timeline</SectionTitle>
            {eventsLoading ? (
              <div className="app-loading-state">
                <div className="app-skeleton" style={{ height: 120 }} />
              </div>
            ) : (
              <ApplicationTimeline events={events} appliedDate={app.appliedDate} />
            )}
          </AppCard>

          {hasInterview && (
            <AppCard className="p-5">
              <SectionTitle>Interview</SectionTitle>
              <dl style={{ margin: 0, display: "grid", gap: "0.7rem", fontSize: "0.85rem" }}>
                {interviewWhen && <DetailRow label="When" value={interviewWhen} />}
                {interview.type && <DetailRow label="Type" value={`${interview.type} interview`} />}
                {interview.link && (
                  <DetailRow
                    label="Meeting link"
                    value={
                      <a href={interview.link} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 600, color: "var(--brand)" }}>
                        Join interview <ExternalLink size={13} />
                      </a>
                    }
                  />
                )}
                {interview.notes && <DetailRow label="Notes" value={interview.notes} />}
              </dl>
            </AppCard>
          )}

          {hasOa && (
            <AppCard className="p-5">
              <SectionTitle>Online assessment</SectionTitle>
              <dl style={{ margin: 0, display: "grid", gap: "0.7rem", fontSize: "0.85rem" }}>
                {oa.date && <DetailRow label="Date" value={formatLongDate(oa.date)} />}
                {oa.link && (
                  <DetailRow
                    label="Assessment link"
                    value={
                      <a href={oa.link} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 600, color: "var(--brand)" }}>
                        Open assessment <ExternalLink size={13} />
                      </a>
                    }
                  />
                )}
                {oa.notes && <DetailRow label="Notes" value={oa.notes} />}
              </dl>
            </AppCard>
          )}

          {hasRejection && (
            <AppCard className="p-5">
              <SectionTitle>Rejection</SectionTitle>
              <dl style={{ margin: 0, display: "grid", gap: "0.7rem", fontSize: "0.85rem" }}>
                {rejection.date && <DetailRow label="Date" value={formatLongDate(rejection.date)} />}
                {rejection.reason && <DetailRow label="Reason" value={rejection.reason} />}
              </dl>
            </AppCard>
          )}

          {app.notes && (
            <AppCard className="p-5">
              <SectionTitle>Notes</SectionTitle>
              <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.65, whiteSpace: "pre-wrap", color: "var(--text)" }}>
                {app.notes}
              </p>
            </AppCard>
          )}
        </div>

        <div className="space-y-4">
          <AppCard className="p-5">
            <SectionTitle>Resume used</SectionTitle>
            {mappedResume ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", fontWeight: 650, color: "var(--text-strong)" }}>
                  <FileText size={15} style={{ flexShrink: 0, color: "var(--brand)" }} />
                  <span className="truncate">{mappedResume.title}</span>
                </div>
                {mappedResume.link && (
                  <a href={mappedResume.link} target="_blank" rel="noopener noreferrer" className="app-button app-button-secondary w-full" style={{ marginTop: "0.8rem" }}>
                    View resume <ExternalLink size={13} />
                  </a>
                )}
              </div>
            ) : resumeMissing ? (
              <p style={{ margin: 0, fontSize: "0.82rem", lineHeight: 1.6, color: "var(--muted)" }}>
                The mapped resume is no longer available. Edit this application to select another.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: "0.82rem", lineHeight: 1.6, color: "var(--muted)" }}>
                No resume selected.
              </p>
            )}
          </AppCard>

          <AppCard className="p-5">
            <SectionTitle>Actions</SectionTitle>
            <div className="grid gap-2">
              <AppButton variant="secondary" onClick={() => { setFormError(""); setIsEditOpen(true); }} className="w-full">
                <Pencil size={15} /> Edit application
              </AppButton>
              {app.applicationLink && (
                <a href={app.applicationLink} target="_blank" rel="noopener noreferrer" className="app-button app-button-secondary w-full">
                  View job <ExternalLink size={13} />
                </a>
              )}
              <AppButton variant="danger" onClick={() => setDeleteOpen(true)} className="w-full">
                <Trash2 size={15} /> Delete application
              </AppButton>
            </div>
          </AppCard>
        </div>
      </div>

      <ApplicationForm
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={app}
        loading={submitLoading}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete application?"
        description={`Remove ${app.company || "this application"} from your tracker? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/applications"
      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.82rem", fontWeight: 600, color: "var(--muted)" }}
    >
      <ArrowLeft size={15} /> Back to applications
    </Link>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ margin: "0 0 0.9rem", fontSize: "0.92rem", fontWeight: 700, color: "var(--text-strong)" }}>
      {children}
    </h2>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 sm:grid-cols-[160px_1fr]">
      <dt style={{ color: "var(--faint)", fontSize: "0.78rem", fontWeight: 600 }}>{label}</dt>
      <dd style={{ margin: 0, color: "var(--text)", lineHeight: 1.55, minWidth: 0, overflowWrap: "anywhere" }}>{value}</dd>
    </div>
  );
}

export default ApplicationDetail;
