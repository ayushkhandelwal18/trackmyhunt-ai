import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  CalendarCheck,
  Clock,
  XCircle,
  FileText,
  ArrowRight,
  Plus,
  Zap,
  ExternalLink,
} from "lucide-react";
import { getDashboardStats, getApplications } from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/ui/PageHeader";
import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import StatusBadge from "../components/ui/StatusBadge";
import { formatShortDate, formatTime, parseDateInput, startOfToday } from "../utils/datetime";

const PIPELINE = ["Applied", "Resume Shortlisted", "OA Done", "Interview Scheduled", "Interview Done", "Rejected"];

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [statusBreakdown, setStatusBreakdown] = useState({});
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function fetchStats() {
      try {
        setLoading(true);
        setError("");
        const [data, apps] = await Promise.all([getDashboardStats(), getApplications()]);
        if (!active) return;
        setStats(data);
        const list = Array.isArray(apps) ? apps : [];
        setApplications(list);
        const breakdown = {};
        list.forEach((app) => {
          const key = app.status || "Other";
          breakdown[key] = (breakdown[key] || 0) + 1;
        });
        setStatusBreakdown(breakdown);
      } catch (err) {
        if (active) setError(err.message || "Unable to load dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchStats();
    return () => {
      active = false;
    };
  }, []);

  const pipelineCounts = useMemo(() => {
    if (!stats) return [];
    const total = Math.max(stats.counts?.total || 0, 1);
    return PIPELINE.map((status) => {
      const value = statusBreakdown[status] || 0;
      return { status, value, share: Math.round((value / total) * 100) };
    }).filter((row) => row.value > 0 || ["Applied", "Interview Scheduled", "Rejected"].includes(row.status));
  }, [stats, statusBreakdown]);

  const upcomingInterviews = useMemo(() => {
    const today = startOfToday();
    return applications
      .filter((app) => {
        if (app.status !== "Interview Scheduled") return false;
        const date = parseDateInput(app.statusDetails?.interview?.date);
        return date && date >= today;
      })
      .sort((a, b) => parseDateInput(a.statusDetails.interview.date) - parseDateInput(b.statusDetails.interview.date))
      .slice(0, 4);
  }, [applications]);

  const skillEntries = useMemo(() => {
    if (!stats?.skillStats) return [];
    const total = Object.values(stats.skillStats).reduce((sum, n) => sum + (Number(n) || 0), 0) || 1;
    return ["Expert", "Advanced", "Intermediate", "Beginner"].map((level) => ({
      level,
      count: stats.skillStats[level] || 0,
      share: Math.round(((stats.skillStats[level] || 0) / total) * 100),
    }));
  }, [stats]);

  const firstName = (user?.name || "").split(" ")[0] || "there";

  if (loading) {
    return (
      <div className="app-page">
        <LoadingState rows={5} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="app-page">
        <PageHeader eyebrow="Overview" title="Dashboard" description="Your job hunt at a glance." />
        <ErrorState message="Unable to load your dashboard right now. Please try again shortly." onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="app-page">
      <PageHeader
        eyebrow="Overview"
        title={`Good to see you, ${firstName}`}
        description="Here's what's happening with your job hunt."
        action={
          <AppButton onClick={() => navigate("/applications")}>
            <Plus size={16} /> Add application
          </AppButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard title="Total applications" value={stats.counts.total} icon={<Briefcase size={17} />} />
        <MetricCard title="Interviews" value={stats.counts.interview} icon={<CalendarCheck size={17} />} />
        <MetricCard title="Pending actions" value={stats.counts.pending} icon={<Clock size={17} />} />
        <MetricCard title="Rejections" value={stats.counts.rejected} icon={<XCircle size={17} />} />
        <MetricCard title="Resumes saved" value={stats.counts.resumes} icon={<FileText size={17} />} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
        <div className="space-y-4">
          <AppCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-strong)" }}>
                Application pipeline
              </h2>
              <Link
                to="/applications"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.78rem", color: "var(--muted)" }}
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {pipelineCounts.length === 0 ? (
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>No pipeline data yet.</p>
            ) : (
              <div className="space-y-3">
                {pipelineCounts.map((row) => (
                  <div key={row.status} className="flex items-center gap-3">
                    <span style={{ width: 148, fontSize: "0.78rem", color: "var(--muted)" }} className="hidden sm:block">
                      {row.status}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 8,
                        borderRadius: 999,
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ width: `${row.share}%`, height: "100%", background: "var(--brand)" }} />
                    </div>
                    <span style={{ width: 56, textAlign: "right", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-strong)" }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </AppCard>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-strong)" }}>
                Recent applications
              </h2>
              <Link to="/applications" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.78rem", color: "var(--muted)" }}>
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <AppCard style={{ overflow: "hidden" }}>
              {stats.recentApplications.length === 0 ? (
                <div style={{ padding: "0.5rem" }}>
                  <EmptyState
                    title="No applications yet"
                    description="Start tracking the roles you're applying to."
                    action={
                      <AppButton onClick={() => navigate("/applications")}>
                        <Plus size={15} /> Add application
                      </AppButton>
                    }
                  />
                </div>
              ) : (
                <div>
                  {stats.recentApplications.map((app, index) => (
                    <div
                      key={app._id}
                      className="flex items-center justify-between gap-3"
                      style={{
                        padding: "0.85rem 1rem",
                        borderTop: index === 0 ? "0" : "1px solid var(--border)",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 650, color: "var(--text-strong)", fontSize: "0.88rem" }} className="truncate">
                          {app.company}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--muted)" }} className="truncate">
                          {app.role}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "0.72rem", color: "var(--faint)", marginBottom: 4 }}>
                          {app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : ""}
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AppCard>
          </div>
        </div>

        <div className="space-y-4">
          <AppCard className="p-5">
            <h3 style={{ margin: "0 0 0.8rem", display: "flex", alignItems: "center", gap: 8, fontSize: "0.92rem", fontWeight: 700, color: "var(--text-strong)" }}>
              <Zap size={16} style={{ color: "var(--brand)" }} /> Quick actions
            </h3>
            <div className="grid gap-2">
              <AppButton onClick={() => navigate("/applications")} className="w-full">
                <Plus size={15} /> Add application
              </AppButton>
              <AppButton variant="secondary" onClick={() => navigate("/opportunities")} className="w-full">
                Add opportunity
              </AppButton>
              <AppButton variant="secondary" onClick={() => navigate("/notes")} className="w-full">
                Add note
              </AppButton>
              <AppButton variant="secondary" onClick={() => navigate("/resumes")} className="w-full">
                Add resume
              </AppButton>
            </div>
          </AppCard>

          <div>
            <h3 style={{ margin: "0 0 0.7rem", fontSize: "0.92rem", fontWeight: 700, color: "var(--text-strong)" }}>
              Upcoming interviews
            </h3>
            {upcomingInterviews.length === 0 ? (
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--faint)" }}>No upcoming interviews.</p>
            ) : (
              <div className="space-y-2">
                {upcomingInterviews.map((app) => {
                  const interview = app.statusDetails?.interview || {};
                  const when = [formatShortDate(interview.date), formatTime(interview.time)].filter(Boolean).join(" · ");
                  return (
                    <div key={app._id} className="app-card flex items-center justify-between gap-2 p-3">
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-strong)" }} className="truncate">
                          {app.company}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)" }} className="truncate">
                          {[app.role, interview.type ? `${interview.type} interview` : "", when].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      {interview.link && (
                        <a href={interview.link} target="_blank" rel="noopener noreferrer" className="app-icon-button" aria-label={`Join interview for ${app.company}`} title="Join interview">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h3 style={{ margin: "0 0 0.7rem", fontSize: "0.92rem", fontWeight: 700, color: "var(--text-strong)" }}>
              Upcoming opportunities
            </h3>
            {stats.upcomingOpportunities.length === 0 ? (
              <EmptyState
                title="Nothing upcoming"
                description="Add opportunities to keep track of what's next."
                action={
                  <Link to="/opportunities" className="app-button app-button-secondary">
                    Add opportunity
                  </Link>
                }
              />
            ) : (
              <div className="space-y-2">
                {stats.upcomingOpportunities.map((opp) => (
                  <div key={opp._id} className="app-card flex items-center justify-between p-3">
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-strong)" }} className="truncate">
                        {opp.company}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                        {opp.openingMonth} {opp.openingYear}
                      </div>
                    </div>
                    {opp.link && (
                      <a href={opp.link} target="_blank" rel="noopener noreferrer" className="app-icon-button" aria-label={`Open ${opp.company} link`}>
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, color: "var(--text-strong)" }}>Skill snapshot</h3>
              <Link to="/skillboard" style={{ fontSize: "0.76rem", color: "var(--brand)", fontWeight: 600 }}>
                View skillboard
              </Link>
            </div>
            <AppCard className="space-y-3 p-4">
              {skillEntries.map((row) => (
                <div key={row.level} className="flex items-center gap-3">
                  <span style={{ width: 88, fontSize: "0.75rem", color: "var(--muted)" }}>{row.level}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
                    <div style={{ width: `${row.share}%`, height: "100%", background: "var(--brand)" }} />
                  </div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-strong)", width: 20, textAlign: "right" }}>
                    {row.count}
                  </span>
                </div>
              ))}
            </AppCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }) {
  return (
    <AppCard className="p-4">
      <div
        style={{
          display: "grid",
          placeItems: "center",
          height: 32,
          width: 32,
          borderRadius: 8,
          background: "var(--brand-soft)",
          border: "1px solid var(--brand-border)",
          color: "var(--brand)",
          marginBottom: "0.7rem",
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: "1.45rem", fontWeight: 750, letterSpacing: "-0.02em", color: "var(--text-strong)", lineHeight: 1 }}>
        {value ?? 0}
      </div>
      <div style={{ marginTop: 4, fontSize: "0.75rem", fontWeight: 500, color: "var(--muted)" }}>{title}</div>
    </AppCard>
  );
}

export default Dashboard;
