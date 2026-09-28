import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router";
import { useInterview } from "../../interview/hooks/useInterview";
import { getInterviewReportById } from "../../interview/services/interview.api";
import {
  saveStagedResume,
  getStagedResume,
  clearStagedResume,
} from "../../interview/services/resumeStorage";
import "../resume.scss";
import {
  FileCheck,
  Download,
  FileText,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Plus,
  X,
  Target,
  AlertCircle,
  RotateCcw,
  Loader2,
} from "../../../components/ui/Icons";
import { getAtsResumeStatus } from "../../interview/services/interview.api";
import Toast from "../../../components/ui/Toast";

const ResumeManager = () => {
  const {
    reports,
    getReports,
    getResumePdf,
    retryResume,
    stagedResumeFile,
    setStagedResumeFile,
  } = useInterview();

  const [activeReportDetails, setActiveReportDetails] = useState(null);
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState("");
  const [downloadErrorMessage, setDownloadErrorMessage] = useState("");

  // Staged upload state for replace / update
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const resumeInputRef = useRef();

  useEffect(() => {
    getReports();
  }, []);

  // Sync staged resume file from in-memory context only (never restore across page refreshes)
  useEffect(() => {
    const isReload = (() => {
      try {
        const navEntry = window.performance?.getEntriesByType?.("navigation")?.[0];
        if (navEntry) return navEntry.type === "reload";
        return window.performance?.navigation?.type === 1;
      } catch (e) {
        return false;
      }
    })();

    if (isReload) {
      setSelectedFile(null);
      setStagedResumeFile(null);
      clearStagedResume();
    } else if (stagedResumeFile && !selectedFile) {
      setSelectedFile(stagedResumeFile);
    }
  }, [stagedResumeFile]);

  // Fetch full details of the latest report to get parsed resume text and skill gaps
  useEffect(() => {
    let isCurrent = true;
    const fetchLatestDetails = async () => {
      if (reports && reports.length > 0) {
        const latestId = reports[0]._id;
        try {
          const res = await getInterviewReportById(latestId);
          if (isCurrent && res?.interviewReport) {
            setActiveReportDetails(res.interviewReport);
          }
        } catch (err) {
          console.error("Failed to fetch resume details:", err);
        }
      }
    };

    fetchLatestDetails();

    return () => {
      isCurrent = false;
    };
  }, [reports]);

  // Background polling if active resume is in generating state
  useEffect(() => {
    if (activeReportDetails?.atsResume?.status !== "generating" || !activeReportDetails?._id) {
      return;
    }

    const timer = setInterval(async () => {
      try {
        const res = await getAtsResumeStatus(activeReportDetails._id);
        if (res?.status && res.status !== "generating") {
          setActiveReportDetails((prev) =>
            prev
              ? {
                  ...prev,
                  atsResume: {
                    ...(prev.atsResume || {}),
                    status: res.status,
                    generatedAt: res.generatedAt,
                    errorMessage: res.errorMessage,
                  },
                }
              : prev
          );
          getReports();
        }
      } catch (err) {
        // ignore
      }
    }, 3500);

    return () => clearInterval(timer);
  }, [activeReportDetails?.atsResume?.status, activeReportDetails?._id]);

  // File dropzone handlers (syncing to context & IndexedDB)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setStagedResumeFile(file);
      saveStagedResume(file);
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
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleDownload = async () => {
    const reportId = activeReportDetails?._id || reports[0]?._id;
    if (!reportId || isDownloading) return;
    setIsDownloading(true);
    setDownloadSuccessMessage("");
    setDownloadErrorMessage("");
    try {
      await getResumePdf(reportId);
      setDownloadSuccessMessage("ATS Resume downloaded successfully");
    } catch (err) {
      console.error("Error downloading resume PDF:", err);
      setDownloadErrorMessage(
        err?.message || "Failed to download your resume PDF. Please try again shortly."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRetry = async () => {
    const reportId = activeReportDetails?._id || reports[0]?._id;
    if (!reportId || isRetrying) return;
    setIsRetrying(true);
    setDownloadSuccessMessage("");
    setDownloadErrorMessage("");
    try {
      await retryResume(reportId);
      setDownloadSuccessMessage("Preparing ATS resume in background...");
      setActiveReportDetails((prev) =>
        prev
          ? {
              ...prev,
              atsResume: {
                ...(prev.atsResume || {}),
                status: "generating",
                errorMessage: null,
              },
            }
          : prev
      );
      getReports();
    } catch (err) {
      console.error("Error retrying resume:", err);
      setDownloadErrorMessage(
        err?.message || "Failed to restart resume generation."
      );
    } finally {
      setIsRetrying(false);
    }
  };

  // Metrics derived from real parsed resume text
  const resumeText = activeReportDetails?.resume || "";
  const wordCount = resumeText
    ? resumeText.split(/\s+/).filter(Boolean).length
    : 0;
  const charCount = resumeText ? resumeText.length : 0;
  const readingTime = wordCount > 0 ? Math.max(1, Math.round(wordCount / 200)) : 0;

  const hasActiveResume = Boolean(resumeText || reports.length > 0);
  const skillGaps = activeReportDetails?.skillGaps || [];

  return (
    <div className="resume-page">
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

      {/* ── Page Header ── */}
      <header className="resume-header">
        <div className="resume-header__left">
          <span className="header-badge">
            <FileCheck size={14} />
            Career Assets
          </span>
          <h1>Resume Management</h1>
          <p>
            Inspect your active resume extraction, download tailored ATS-friendly versions, or update your profile for new interviews.
          </p>
        </div>

        <div className="resume-header__status">
          <div className="status-badge-wrap">
            <span className="status-dot" />
            <span>{hasActiveResume ? "Active Resume Profile" : "No Resume Uploaded"}</span>
          </div>
        </div>
      </header>

      {/* ── Main 2-Column Grid ── */}
      <div className="resume-grid">
        {/* Left Column: Active Resume & Upload Area */}
        <div className="resume-column">
          {/* Active Resume Card */}
          {hasActiveResume ? (
            <div className="active-resume-card">
              <div className="active-resume-card__header">
                <div className="file-title-group">
                  <div className="doc-icon">
                    <FileText size={22} />
                  </div>
                  <div className="file-info">
                    <h2 className="filename">
                      {activeReportDetails?.title
                        ? `Candidate_Resume_${activeReportDetails.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`
                        : "Active_Candidate_Resume.pdf"}
                    </h2>
                    <span className="meta">
                      Linked to strategy: #{reports[0]?._id?.substring(reports[0]._id.length - 6)} • Uploaded{" "}
                      {new Date(reports[0]?.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <span className="format-tag">ATS Validated</span>
              </div>

              {/* Metrics */}
              <div className="active-resume-card__metrics">
                <div className="metric-cell">
                  <span className="metric-label">Extracted Words</span>
                  <span className="metric-value">
                    {wordCount > 0 ? wordCount.toLocaleString() : "--"}
                  </span>
                </div>
                <div className="metric-cell">
                  <span className="metric-label">Characters</span>
                  <span className="metric-value">
                    {charCount > 0 ? charCount.toLocaleString() : "--"}
                  </span>
                </div>
                <div className="metric-cell">
                  <span className="metric-label">Est. Read Time</span>
                  <span className="metric-value">
                    {readingTime > 0 ? `${readingTime} min` : "--"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="active-resume-card__actions">
                <div className="btn-group">
                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => setShowTextPreview((prev) => !prev)}
                  >
                    {showTextPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span>{showTextPreview ? "Hide Extracted Text" : "View Parsed Text"}</span>
                  </button>

                  {activeReportDetails?.atsResume?.status === "generating" ? (
                    <button
                      type="button"
                      className="action-btn"
                      disabled
                      style={{ opacity: 0.75, cursor: "not-allowed" }}
                      title="ATS resume is currently preparing in the background"
                      aria-busy="true"
                    >
                      <Loader2 size={16} className="spin-loader" />
                      <span>Preparing ATS Resume...</span>
                    </button>
                  ) : activeReportDetails?.atsResume?.status === "ready" ? (
                    <button
                      type="button"
                      className="action-btn action-btn--primary"
                      onClick={handleDownload}
                      disabled={isDownloading}
                      aria-busy={isDownloading}
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 size={16} className="spin-loader" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          <span>Download ATS Tailored PDF</span>
                        </>
                      )}
                    </button>
                  ) : activeReportDetails?.atsResume?.status === "failed" ? (
                    <button
                      type="button"
                      className="action-btn"
                      onClick={handleRetry}
                      disabled={isRetrying}
                      aria-busy={isRetrying}
                      style={{
                        color: "#f87171",
                        borderColor: "rgba(239, 68, 68, 0.3)",
                      }}
                      title="Resume generation failed. Click to retry"
                    >
                      {isRetrying ? (
                        <>
                          <Loader2 size={16} className="spin-loader" />
                          <span>Retrying...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw size={16} />
                          <span>Retry Generation</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="action-btn action-btn--primary"
                      onClick={handleRetry}
                      disabled={isRetrying}
                      aria-busy={isRetrying}
                    >
                      {isRetrying ? (
                        <>
                          <Loader2 size={16} className="spin-loader" />
                          <span>Preparing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          <span>Generate ATS Resume</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Text Preview Drawer */}
              {showTextPreview && (
                <div className="extracted-text-viewer">
                  <div className="viewer-header">
                    <h3>Raw Extracted Content (Used by AI Engine)</h3>
                    <span>Extracted via PDF-Parse engine</span>
                  </div>
                  <div className="text-box">
                    {resumeText || "No text available in report."}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Zero Resume State
            <div className="dash-empty-state active-resume-card" style={{ padding: "3rem 1.5rem" }}>
              <div className="dash-empty-state__icon">
                <FileText size={26} />
              </div>
              <h3>No resume uploaded yet.</h3>
              <p>
                Upload your resume to analyze it and create ATS-tailored versions.
              </p>
            </div>
          )}

          {/* Upload / Replace Resume Dropzone */}
          <div className="upload-replace-card">
            <div className="card-header">
              <h2>{hasActiveResume ? "Replace / Update Resume" : "Upload Candidate Resume"}</h2>
              <p>Upload a new PDF or DOCX file to update your active profile or stage it for your next interview strategy.</p>
            </div>

            <label
              className={`resume-dropzone ${selectedFile ? "resume-dropzone--uploaded" : ""} ${
                isDragging ? "resume-dropzone--dragging" : ""
              }`}
              htmlFor="resume-manager-upload"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="staged-file-row">
                  <div className="staged-icon">
                    <CheckCircle2 size={26} />
                  </div>
                  <div className="staged-info">
                    <span className="name">{selectedFile.name}</span>
                    <span className="size">
                      {formatFileSize(selectedFile.size)} • Click to replace file
                    </span>
                  </div>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={handleRemoveFile}
                    title="Remove file"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="dropzone-icon">
                    <FileText size={26} />
                  </div>
                  <p className="dropzone-title">Click to upload or drag & drop</p>
                  <p className="dropzone-sub">PDF or DOCX (Max 5MB)</p>
                </>
              )}
              <input
                ref={resumeInputRef}
                hidden
                type="file"
                id="resume-manager-upload"
                name="resume"
                accept=".pdf,.docx"
                onChange={handleFileChange}
              />
            </label>

            {selectedFile && (
              <div className="upload-confirm-bar">
                <span className="staged-notice">
                  <CheckCircle2 size={16} />
                  Ready to analyze for next application
                </span>
                <Link
                  to="/create"
                  state={{ resumeFile: selectedFile }}
                  className="apply-btn"
                  onClick={() => {
                    setStagedResumeFile(selectedFile);
                    saveStagedResume(selectedFile);
                  }}
                >
                  <Sparkles size={16} />
                  <span>Create Plan With This Resume</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Status & Analysis */}
        <div className="resume-column">
          {/* Resume Health & Status Checklist */}
          <div className="resume-side-card">
            <div className="resume-side-card__header">
              <h3>Resume Health & Readiness</h3>
            </div>
            <div className="resume-side-card__body">
              <div className="status-checks">
                <div className="check-item">
                  <div className="icon-wrap">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="check-text">
                    <span className="title">ATS Parsable Format</span>
                    <span className="desc">Text structure is extractable by applicant tracking algorithms.</span>
                  </div>
                </div>

                <div className="check-item">
                  <div className="icon-wrap">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="check-text">
                    <span className="title">Gemini AI Strategy Compatible</span>
                    <span className="desc">Ready for structured technical and behavioral interview generation.</span>
                  </div>
                </div>

                <div className="check-item">
                  <div className="icon-wrap">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="check-text">
                    <span className="title">PDF Export Engine Ready</span>
                    <span className="desc">Puppeteer template builder ready to generate tailored PDF downloads.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Basic Resume Analysis: Detected Skill Gaps */}
          <div className="resume-side-card">
            <div className="resume-side-card__header">
              <h3>Identified Skill Gaps (Latest Role)</h3>
            </div>
            <div className="resume-side-card__body">
              {skillGaps.length > 0 ? (
                <div className="gaps-container">
                  <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>
                    Skills identified by Gemini AI that need preparation for your target role:
                  </p>
                  <div className="gaps-list">
                    {skillGaps.map((gap, idx) => (
                      <span
                        key={idx}
                        className={`gap-pill gap-pill--${gap?.severity || "low"}`}
                      >
                        {gap?.skill} ({gap?.severity})
                      </span>
                    ))}
                  </div>
                </div>
              ) : hasActiveResume ? (
                <div style={{ fontSize: "0.825rem", color: "#94a3b8", lineHeight: 1.5 }}>
                  No significant skill gaps were flagged in your most recent evaluation, or a new evaluation is pending.
                </div>
              ) : (
                <div style={{ fontSize: "0.825rem", color: "#64748b", lineHeight: 1.5 }}>
                  Skill gap breakdown will automatically appear once you create an interview plan.
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Box */}
          <div
            className="resume-side-card"
            style={{
              background: "linear-gradient(135deg, rgba(255, 45, 120, 0.08) 0%, rgba(20, 27, 39, 0.95) 100%)",
              border: "1px solid rgba(255, 45, 120, 0.25)",
            }}
          >
            <div className="resume-side-card__body" style={{ gap: "0.75rem" }}>
              <h3 style={{ fontSize: "0.95rem", color: "#ffffff", margin: 0, fontWeight: 700 }}>
                Prepare for a New Role
              </h3>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                Tailor your preparation and generate a fresh ATS resume customized for any specific job description.
              </p>
              <Link
                to="/create"
                state={selectedFile ? { resumeFile: selectedFile } : undefined}
                className="action-btn action-btn--primary"
                onClick={() => {
                  if (selectedFile) {
                    setStagedResumeFile(selectedFile);
                    saveStagedResume(selectedFile);
                  }
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "0.25rem",
                  padding: "0.7rem",
                  textDecoration: "none",
                }}
              >
                <Sparkles size={16} />
                <span>Launch New Plan</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeManager;
