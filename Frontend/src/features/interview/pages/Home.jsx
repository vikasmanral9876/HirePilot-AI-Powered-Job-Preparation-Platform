/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useRef, useEffect } from "react";
import "../style/home.scss";
import { useInterview } from "../hooks/useInterview.js";
import { useNavigate, useLocation } from "react-router";
import {
  saveStagedResume,
  clearStagedResume,
} from "../services/resumeStorage.js";
import {
  AlertCircle,
  RotateCcw,
  X,
  Loader2,
  Sparkles,
} from "../../../components/ui/Icons";
import Toast from "../../../components/ui/Toast";

let documentReloadDecision;
let documentReloadDecisionConsumed = false;

const getDocumentReloadDecision = () => {
  if (documentReloadDecisionConsumed) return false;
  if (documentReloadDecision === undefined) {
    try {
      const navEntry = window.performance?.getEntriesByType?.("navigation")?.[0];
      documentReloadDecision = navEntry
        ? navEntry.type === "reload"
        : window.performance?.navigation?.type === 1;
    } catch {
      documentReloadDecision = false;
    }
  }
  return documentReloadDecision;
};

const Home = () => {
  const location = useLocation();
  const {
    loading,
    generateReport,
    reports,
    stagedResumeFile,
    setStagedResumeFile,
  } = useInterview();
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(() => {
    if (getDocumentReloadDecision()) return null;
    return location.state?.resumeFile || stagedResumeFile || null;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState("");
  const [errorToast, setErrorToast] = useState("");
  const resumeInputRef = useRef();

  const navigate = useNavigate();

  // One-time initialization on initial mount: reset staged resume if page was reloaded
  useEffect(() => {
    const isReload = getDocumentReloadDecision();
    documentReloadDecisionConsumed = true;

    if (isReload) {
      setStagedResumeFile(null);
      clearStagedResume();
      if (resumeInputRef.current) {
        resumeInputRef.current.value = "";
      }
      if (window.history?.replaceState) {
        window.history.replaceState({}, document.title);
      }
      return;
    }

    if (location.state?.resumeFile) {
      setSelectedFile(location.state.resumeFile);
    }
  }, [location.state, setStagedResumeFile]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setStagedResumeFile(file);
      saveStagedResume(file);
      setErrorMessage("");
    }
  };

  const handleRemoveFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFile(null);
    setStagedResumeFile(null);
    clearStagedResume();
    if (resumeInputRef.current) {
      resumeInputRef.current.value = "";
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setStagedResumeFile(file);
      saveStagedResume(file);
      setErrorMessage("");
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleGenerateReport = async () => {
    if (isSubmitting || loading) return;
    setErrorMessage("");
    setErrorToast("");
    setIsQuotaError(false);

    const resumeFile = selectedFile || resumeInputRef.current?.files?.[0];
    if (!resumeFile) {
      const msg = "Please upload your resume (PDF) before generating the plan.";
      setErrorMessage(msg);
      setErrorToast(msg);
      return;
    }
    if (!jobDescription || !jobDescription.trim()) {
      const msg = "Please paste the job description to tailor your preparation plan.";
      setErrorMessage(msg);
      setErrorToast(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await generateReport({
        jobDescription: jobDescription.trim(),
        selfDescription: selfDescription.trim(),
        resumeFile,
      });
      if (data?._id) {
        // Reset resume state and inputs immediately after successful generation
        setSelectedFile(null);
        setStagedResumeFile(null);
        clearStagedResume();
        setJobDescription("");
        setSelfDescription("");
        if (resumeInputRef.current) {
          resumeInputRef.current.value = "";
        }
        if (window.history?.replaceState) {
          window.history.replaceState({}, document.title);
        }

        setSuccessToast("Interview plan created successfully.");
        navigate(`/interview/${data._id}`, { state: { newPlanCreated: true } });
      }
    } catch (err) {
      console.error("Failed to generate interview strategy:", err?.message || err);
      const isValidation =
        err?.message?.includes("Please upload your resume") ||
        err?.message?.includes("Invalid or corrupted PDF") ||
        err?.message?.includes("Could not extract readable text") ||
        err?.message?.includes("Resume file (PDF) is required");

      const safeMsg = isValidation
        ? err.message
        : "We're temporarily unable to generate your interview plan. Please try again later.";

      setErrorMessage(safeMsg);
      setErrorToast(safeMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="home-page">
      {/* Toast Notifications */}
      {successToast && (
        <Toast
          message={successToast}
          type="success"
          onClose={() => setSuccessToast("")}
        />
      )}
      {errorToast && (
        <Toast
          message={errorToast}
          type="error"
          onClose={() => setErrorToast("")}
        />
      )}

      {/* Page Header */}
      <header className="page-header">
        <h1>
          Create Your Custom <span className="highlight">Interview Plan</span>
        </h1>
        <p>
          Let our AI analyze the job requirements and your unique profile to
          build a winning strategy.
        </p>
      </header>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="home-error-banner" role="alert">
          <div className="home-error-banner__left">
            <div className="home-error-banner__icon">
              <AlertCircle size={20} />
            </div>
            <div className="home-error-banner__content">
              {errorMessage === "We're temporarily unable to generate your interview plan. Please try again later." ? (
                <>
                  <strong className="home-error-banner__title">
                    We're temporarily unable to generate your interview plan.
                  </strong>
                  <span className="home-error-banner__desc">Please try again later.</span>
                </>
              ) : (
                <span className="home-error-banner__text">{errorMessage}</span>
              )}
            </div>
          </div>

          <div className="home-error-banner__actions">
            {errorMessage === "We're temporarily unable to generate your interview plan. Please try again later." && (
              <button
                type="button"
                onClick={handleGenerateReport}
                className="home-error-banner__retry-btn"
                disabled={isSubmitting || loading}
              >
                <RotateCcw size={14} />
                <span>Try Again</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                setErrorToast("");
                setIsQuotaError(false);
              }}
              className="home-error-banner__close-btn"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="interview-card">
        <div className="interview-card__body">
          {/* Left Panel - Job Description */}
          <div className="panel panel--left">
            <div className="panel__header">
              <span className="panel__icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </span>
              <h2>Target Job Description</h2>
              <span className="badge badge--required">Required</span>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value);
              }}
              className="panel__textarea"
              placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
              maxLength={5000}
              disabled={isSubmitting || loading}
            />
            <div className="char-counter">
              {jobDescription.length} / 5000 chars
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="panel-divider" />

          {/* Right Panel - Profile */}
          <div className="panel panel--right">
            <div className="panel__header">
              <span className="panel__icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <h2>Your Profile</h2>
            </div>

            {/* Upload Resume */}
            <div className="upload-section">
              <label className="section-label">
                Upload Resume
                <span className="badge badge--best">Best Results</span>
              </label>
              <label
                className={`dropzone ${selectedFile ? "dropzone--uploaded" : ""} ${isDragging ? "dropzone--dragging" : ""}`}
                htmlFor="resume"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="dropzone__uploaded">
                    <span className="dropzone__file-icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M9 15l2 2 4-4" />
                      </svg>
                    </span>
                    <div className="dropzone__file-info">
                      <p className="dropzone__file-name" title={selectedFile.name}>
                        {selectedFile.name}
                      </p>
                      <span className="dropzone__file-size">
                        {formatFileSize(selectedFile.size)} • Click to replace
                      </span>
                    </div>
                    <button
                      type="button"
                      className="dropzone__remove-btn"
                      onClick={handleRemoveFile}
                      title="Remove file"
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
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="dropzone__icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="16 16 12 12 8 16" />
                        <line x1="12" y1="12" x2="12" y2="21" />
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                      </svg>
                    </span>
                    <p className="dropzone__title">
                      Click to upload or drag &amp; drop
                    </p>
                    <p className="dropzone__subtitle">PDF or DOCX (Max 5MB)</p>
                  </>
                )}
                <input
                  ref={resumeInputRef}
                  hidden
                  type="file"
                  id="resume"
                  name="resume"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {/* OR Divider */}
            <div className="or-divider">
              <span>OR</span>
            </div>

            {/* Quick Self-Description */}
            <div className="self-description">
              <label className="section-label" htmlFor="selfDescription">
                Quick Self-Description
              </label>
              <textarea
                onChange={(e) => {
                  setSelfDescription(e.target.value);
                }}
                id="selfDescription"
                name="selfDescription"
                className="panel__textarea panel__textarea--short"
                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                disabled={isSubmitting || loading}
              />
            </div>

            {/* Info Box */}
            <div className="info-box">
              <span className="info-box__icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line
                    x1="12"
                    y1="8"
                    x2="12"
                    y2="12"
                    stroke="#1a1f27"
                    strokeWidth="2"
                  />
                  <line
                    x1="12"
                    y1="16"
                    x2="12.01"
                    y2="16"
                    stroke="#1a1f27"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              <p>
                Either a <strong>Resume</strong> or a{" "}
                <strong>Self Description</strong> is required to generate a
                personalized plan.
              </p>
            </div>
          </div>
        </div>

        {/* Contextual Generation Status */}
        {(isSubmitting || loading) && (
          <div className="plan-creation-status" role="status" aria-live="polite">
            <Loader2 size={16} className="spin-loader" />
            <span>Analyzing role requirements & synthesizing tailored preparation plan...</span>
          </div>
        )}

        {/* Card Footer */}
        <div className="interview-card__footer">
          <span className="footer-info">
            AI-Powered Strategy Generation &bull; Approx 30s
          </span>
          <button
            type="button"
            onClick={handleGenerateReport}
            className="generate-btn"
            disabled={isSubmitting || loading}
            aria-busy={isSubmitting || loading}
          >
            {isSubmitting || loading ? (
              <>
                <Loader2 size={16} className="spin-loader" />
                <span>Creating Interview Plan...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Create Interview Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Reports List */}
      {reports?.length > 0 && (
        <section className="recent-reports">
          <h2>My Recent Interview Plans</h2>
          <ul className="reports-list">
            {reports.map((report) => (
              <li
                key={report._id}
                className="report-item"
                onClick={() => navigate(`/interview/${report._id}`)}
              >
                <h3>{report.title || "Untitled Position"}</h3>
                <p className="report-meta">
                  Generated on {new Date(report.createdAt).toLocaleDateString()}
                </p>
                <p
                  className={`match-score ${report.matchScore >= 80 ? "score--high" : report.matchScore >= 60 ? "score--mid" : "score--low"}`}
                >
                  Match Score: {report.matchScore}%
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default Home;
