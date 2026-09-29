import { useState, useEffect } from "react";
import "../style/interview.scss";
import { useInterview } from "../hooks/useInterview.js";
import { useParams, useNavigate, useLocation } from "react-router";
import {
  Trash2,
  Download,
  Loader2,
  RotateCcw,
  Sparkles,
} from "../../../components/ui/Icons";
import PlanLoadingState from "../components/PlanLoadingState";
import Toast from "../../../components/ui/Toast";


const NAV_ITEMS = [
  {
    id: "technical",
    label: "Technical Questions",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    id: "behavioral",
    label: "Behavioral Questions",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "roadmap",
    label: "Road Map",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
      </svg>
    ),
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="q-card">
      <div className="q-card__header" onClick={() => setOpen((o) => !o)}>
        <span className="q-card__index">Q{index + 1}</span>
        <p className="q-card__question">{item.question}</p>
        <span
          className={`q-card__chevron ${open ? "q-card__chevron--open" : ""}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
      {open && (
        <div className="q-card__body">
          <div className="q-card__section">
            <span className="q-card__tag q-card__tag--intention">
              Intention
            </span>
            <p>{item.intention}</p>
          </div>
          <div className="q-card__section">
            <span className="q-card__tag q-card__tag--answer">
              Model Answer
            </span>
            <p>{item.answer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const RoadMapDay = ({ day }) => {
  const taskList = Array.isArray(day?.tasks)
    ? day.tasks
    : typeof day?.tasks === "string"
      ? [day.tasks]
      : [];

  return (
    <div className="roadmap-day">
      <div className="roadmap-day__header">
        <span className="roadmap-day__badge">Day {day?.day}</span>
        <h3 className="roadmap-day__focus">{day?.focus}</h3>
      </div>
      <ul className="roadmap-day__tasks">
        {taskList.map((task, i) => (
          <li key={i}>
            <span className="roadmap-day__bullet" />
            {task}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
  const [activeNav, setActiveNav] = useState("technical");
  const {
    report,
    loading,
    deleteReport,
    atsResumeStatus,
    atsResumeError,
    isDownloadingResume,
    isRetryingResume,
    downloadResume,
    retryResume,
  } = useInterview();
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState("");
  const [downloadErrorMessage, setDownloadErrorMessage] = useState("");
  const [creationToast, setCreationToast] = useState("");

  // Check if navigated from creation with background preparation flag
  useEffect(() => {
    if (location.state?.newPlanCreated) {
      setCreationToast(
        "Interview plan created successfully. We're preparing your ATS-tailored resume in the background."
      );
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setCreationToast(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleDownloadResume = async () => {
    const targetId = interviewId || report?._id;
    if (!targetId || isDownloadingResume) return;
    setDownloadSuccessMessage("");
    setDownloadErrorMessage("");
    try {
      await downloadResume(targetId);
      setDownloadSuccessMessage("ATS Resume downloaded successfully");
      setTimeout(() => setDownloadSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Error downloading resume PDF:", err);
      setDownloadErrorMessage(
        err?.message || "Failed to download your resume PDF. Please try again."
      );
      setTimeout(() => setDownloadErrorMessage(""), 4000);
    }
  };

  const handleRetryResume = async () => {
    const targetId = interviewId || report?._id;
    if (!targetId || isRetryingResume) return;
    setDownloadSuccessMessage("");
    setDownloadErrorMessage("");
    try {
      await retryResume(targetId);
    } catch (err) {
      console.error("Error retrying resume generation:", err);
      setDownloadErrorMessage(
        err?.message || "Failed to restart resume generation. Please try again."
      );
      setTimeout(() => setDownloadErrorMessage(""), 4000);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteReport(interviewId);
      navigate("/interview/history", { replace: true });
    } catch (err) {
      console.error("Failed to delete interview plan:", err);
    } finally {
      setIsDeleting(false);
    }
  };


  if (loading) {
    return (
      <PlanLoadingState
        title="Loading Your Interview Plan"
        subtitle="Retrieving tailored question blueprints, evaluation criteria & preparation roadmap..."
      />
    );
  }

  if (!report) {
    return (
      <main
        className="loading-screen"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
          gap: "1rem",
        }}
      >
        <h2>Interview report not found</h2>
        <p style={{ color: "#7d8590" }}>
          Could not find or load the requested interview plan.
        </p>
        <button
          onClick={() => navigate("/")}
          className="button primary-button"
          style={{ padding: "0.6rem 1.2rem", cursor: "pointer" }}
        >
          Back to Home
        </button>
      </main>
    );
  }

  const matchScore = report?.matchScore ?? 0;
  const scoreColor =
    matchScore >= 80
      ? "score--high"
      : matchScore >= 60
        ? "score--mid"
        : "score--low";

  const technicalQuestions = report?.technicalQuestions || [];
  const behavioralQuestions = report?.behavioralQuestions || [];
  const preparationPlan = report?.preparationPlan || [];
  const skillGaps = report?.skillGaps || [];

  return (
    <div className="interview-page">
      <div className="interview-layout">
        {/* ── Left Nav ── */}
        <nav className="interview-nav">
          <div className="nav-content">
            <p className="interview-nav__label">Sections</p>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`interview-nav__item ${activeNav === item.id ? "interview-nav__item--active" : ""}`}
                onClick={() => setActiveNav(item.id)}
              >
                <span className="interview-nav__icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
          {/* ── ATS Resume Section ── */}
          <div className="ats-resume-nav-card">
            <div className="ats-resume-nav-card__header">
              <span className="ats-resume-nav-card__title">
                {atsResumeStatus === "ready"
                  ? "ATS Resume Ready"
                  : atsResumeStatus === "generating"
                  ? "Preparing your ATS-tailored resume..."
                  : atsResumeStatus === "failed"
                  ? "ATS Resume couldn't be generated."
                  : "ATS Resume"}
              </span>
              <span className={`ats-status-badge ats-status-badge--${atsResumeStatus}`}>
                <span className="ats-status-dot" />
                {atsResumeStatus === "generating"
                  ? "Preparing"
                  : atsResumeStatus === "ready"
                  ? "Ready"
                  : atsResumeStatus === "failed"
                  ? "Failed"
                  : "Not Started"}
              </span>
            </div>

            <p className="ats-resume-nav-card__description">
              {atsResumeStatus === "generating" &&
                "This is happening in the background. You can continue using HirePilot."}
              {atsResumeStatus === "ready" &&
                "Your tailored resume is ready to download."}
              {atsResumeStatus === "failed" &&
                (atsResumeError || "ATS resume couldn't be generated. Please try again.")}
              {atsResumeStatus === "not_started" &&
                "Your tailored resume hasn't been generated yet."}
            </p>

            {atsResumeStatus === "generating" && (
              <button
                type="button"
                className="button ats-resume-btn ats-resume-btn--generating"
                disabled
                aria-busy="true"
              >
                <Loader2 size={15} className="spin-loader" />
                <span>Preparing...</span>
              </button>
            )}

            {atsResumeStatus === "ready" && (
              <button
                type="button"
                onClick={handleDownloadResume}
                disabled={isDownloadingResume}
                className="button primary-button ats-resume-btn ats-resume-btn--ready"
                aria-busy={isDownloadingResume}
              >
                {isDownloadingResume ? (
                  <>
                    <Loader2 size={15} className="spin-loader" />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    <span>Download ATS Tailored Resume</span>
                  </>
                )}
              </button>
            )}

            {atsResumeStatus === "failed" && (
              <button
                type="button"
                onClick={handleRetryResume}
                disabled={isRetryingResume}
                className="button ats-resume-btn ats-resume-btn--retry"
                aria-busy={isRetryingResume}
              >
                <RotateCcw size={15} className={isRetryingResume ? "spin-loader" : ""} />
                <span>{isRetryingResume ? "Retrying..." : "Retry Generation"}</span>
              </button>
            )}

            {atsResumeStatus === "not_started" && (
              <button
                type="button"
                onClick={handleRetryResume}
                disabled={isRetryingResume}
                className="button primary-button ats-resume-btn ats-resume-btn--start"
                aria-busy={isRetryingResume}
              >
                {isRetryingResume ? (
                  <>
                    <Loader2 size={15} className="spin-loader" />
                    <span>Preparing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Generate ATS Resume</span>
                  </>
                )}
              </button>
            )}
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="button"
            style={{
              marginTop: "0.5rem",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: "600",
              width: "100%",
              transition: "all 0.15s ease",
            }}
          >
            <Trash2 size={15} />
            <span>Delete Plan</span>
          </button>
        </nav>

        <div className="interview-divider" />


        {/* ── Center Content ── */}
        <main className="interview-content">
          {activeNav === "technical" && (
            <section>
              <div className="content-header">
                <h2>Technical Questions</h2>
                <span className="content-header__count">
                  {technicalQuestions.length} questions
                </span>
              </div>
              <div className="q-list">
                {technicalQuestions.map((q, i) => (
                  <QuestionCard key={i} item={q} index={i} />
                ))}
              </div>
            </section>
          )}

          {activeNav === "behavioral" && (
            <section>
              <div className="content-header">
                <h2>Behavioral Questions</h2>
                <span className="content-header__count">
                  {behavioralQuestions.length} questions
                </span>
              </div>
              <div className="q-list">
                {behavioralQuestions.map((q, i) => (
                  <QuestionCard key={i} item={q} index={i} />
                ))}
              </div>
            </section>
          )}

          {activeNav === "roadmap" && (
            <section>
              <div className="content-header">
                <h2>Preparation Road Map</h2>
                <span className="content-header__count">
                  {preparationPlan.length}-day plan
                </span>
              </div>
              <div className="roadmap-list">
                {preparationPlan.map((day, idx) => (
                  <RoadMapDay key={day?.day ?? idx} day={day} />
                ))}
              </div>
            </section>
          )}
        </main>

        <div className="interview-divider" />

        {/* ── Right Sidebar ── */}
        <aside className="interview-sidebar">
          {/* Match Score */}
          <div className="match-score">
            <p className="match-score__label">Match Score</p>
            <div className={`match-score__ring ${scoreColor}`}>
              <span className="match-score__value">{matchScore}</span>
              <span className="match-score__pct">%</span>
            </div>
            <p className="match-score__sub">
              {matchScore >= 80
                ? "Strong match for this role"
                : matchScore >= 60
                  ? "Moderate match for this role"
                  : "Needs preparation for this role"}
            </p>
          </div>

          <div className="sidebar-divider" />

          {/* Skill Gaps */}
          <div className="skill-gaps">
            <p className="skill-gaps__label">Skill Gaps</p>
            <div className="skill-gaps__list">
              {skillGaps.map((gap, i) => (
                <span
                  key={i}
                  className={`skill-tag skill-tag--${gap?.severity || "low"}`}
                >
                  {gap?.skill}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="delete-modal-overlay"
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal__icon">
              <Trash2 size={24} />
            </div>

            <div className="delete-modal__header">
              <h3>Delete Interview Preparation Plan</h3>
              <p>
                Are you sure you want to permanently delete this interview strategy? All technical questions, behavioral frameworks, and roadmap milestone checklist progress will be removed.
              </p>
            </div>

            <div className="delete-modal__target">
              <span>{report?.title || "Custom Interview Strategy"}</span>
            </div>

            <div className="delete-modal__actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-btn"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                <Trash2 size={14} />
                <span>{isDeleting ? "Deleting..." : "Delete Plan"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Non-blocking Plan Creation Banner */}
      {creationToast && (
        <div className="ats-creation-toast">
          <div className="ats-creation-toast__icon">
            <Sparkles size={18} />
          </div>
          <div className="ats-creation-toast__content">
            <strong>Plan created successfully!</strong>
            <span>We're preparing your ATS-tailored resume in the background.</span>
          </div>
          <button
            type="button"
            className="ats-creation-toast__close"
            onClick={() => setCreationToast("")}
          >
            &times;
          </button>
        </div>
      )}

      {/* Toast Notifications */}
      {downloadSuccessMessage && (
        <Toast
          message={downloadSuccessMessage}
          type="success"
          onClose={() => setDownloadSuccessMessage("")}
        />
      )}

      {downloadErrorMessage && (
        <Toast
          message={downloadErrorMessage}
          type="error"
          onClose={() => setDownloadErrorMessage("")}
        />
      )}
    </div>
  );
};


export default Interview;
