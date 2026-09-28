import React, { useState } from "react";
import { Link } from "react-router";
import {
  FileText,
  Search,
  Calendar,
  ExternalLink,
  Download,
  Plus,
  Loader2,
  RotateCcw,
  Sparkles,
} from "../../../components/ui/Icons";

const RecentInterviews = ({
  reports = [],
  onDownloadResume,
  onRetryResume,
  downloadingId = null,
  retryingId = null,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReports = reports.filter((item) =>
    (item.title || "Untitled Position")
      .toLowerCase()
      .includes(searchTerm.toLowerCase().trim())
  );

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(d);
    } catch (e) {
      return "Recently";
    }
  };

  const getScoreClass = (score) => {
    if (score >= 80) return "score-pill--high";
    if (score >= 60) return "score-pill--mid";
    return "score-pill--low";
  };

  return (
    <div className="dash-card recent-interviews">
      <div className="dash-card__header">
        <div className="header-title-group">
          <h2>Recent Interview Plans</h2>
          <span className="count-badge">{reports.length}</span>
        </div>
        <Link to="/interview/history" className="header-action">
          <span>View All History &rarr;</span>
        </Link>
      </div>

      <div className="dash-card__body">
        {/* Search Bar if reports exist */}
        {reports.length > 0 && (
          <div className="search-bar">
            <span className="search-icon">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search by role or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {/* List of reports / loading / empty */}
        {loading && reports.length === 0 ? (
          <div className="dash-empty-state" style={{ padding: "2.5rem 1.5rem" }}>
            <Loader2 size={24} className="spin-loader" style={{ color: "#ff2d78", margin: "0 auto" }} />
            <h3 style={{ marginTop: "0.75rem" }}>Loading interview plans...</h3>
            <p>Retrieving your recent interview strategies.</p>
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="interview-list">
            {filteredReports.map((report) => (
              <div key={report._id} className="interview-row">
                <div className="interview-row__info">
                  <h3 className="title">{report.title || "Target Position Plan"}</h3>
                  <div className="meta">
                    <span className="date">
                      <Calendar size={13} />
                      {formatDate(report.createdAt)}
                    </span>
                    <span>•</span>
                    <span>Role ID: #{report._id.substring(report._id.length - 6)}</span>
                  </div>
                </div>

                <div className="interview-row__actions">
                  <div className={`score-pill ${getScoreClass(report.matchScore)}`}>
                    <span>{report.matchScore ?? 0}%</span>
                    <span style={{ fontSize: "0.68rem", opacity: 0.85 }}>match</span>
                  </div>

                  {report.atsResume?.status === "generating" ? (
                    <button
                      type="button"
                      className="action-btn"
                      disabled
                      title="ATS resume is currently preparing in the background"
                      style={{ opacity: 0.75, cursor: "not-allowed" }}
                      aria-busy="true"
                    >
                      <Loader2 size={14} className="spin-loader" />
                      <span>Preparing...</span>
                    </button>
                  ) : report.atsResume?.status === "ready" ? (
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => onDownloadResume(report._id)}
                      title="Download Tailored ATS Resume PDF"
                      disabled={downloadingId === report._id}
                      aria-busy={downloadingId === report._id}
                    >
                      {downloadingId === report._id ? (
                        <>
                          <Loader2 size={14} className="spin-loader" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download size={14} />
                          <span>Download Resume</span>
                        </>
                      )}
                    </button>
                  ) : report.atsResume?.status === "failed" ? (
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() =>
                        onRetryResume
                          ? onRetryResume(report._id)
                          : onDownloadResume(report._id)
                      }
                      title="Resume generation failed. Click to retry"
                      disabled={retryingId === report._id}
                      aria-busy={retryingId === report._id}
                      style={{
                        color: "#f87171",
                        borderColor: "rgba(239, 68, 68, 0.3)",
                      }}
                    >
                      {retryingId === report._id ? (
                        <>
                          <Loader2 size={14} className="spin-loader" />
                          <span>Retrying...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw size={14} />
                          <span>Retry</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() =>
                        onRetryResume
                          ? onRetryResume(report._id)
                          : onDownloadResume(report._id)
                      }
                      title="Generate Tailored ATS Resume"
                      disabled={retryingId === report._id}
                      aria-busy={retryingId === report._id}
                    >
                      {retryingId === report._id ? (
                        <>
                          <Loader2 size={14} className="spin-loader" />
                          <span>Preparing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          <span>Generate Resume</span>
                        </>
                      )}
                    </button>
                  )}

                  <Link
                    to={`/interview/${report._id}`}
                    className="action-btn action-btn--primary"
                    title="Open Detailed Strategy & Road Map"
                  >
                    <span>View Plan</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : reports.length > 0 ? (
          // Search returned 0 matches
          <div className="dash-empty-state">
            <div className="dash-empty-state__icon">
              <Search size={22} />
            </div>
            <h3>No matching plans found</h3>
            <p>No interview plans match "{searchTerm}". Try a different search query.</p>
          </div>
        ) : (
          // Total 0 reports empty state
          <div className="dash-empty-state">
            <div className="dash-empty-state__icon">
              <FileText size={24} />
            </div>
            <h3>No interview plans created yet</h3>
            <p>
              Paste any job description and upload your resume to generate a complete technical & behavioral interview roadmap.
            </p>
            <Link to="/create" className="empty-cta-btn">
              <Plus size={16} />
              <span>Create Your First Plan</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentInterviews;
