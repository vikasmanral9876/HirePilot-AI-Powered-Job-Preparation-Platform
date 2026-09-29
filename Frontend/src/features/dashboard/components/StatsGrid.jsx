import {
  FileText,
  TrendingUp,
  Award,
  Target,
} from "../../../components/ui/Icons";

const StatsGrid = ({ reports = [] }) => {
  const hasReports = reports && reports.length > 0;

  // 1. Total Plans
  const totalPlans = reports.length;

  // 2. Average Match Score
  const avgScore = hasReports
    ? Math.round(
        reports.reduce((sum, r) => sum + (Number(r.matchScore) || 0), 0) /
          reports.length
      )
    : null;

  // 3. Highest Match Score
  const highestScore = hasReports
    ? Math.max(...reports.map((r) => Number(r.matchScore) || 0))
    : null;

  // 4. Latest Target Role
  const latestRole = hasReports ? reports[0].title || "Custom Role" : null;

  const getScoreBadge = (score) => {
    if (score === null) return { label: "No data", className: "badge-pill--neutral" };
    if (score >= 80) return { label: "Strong Match", className: "badge-pill--high" };
    if (score >= 60) return { label: "Moderate Match", className: "badge-pill--mid" };
    return { label: "Prep Needed", className: "badge-pill--low" };
  };

  const avgBadge = getScoreBadge(avgScore);
  const highestBadge = getScoreBadge(highestScore);

  return (
    <div className="stats-grid">
      {/* 1. Total Plans */}
      <div className="stat-card">
        <div className="stat-card__top">
          <span className="stat-title">Interview Plans</span>
          <div className="stat-icon stat-icon--accent">
            <FileText size={18} />
          </div>
        </div>
        <div className="stat-card__value">
          <span className="stat-number">{totalPlans}</span>
          <span className="stat-unit">total</span>
        </div>
        <div className="stat-card__footer">
          {hasReports ? (
            <span>Derived from generated reports</span>
          ) : (
            <span className="badge-pill badge-pill--neutral">0 plans created</span>
          )}
        </div>
      </div>

      {/* 2. Average Match Score */}
      <div className="stat-card">
        <div className="stat-card__top">
          <span className="stat-title">Average Match</span>
          <div className="stat-icon stat-icon--info">
            <TrendingUp size={18} />
          </div>
        </div>
        <div className="stat-card__value">
          <span className="stat-number">
            {avgScore !== null ? `${avgScore}` : "--"}
          </span>
          {avgScore !== null && <span className="stat-unit">%</span>}
        </div>
        <div className="stat-card__footer">
          {hasReports ? (
            <span className={`badge-pill ${avgBadge.className}`}>
              {avgBadge.label}
            </span>
          ) : (
            <span className="badge-pill badge-pill--neutral">Awaiting first plan</span>
          )}
        </div>
      </div>

      {/* 3. Highest Match Score */}
      <div className="stat-card">
        <div className="stat-card__top">
          <span className="stat-title">Peak Readiness</span>
          <div className="stat-icon stat-icon--success">
            <Award size={18} />
          </div>
        </div>
        <div className="stat-card__value">
          <span className="stat-number">
            {highestScore !== null ? `${highestScore}` : "--"}
          </span>
          {highestScore !== null && <span className="stat-unit">%</span>}
        </div>
        <div className="stat-card__footer">
          {hasReports ? (
            <span className={`badge-pill ${highestBadge.className}`}>
              Highest match across roles
            </span>
          ) : (
            <span className="badge-pill badge-pill--neutral">No reports yet</span>
          )}
        </div>
      </div>

      {/* 4. Latest Target Role */}
      <div className="stat-card">
        <div className="stat-card__top">
          <span className="stat-title">Latest Target Role</span>
          <div className="stat-icon stat-icon--warning">
            <Target size={18} />
          </div>
        </div>
        <div className="stat-card__value">
          <span
            className="stat-number"
            style={{
              fontSize: "1.1rem",
              lineHeight: 1.35,
              wordBreak: "break-word",
              whiteSpace: "normal",
              maxWidth: "100%",
            }}
            title={latestRole || "None"}
          >
            {latestRole || "None set"}
          </span>
        </div>
        <div className="stat-card__footer">
          {hasReports ? (
            <span>Most recent plan created</span>
          ) : (
            <span className="badge-pill badge-pill--neutral">Awaiting input</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsGrid;
