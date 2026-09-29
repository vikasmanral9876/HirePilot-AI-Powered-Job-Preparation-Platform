import { Clock } from "../../../components/ui/Icons";

const RecentActivity = ({ reports = [], activityLog = [] }) => {
  // Combine real plan creation activities from reports with user milestone task events
  const planActivities = reports.map((r) => ({
    id: `plan_${r._id}`,
    type: "plan_created",
    message: `Generated interview plan for "${r.title || "Custom Role"}" (Match: ${r.matchScore ?? 0}%)`,
    timestamp: r.createdAt || new Date().toISOString(),
  }));

  // Merge and sort by timestamp descending, ensuring only 1 entry per task/action
  const combined = [...activityLog, ...planActivities];
  const seen = new Set();
  const displayActivities = [];

  combined
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach((act) => {
      const key = act.taskId ? `task_${act.taskId}` : act.message;
      if (!seen.has(key)) {
        seen.add(key);
        displayActivities.push(act);
      }
    });

  const finalActivities = displayActivities.slice(0, 6);

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Recently";
    try {
      const now = new Date();
      const past = new Date(timestamp);
      const diffMs = now - past;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;

      const isSameYear = now.getFullYear() === past.getFullYear();
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        ...(isSameYear ? {} : { year: "numeric" }),
      }).format(past);
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="dash-card">
      <div className="dash-card__header">
        <div className="header-title-group">
          <h2>Recent Activity</h2>
        </div>
      </div>

      <div className="dash-card__body">
        {finalActivities.length > 0 ? (
          <div className="activity-timeline">
            {finalActivities.map((act) => {
              const isTask = act.type === "task_completed";
              return (
                <div key={act.id} className="activity-item">
                  <div
                    className={`activity-dot ${
                      isTask ? "activity-dot--success" : ""
                    }`}
                  />
                  <div className="activity-body">
                    <p className="text">{act.message}</p>
                    <span
                      className="time"
                      title={act.timestamp ? new Date(act.timestamp).toLocaleString() : ""}
                    >
                      {formatRelativeTime(act.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="dash-empty-state" style={{ padding: "1.5rem 1rem" }}>
            <div className="dash-empty-state__icon">
              <Clock size={20} />
            </div>
            <h3>No recent activity</h3>
            <p>Your actions, roadmap progress, and plan creations will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
