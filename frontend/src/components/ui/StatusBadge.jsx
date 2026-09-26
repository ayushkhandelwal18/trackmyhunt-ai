function StatusBadge({ status }) {
  const tone = {
    Applied: "info", "Resume Shortlisted": "violet", "OA Done": "cyan",
    "Interview Scheduled": "warning", "Interview Done": "orange", Rejected: "danger",
    Saved: "info", "In progress": "warning", Completed: "success",
    Beginner: "info", Intermediate: "warning", Advanced: "orange", Expert: "success",
  }[status] || "neutral";
  return <span className={`app-badge app-badge-${tone}`}>{status}</span>;
}

export default StatusBadge;