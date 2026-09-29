import { Link } from "react-router";
import {
  Calendar,
  CheckSquare,
  Clock,
  Sparkles,
  ArrowRight,
} from "../../../components/ui/Icons";

const PreparationProgress = ({
  activeReport,
  completedTasks = [],
  onToggleTask,
}) => {
  const preparationPlan = activeReport?.preparationPlan || [];

  // Flatten all tasks from the preparation plan
  const allTasks = preparationPlan.flatMap((dayObj) => {
    const tasks = Array.isArray(dayObj.tasks)
      ? dayObj.tasks
      : typeof dayObj.tasks === "string"
      ? [dayObj.tasks]
      : [];
    return tasks.map((taskText, taskIdx) => ({
      id: `day_${dayObj.day}_task_${taskIdx}`,
      day: dayObj.day,
      focus: dayObj.focus,
      text: taskText,
    }));
  });

  const totalTasks = allTasks.length;
  const completedCount = allTasks.filter((t) =>
    completedTasks.includes(t.id)
  ).length;
  const percentCompleted =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="dash-card prep-progress">
      <div className="dash-card__header">
        <div className="header-title-group">
          <h2>Active Preparation Roadmap</h2>
          {totalTasks > 0 && (
            <span className="count-badge">
              {completedCount}/{totalTasks} Done
            </span>
          )}
        </div>
        {activeReport?._id && (
          <Link
            to={`/interview/${activeReport._id}`}
            className="header-action"
            title="Open complete roadmap"
          >
            <span>Full Plan</span>
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      <div className="dash-card__body">
        {totalTasks > 0 ? (
          <>
            {/* Progress bar overview */}
            <div className="progress-overview">
              <div className="progress-labels">
                <span>
                  Focus: <strong>{activeReport.title || "Target Role"}</strong>
                </span>
                <span className="pct">{percentCompleted}% Completed</span>
              </div>
              <div className="progress-bar-wrap">
                <div
                  className="progress-fill"
                  style={{ width: `${percentCompleted}%` }}
                />
              </div>
            </div>

            {/* Next Milestone Tasks (Up to 4) */}
            <div className="task-list">
              {allTasks.slice(0, 4).map((task) => {
                const isDone = completedTasks.includes(task.id);
                return (
                  <div
                    key={task.id}
                    className={`task-item ${isDone ? "task-item--completed" : ""}`}
                    onClick={() => onToggleTask(task.id, task.text)}
                  >
                    <div className="task-checkbox">
                      {isDone && <CheckSquare size={14} />}
                    </div>
                    <div className="task-details">
                      <span className="day-tag">
                        Day {task.day} • {task.focus}
                      </span>
                      <span className="task-text">{task.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : activeReport ? (
          // Plan exists but no roadmap items parsed
          <div className="dash-empty-state" style={{ padding: "1.5rem 1rem" }}>
            <div className="dash-empty-state__icon">
              <Clock size={20} />
            </div>
            <h3>Roadmap initializing</h3>
            <p>Preparation tasks for this position are being formatted.</p>
            <Link
              to={`/interview/${activeReport._id}`}
              className="empty-cta-btn"
            >
              Open Interview Report
            </Link>
          </div>
        ) : (
          // No reports created yet
          <div className="dash-empty-state" style={{ padding: "1.5rem 1rem" }}>
            <div className="dash-empty-state__icon">
              <Calendar size={22} />
            </div>
            <h3>No active roadmap</h3>
            <p>
              Generate your first interview plan to unlock an automated, day-wise preparation checklist tailored to your target position.
            </p>
            <Link to="/create" className="empty-cta-btn">
              <Sparkles size={14} />
              <span>Start Strategy</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreparationProgress;
