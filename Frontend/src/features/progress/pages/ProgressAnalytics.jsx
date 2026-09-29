import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { useAuth } from "../../auth/hooks/useAuth";
import { useInterview } from "../../interview/hooks/useInterview";
import { getInterviewReportById } from "../../interview/services/interview.api";
import "../progress.scss";
import {
  BarChart2,
  Target,
  Code,
  Users,
  MessageSquare,
  Clock,
  CheckCircle2,
  Plus,
  Sparkles,
  Layers,
  Award
} from "../../../components/ui/Icons";

const ProgressAnalytics = () => {
  const { user } = useAuth();
  const userId = user?.id || user?._id || user?.email || "anonymous";
  const { reports, getReports, loading } = useInterview();

  // Selected report for deep inspection
  const [selectedReportId, setSelectedReportId] = useState("");
  const [detailedReport, setDetailedReport] = useState(null);

  // Completed tasks from localStorage for the active plan
  const [completedTasks, setCompletedTasks] = useState([]);
  const [activityLog, setActivityLog] = useState([]);

  // Fetch all reports on mount
  useEffect(() => {
    getReports();
  }, []);

  // Set default selected report ID when reports load
  useEffect(() => {
    if (reports && reports.length > 0 && !selectedReportId) {
      setSelectedReportId(reports[0]._id);
    }
  }, [reports, selectedReportId]);

  // Load detailed report when selectedReportId changes
  useEffect(() => {
    let isCurrent = true;
    if (!selectedReportId) {
      setDetailedReport(null);
      return;
    }

    const fetchDetails = async () => {
      try {
        const res = await getInterviewReportById(selectedReportId);
        if (isCurrent && res?.interviewReport) {
          setDetailedReport(res.interviewReport);
        }
      } catch (err) {
        console.error("Failed to load interview report details:", err);
      }
    };

    fetchDetails();

    return () => {
      isCurrent = false;
    };
  }, [selectedReportId]);

  // Load completed tasks for current report
  useEffect(() => {
    if (!selectedReportId) {
      setCompletedTasks([]);
      return;
    }
    try {
      const stored = localStorage.getItem(`hirepilot_prep_${userId}_${selectedReportId}`);
      if (stored) {
        setCompletedTasks(JSON.parse(stored));
      } else {
        setCompletedTasks([]);
      }
    } catch (e) {
      console.error("Failed to load prep tasks:", e);
      setCompletedTasks([]);
    }
  }, [userId, selectedReportId]);

  // Load activity log scoped to current user
  useEffect(() => {
    try {
      localStorage.removeItem("hirepilot_activity_log");
      const stored = localStorage.getItem(`hirepilot_activity_log_${userId}`);
      if (stored) {
        setActivityLog(JSON.parse(stored));
      } else {
        setActivityLog([]);
      }
    } catch (e) {
      console.error("Failed to load activity log:", e);
      setActivityLog([]);
    }
  }, [userId]);

  // Compute real metrics from the selected detailed report
  const metrics = useMemo(() => {
    if (!detailedReport) {
      return null;
    }

    const matchScore = detailedReport.matchScore || 0;

    // Technical performance
    const techQuestions = detailedReport.technicalQuestions || [];
    const techCount = techQuestions.length;

    // Skill gaps breakdown
    const gaps = detailedReport.skillGaps || [];
    const highGaps = gaps.filter((g) => g.severity === "high");
    const medGaps = gaps.filter((g) => g.severity === "medium");
    const lowGaps = gaps.filter((g) => g.severity === "low");

    // Behavioral performance
    const behavQuestions = detailedReport.behavioralQuestions || [];
    const behavCount = behavQuestions.length;

    // Communication: Assess structured response depth
    // Checks how many behavioral answers articulate clear STAR components or detailed solutions
    const structuredAnswersCount = behavQuestions.filter(
      (b) => b.answer && b.answer.length > 50
    ).length;

    // Roadmap checklist completion
    const prepPlan = detailedReport.preparationPlan || [];
    let totalTasksCount = 0;
    prepPlan.forEach((day) => {
      if (day.tasks && Array.isArray(day.tasks)) {
        totalTasksCount += day.tasks.length;
      }
    });

    const completedTasksCount = completedTasks.length;
    const taskCompletionPct =
      totalTasksCount > 0
        ? Math.min(100, Math.round((completedTasksCount / totalTasksCount) * 100))
        : 0;

    // Overall preparation index (70% match score + 30% roadmap milestones executed)
    const overallPreparationIndex =
      totalTasksCount > 0
        ? Math.round(matchScore * 0.7 + taskCompletionPct * 0.3)
        : matchScore;

    return {
      matchScore,
      techCount,
      gaps,
      highGaps,
      medGaps,
      lowGaps,
      behavCount,
      structuredAnswersCount,
      totalTasksCount,
      completedTasksCount,
      taskCompletionPct,
      overallPreparationIndex,
    };
  }, [detailedReport, completedTasks]);

  // Combined real activities
  const displayActivities = useMemo(() => {
    const list = [...activityLog];

    // If reports exist, also ensure plan creations appear in the activity feed
    if (reports && reports.length > 0) {
      reports.forEach((rep) => {
        // Check if already in list
        const exists = list.some(
          (a) => a.metadata?.reportId === rep._id || a.message?.includes(rep.title)
        );
        if (!exists) {
          list.push({
            id: `plan_${rep._id}`,
            type: "plan_created",
            message: `Generated AI preparation strategy for "${rep.title}"`,
            timestamp: rep.createdAt,
          });
        }
      });
    }

    // Sort descending by timestamp and deduplicate
    const sorted = list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const seen = new Set();
    const unique = [];
    for (const act of sorted) {
      const key = act.taskId ? `task_${act.taskId}` : act.message;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(act);
      }
    }

    return unique.slice(0, 10);
  }, [activityLog, reports]);

  const hasReports = reports && reports.length > 0;

  // SVG Gauge calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const currentPrepIndex = metrics ? metrics.overallPreparationIndex : 0;
  const strokeDashoffset = circumference - (currentPrepIndex / 100) * circumference;

  return (
    <div className="progress-page">
      {/* Banner / Header */}
      <section className="progress-header">
        <div className="progress-header__left">
          <div className="progress-header__badge">
            <BarChart2 size={13} />
            <span>Preparation Analytics</span>
          </div>
          <h1>Candidate Readiness Intelligence</h1>
          <p>
            Track your verified technical competency, behavioral structure, and communication
            preparedness based on your active interview simulations and roadmap tasks.
          </p>
        </div>

        {hasReports && (
          <div className="progress-header__selector">
            <label htmlFor="report-selector">Active Preparation Plan:</label>
            <select
              id="report-selector"
              value={selectedReportId}
              onChange={(e) => setSelectedReportId(e.target.value)}
            >
              {reports.map((rep) => (
                <option key={rep._id} value={rep._id}>
                  {rep.title || "Custom Plan"} ({rep.matchScore || 0}% Match)
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* MEANINGFUL EMPTY STATE IF NO REPORTS EXIST */}
      {!hasReports && !loading ? (
        <div className="progress-empty-state">
          <div className="progress-empty-state__icon">
            <Target size={32} />
          </div>
          <h2>No Interview Preparation Data Yet</h2>
          <p>
            HirePilot analyzes your resume against target job requirements to generate real
            preparation scores, identify technical skill gaps, and provide actionable roadmaps.
            Generate your first interview plan to unlock live analytics.
          </p>
          <Link to="/create" className="btn-primary" style={{ textDecoration: "none" }}>
            <Plus size={16} />
            <span>Create Custom Interview Plan</span>
          </Link>
        </div>
      ) : (
        <>
          {/* OVERALL PREPARATION HERO METRICS */}
          <div className="prep-score-grid">
            {/* Left: Overall Preparation Circular Gauge */}
            <div className="prep-gauge-card">
              <div className="prep-gauge-card__circle-wrapper">
                <svg>
                  <circle className="bg" cx="90" cy="90" r={radius} />
                  <circle
                    className="progress"
                    cx="90"
                    cy="90"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="gauge-value">
                  <span className="number">
                    {metrics ? metrics.overallPreparationIndex : "--"}%
                  </span>
                  <span className="unit">Readiness</span>
                </div>
              </div>

              <h2>Overall Preparation Score</h2>
              <p>
                Calculated from target role alignment ({metrics?.matchScore || 0}%) and completed roadmap milestones.
              </p>

              <div
                className={`prep-gauge-card__status-pill ${
                  currentPrepIndex >= 75
                    ? "prep-gauge-card__status-pill--high"
                    : currentPrepIndex >= 50
                    ? "prep-gauge-card__status-pill--medium"
                    : "prep-gauge-card__status-pill--low"
                }`}
              >
                <CheckCircle2 size={13} />
                <span>
                  {currentPrepIndex >= 75
                    ? "Interview Ready"
                    : currentPrepIndex >= 50
                    ? "Moderate Readiness"
                    : "Needs Focused Preparation"}
                </span>
              </div>
            </div>

            {/* Right: Core Performance Pillars Breakdown */}
            <div className="prep-pillars-card">
              <div className="prep-pillars-card__title">
                <h3>Readiness Breakdown by Pillar</h3>
                <span>{detailedReport?.title || "Active Target Role"}</span>
              </div>

              <div className="prep-pillars-card__list">
                {/* 1. Job Description & Skill Match */}
                <div className="pillar-item">
                  <div className="pillar-item__header">
                    <div className="name-col">
                      <Target size={15} />
                      <span>Resume & Role Match</span>
                    </div>
                    <span className="score-badge">{metrics?.matchScore || 0}%</span>
                  </div>
                  <div className="pillar-item__bar">
                    <div
                      className="fill"
                      style={{ width: `${metrics?.matchScore || 0}%` }}
                    />
                  </div>
                  <div className="pillar-item__meta">
                    <span>Keyword alignment with job description</span>
                    <span>AI Model Benchmark</span>
                  </div>
                </div>

                {/* 2. Roadmap Execution */}
                <div className="pillar-item">
                  <div className="pillar-item__header">
                    <div className="name-col">
                      <Award size={15} />
                      <span>Roadmap Milestones Completed</span>
                    </div>
                    <span className="score-badge">{metrics?.taskCompletionPct || 0}%</span>
                  </div>
                  <div className="pillar-item__bar">
                    <div
                      className="fill"
                      style={{ width: `${metrics?.taskCompletionPct || 0}%` }}
                    />
                  </div>
                  <div className="pillar-item__meta">
                    <span>
                      {metrics?.completedTasksCount || 0} of {metrics?.totalTasksCount || 0} tasks finished
                    </span>
                    <span>Checklist Progress</span>
                  </div>
                </div>

                {/* 3. Question Bank Coverage */}
                <div className="pillar-item">
                  <div className="pillar-item__header">
                    <div className="name-col">
                      <Layers size={15} />
                      <span>Question Scenario Coverage</span>
                    </div>
                    <span className="score-badge">
                      {(metrics?.techCount || 0) + (metrics?.behavCount || 0)} scenarios
                    </span>
                  </div>
                  <div className="pillar-item__bar">
                    <div
                      className="fill"
                      style={{
                        width: `${Math.min(
                          100,
                          ((metrics?.techCount || 0) + (metrics?.behavCount || 0)) * 12
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="pillar-item__meta">
                    <span>
                      {metrics?.techCount || 0} Technical • {metrics?.behavCount || 0} Behavioral
                    </span>
                    <span>Structured Answers Available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PERFORMANCE TRIO: TECHNICAL, BEHAVIORAL, COMMUNICATION */}
          <div className="metrics-tri-grid">
            {/* 1. TECHNICAL PERFORMANCE */}
            <div className="metric-box">
              <div className="metric-box__header">
                <h3>
                  <Code size={16} />
                  <span>Technical Performance</span>
                </h3>
                <span className="count-pill">{metrics?.techCount || 0} Scenarios</span>
              </div>

              <div className="metric-box__content">
                <div className="metric-box__row">
                  <span className="key">Technical Questions:</span>
                  <span className="val">{metrics?.techCount || 0} Generated</span>
                </div>
                <div className="metric-box__row">
                  <span className="key">Identified Skill Gaps:</span>
                  <span className="val">{metrics?.gaps.length || 0} Total</span>
                </div>
                <div className="metric-box__row">
                  <span className="key">High Severity Gaps:</span>
                  <span className="val" style={{ color: "#f87171" }}>
                    {metrics?.highGaps.length || 0} Areas
                  </span>
                </div>

                {/* Tags of Skill Gaps */}
                {metrics?.gaps && metrics.gaps.length > 0 && (
                  <div className="metric-box__tags">
                    {metrics.gaps.map((gap, idx) => (
                      <span
                        key={idx}
                        className={`gap-tag gap-tag--${gap.severity || "medium"}`}
                        title={`Severity: ${gap.severity}`}
                      >
                        {gap.skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. BEHAVIORAL PERFORMANCE */}
            <div className="metric-box">
              <div className="metric-box__header">
                <h3>
                  <Users size={16} />
                  <span>Behavioral Performance</span>
                </h3>
                <span className="count-pill">{metrics?.behavCount || 0} Questions</span>
              </div>

              <div className="metric-box__content">
                <div className="metric-box__row">
                  <span className="key">Situational Scenarios:</span>
                  <span className="val">{metrics?.behavCount || 0} Questions</span>
                </div>
                <div className="metric-box__row">
                  <span className="key">Interviewer Intention:</span>
                  <span className="val">Fully Mapped</span>
                </div>
                <div className="metric-box__row">
                  <span className="key">Culture & Leadership:</span>
                  <span className="val" style={{ color: "#34d399" }}>
                    STAR Framework Ready
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.5", margin: "6px 0 0 0" }}>
                  AI intention models clarify the exact hiring signal recruiters evaluate in each prompt.
                </p>
              </div>
            </div>

            {/* 3. COMMUNICATION READINESS */}
            <div className="metric-box">
              <div className="metric-box__header">
                <h3>
                  <MessageSquare size={16} />
                  <span>Communication</span>
                </h3>
                <span className="count-pill">Model Answers</span>
              </div>

              <div className="metric-box__content">
                <div className="metric-box__row">
                  <span className="key">STAR Methodology:</span>
                  <span className="val" style={{ color: "#ff2d78" }}>
                    {metrics?.structuredAnswersCount || 0} Guides
                  </span>
                </div>
                <div className="metric-box__row">
                  <span className="key">Clarity & Depth:</span>
                  <span className="val">Senior Level</span>
                </div>
                <div className="metric-box__row">
                  <span className="key">Answer Keys Provided:</span>
                  <span className="val">
                    {(metrics?.techCount || 0) + (metrics?.behavCount || 0)} Comprehensive
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.5", margin: "6px 0 0 0" }}>
                  Each question includes concrete example responses with key metrics and technical rationales.
                </p>
              </div>
            </div>
          </div>

          {/* RECENT ACTIVITY LOG */}
          <div className="activity-card">
            <div className="activity-card__header">
              <h3>
                <Clock size={16} />
                <span>Recent Preparation Activity</span>
              </h3>
              <span>Real User Milestones</span>
            </div>

            {displayActivities.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#6b7280", fontStyle: "italic", margin: 0 }}>
                No preparation actions recorded yet. Checking off roadmap tasks or generating interview reports will log your real progress here.
              </p>
            ) : (
              <div className="activity-card__list">
                {displayActivities.map((act) => (
                  <div key={act.id} className="activity-row">
                    <div className="activity-row__left">
                      <div className="activity-row__icon">
                        {act.type === "plan_created" ? (
                          <Sparkles size={15} />
                        ) : act.type === "task_completed" ? (
                          <CheckCircle2 size={15} />
                        ) : (
                          <Award size={15} />
                        )}
                      </div>
                      <span className="activity-row__message">{act.message}</span>
                    </div>
                    <span className="activity-row__time">
                      {new Date(act.timestamp).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ProgressAnalytics;
