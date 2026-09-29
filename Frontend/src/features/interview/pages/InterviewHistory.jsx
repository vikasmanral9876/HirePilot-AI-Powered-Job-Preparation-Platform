import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router";
import { useInterview } from "../hooks/useInterview";
import "../style/history.scss";
import {
  FileText,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Calendar,
  ExternalLink,
  Download,
  Plus,
  Briefcase,
  Layers,
  X,
  Trash2,
  Loader2,
  Sparkles,
} from "../../../components/ui/Icons";
import { getAtsResumeStatus } from "../services/interview.api";
import Toast from "../../../components/ui/Toast";

const parseRoleAndCompany = (rawTitle) => {
  if (!rawTitle) return { role: "Target Position", company: "Target Employer" };

  const atRegex = /\s+(?:at|@)\s+/i;
  const dashRegex = /\s+-\s+/;

  if (atRegex.test(rawTitle)) {
    const parts = rawTitle.split(atRegex);
    return {
      role: parts[0]?.trim() || "Target Position",
      company: parts[1]?.trim() || "Target Employer",
    };
  }

  if (dashRegex.test(rawTitle)) {
    const parts = rawTitle.split(dashRegex);
    return {
      role: parts[0]?.trim() || "Target Position",
      company: parts[1]?.trim() || "Target Employer",
    };
  }

  return {
    role: rawTitle.trim(),
    company: "Target Employer",
  };
};

const getStatus = (score) => {
  const num = Number(score) || 0;
  if (num >= 80) return { label: "Ready", key: "ready", class: "status-badge--ready" };
  if (num >= 60) return { label: "In Progress", key: "in-progress", class: "status-badge--in-progress" };
  return { label: "Needs Prep", key: "prep-needed", class: "status-badge--prep-needed" };
};

const InterviewHistory = () => {
  const { reports, getReports, getResumePdf, retryResume, deleteReport, loading, pagination } = useInterview();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [downloadingIds, setDownloadingIds] = useState(() => new Set());
  const [retryingIds, setRetryingIds] = useState(() => new Set());
  const [deleteModalPlan, setDeleteModalPlan] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });

  useEffect(() => {
    getReports();
  }, []);

  // Background polling for any reports currently in "generating" state
  useEffect(() => {
    const generatingReports = reports.filter(
      (r) => r.atsResume?.status === "generating"
    );
    if (generatingReports.length === 0) return;

    const timer = setInterval(async () => {
      let shouldRefresh = false;
      for (const r of generatingReports) {
        try {
          const res = await getAtsResumeStatus(r._id);
          if (res?.status && res.status !== "generating") {
            shouldRefresh = true;
          }
        } catch {
          // ignore
        }
      }
      if (shouldRefresh) {
        getReports();
      }
    }, 3500);

    return () => clearInterval(timer);
  }, [reports]);

  const handleDeletePlan = async () => {
    if (!deleteModalPlan) return;
    setIsDeleting(true);
    try {
      await deleteReport(deleteModalPlan._id);
      setToast({
        message: `Deleted interview plan "${deleteModalPlan.title}"`,
        type: "success",
      });
      setDeleteModalPlan(null);
    } catch (err) {
      console.error("Failed to delete interview plan:", err);
      setToast({
        message: err?.message || "Failed to delete interview plan.",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (reportId) => {
    if (!reportId || downloadingIds.has(reportId)) return;
    setDownloadingIds((prev) => new Set(prev).add(reportId));
    try {
      await getResumePdf(reportId);
      setToast({
        message: "ATS Resume downloaded successfully",
        type: "success",
      });
    } catch (err) {
      console.error("Error downloading resume:", err);
      setToast({
        message: err?.message || "Failed to download resume. Please try again.",
        type: "error",
      });
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    }
  };

  const handleRetry = async (reportId) => {
    if (!reportId || retryingIds.has(reportId)) return;
    setRetryingIds((prev) => new Set(prev).add(reportId));
    try {
      await retryResume(reportId);
      setToast({
        message: "Preparing ATS resume in background...",
        type: "info",
      });
      getReports();
    } catch (err) {
      console.error("Error retrying resume:", err);
      setToast({
        message: err?.message || "Failed to restart resume generation.",
        type: "error",
      });
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    }
  };


  // Filter & Sort Logic
  const filteredAndSortedReports = useMemo(() => {
    return reports
      .filter((report) => {
        const { role, company } = parseRoleAndCompany(report.title);
        const searchTarget = `${role} ${company} ${report.title || ""}`.toLowerCase();

        // 1. Search Filter
        if (searchTerm.trim() && !searchTarget.includes(searchTerm.toLowerCase().trim())) {
          return false;
        }

        // 2. Status / Score Filter
        const status = getStatus(report.matchScore);
        if (statusFilter !== "all" && status.key !== statusFilter) {
          return false;
        }

        // 3. Type Filter
        if (typeFilter !== "all") {
          // All plans generated by HirePilot are Comprehensive
          if (typeFilter !== "comprehensive") {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const scoreA = Number(a.matchScore) || 0;
        const scoreB = Number(b.matchScore) || 0;
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        const titleA = (a.title || "").toLowerCase();
        const titleB = (b.title || "").toLowerCase();

        switch (sortBy) {
          case "oldest":
            return dateA - dateB;
          case "score-desc":
            return scoreB - scoreA;
          case "score-asc":
            return scoreA - scoreB;
          case "title-asc":
            return titleA.localeCompare(titleB);
          case "newest":
          default:
            return dateB - dateA;
        }
      });
  }, [reports, searchTerm, statusFilter, typeFilter, sortBy]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    sortBy !== "newest";

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
    setSortBy("newest");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Recently";
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return "Recently";
    }
  };

  // Metrics summary
  const totalCount = reports.length;
  const filteredCount = filteredAndSortedReports.length;
  const avgScore =
    filteredCount > 0
      ? Math.round(
          filteredAndSortedReports.reduce(
            (acc, r) => acc + (Number(r.matchScore) || 0),
            0
          ) / filteredCount
        )
      : null;
  const highMatchCount = filteredAndSortedReports.filter(
    (r) => (Number(r.matchScore) || 0) >= 80
  ).length;

  return (
    <div className="history-page">
      {/* ── Page Header ── */}
      <header className="history-header">
        <div className="history-header__left">
          <span className="header-badge">
            <FileText size={14} />
            Candidate Records
          </span>
          <h1>Interview Strategy History</h1>
          <p>
            Filter, search, and review all previous job assessments, interview questions, and tailored ATS resumes.
          </p>
        </div>

        <div className="history-header__action">
          <Link to="/create" className="create-cta-btn">
            <Plus size={16} />
            <span>Create New Plan</span>
          </Link>
        </div>
      </header>

      {/* ── Summary Metrics Bar ── */}
      <div className="history-metrics">
        <div className="metric-item">
          <span className="label">Total Strategies</span>
          <span className="value">{totalCount}</span>
          <span className="sub">Saved in account</span>
        </div>
        <div className="metric-item">
          <span className="label">Filtered Results</span>
          <span className="value">{filteredCount}</span>
          <span className="sub">Active query matches</span>
        </div>
        <div className="metric-item">
          <span className="label">Average Match Score</span>
          <span className="value">
            {avgScore !== null ? `${avgScore}%` : "--"}
          </span>
          <span className="sub">Across visible roles</span>
        </div>
        <div className="metric-item">
          <span className="label">High Match Positions</span>
          <span className="value">{highMatchCount}</span>
          <span className="sub">Score ≥ 80%</span>
        </div>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="history-toolbar">
        <div className="toolbar-row">
          {/* Search Box */}
          <div className="search-input-group">
            <span className="search-icon">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search by job title or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="filters-group">
            {/* Status / Score Filter */}
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by Status"
            >
              <option value="all">All Match Scores</option>
              <option value="ready">Ready (80%+)</option>
              <option value="in-progress">In Progress (60-79%)</option>
              <option value="prep-needed">Needs Prep (&lt;60%)</option>
            </select>

            {/* Type Filter */}
            <select
              className="filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by Interview Type"
            >
              <option value="all">All Strategy Types</option>
              <option value="comprehensive">Comprehensive (Tech + Behavioral)</option>
            </select>

            {/* Sort Options */}
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort by"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="score-desc">Sort: Highest Match Score</option>
              <option value="score-asc">Sort: Lowest Match Score</option>
              <option value="title-asc">Sort: Title A-Z</option>
            </select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                className="reset-btn"
                onClick={handleResetFilters}
                title="Reset all filters"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="active-filters-summary">
            <SlidersHorizontal size={14} />
            <span>
              Showing {filteredCount} of {totalCount} total strategies
            </span>
          </div>
        )}
      </div>

      {/* ── Data Table / Cards ── */}
      <div className="history-table-card">
        {loading && reports.length === 0 ? (
          <div className="dash-empty-state" style={{ padding: "4rem 1.5rem" }}>
            <Loader2 size={32} className="spin-loader" style={{ color: "#ff2d78", margin: "0 auto" }} />
            <h3 style={{ marginTop: "1rem" }}>Loading interview strategies...</h3>
            <p>Retrieving your saved interview roadmap records.</p>
          </div>
        ) : filteredAndSortedReports.length > 0 ? (
          <>
            <div className="table-responsive">
              <table>
                <colgroup>
                  <col className="col-w-role" />
                  <col className="col-w-company" />
                  <col className="col-w-date" />
                  <col className="col-w-type" />
                  <col className="col-w-score" />
                  <col className="col-w-readiness" />
                  <col className="col-w-actions" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Date Created</th>
                    <th>Interview Type</th>
                    <th>Match Score</th>
                    <th>Readiness</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedReports.map((report) => {
                    const { role, company } = parseRoleAndCompany(report.title);
                    const status = getStatus(report.matchScore);
                    const isDownloading = downloadingIds.has(report._id);
                    const isRetrying = retryingIds.has(report._id);
                    const scoreClass =
                      report.matchScore >= 80
                        ? "score-badge--high"
                        : report.matchScore >= 60
                        ? "score-badge--mid"
                        : "score-badge--low";

                    return (
                      <tr key={report._id}>
                        {/* Job Title */}
                        <td>
                          <div className="col-role">
                            <span className="job-title">{role}</span>
                            <span className="role-id">
                              ID: #{report._id.substring(report._id.length - 6)}
                            </span>
                          </div>
                        </td>

                        {/* Company */}
                        <td>
                          <div className="col-company">
                            <Briefcase size={14} style={{ color: "#7d8590", flexShrink: 0 }} />
                            <span>{company}</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td>
                          <div className="col-date">
                            <Calendar size={13} style={{ flexShrink: 0 }} />
                            <span>{formatDate(report.createdAt)}</span>
                          </div>
                        </td>

                        {/* Type */}
                        <td>
                          <span className="col-type">
                            <Layers size={13} style={{ flexShrink: 0 }} />
                            <span>Tech + Behavioral</span>
                          </span>
                        </td>

                        {/* Score */}
                        <td>
                          <div className="col-score">
                            <span className={`score-badge ${scoreClass}`}>
                              {report.matchScore ?? 0}%
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <div className="col-status">
                            <span className={`status-badge ${status.class}`}>
                              {status.label}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: "right" }}>
                          <div className="col-actions">
                            {report.atsResume?.status === "generating" ? (
                              <button
                                type="button"
                                className="row-btn"
                                disabled
                                style={{ opacity: 0.75, cursor: "not-allowed" }}
                                title="Preparing ATS resume in background"
                                aria-busy="true"
                              >
                                <Loader2 size={13} className="spin-loader" />
                                <span>Preparing...</span>
                              </button>
                            ) : report.atsResume?.status === "ready" ? (
                              <button
                                type="button"
                                className="row-btn"
                                onClick={() => handleDownload(report._id)}
                                title="Download tailored ATS Resume"
                                disabled={isDownloading}
                                aria-busy={isDownloading}
                              >
                                {isDownloading ? (
                                  <>
                                    <Loader2 size={13} className="spin-loader" />
                                    <span>Downloading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Download size={13} />
                                    <span>Resume</span>
                                  </>
                                )}
                              </button>
                            ) : report.atsResume?.status === "failed" ? (
                              <button
                                type="button"
                                className="row-btn"
                                onClick={() => handleRetry(report._id)}
                                title="Resume generation failed. Click to retry"
                                disabled={isRetrying}
                                aria-busy={isRetrying}
                                style={{ color: "#f87171" }}
                              >
                                {isRetrying ? (
                                  <>
                                    <Loader2 size={13} className="spin-loader" />
                                    <span>Retrying...</span>
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw size={13} />
                                    <span>Retry</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="row-btn"
                                onClick={() => handleRetry(report._id)}
                                title="Generate tailored ATS resume"
                                disabled={isRetrying}
                                aria-busy={isRetrying}
                              >
                                {isRetrying ? (
                                  <>
                                    <Loader2 size={13} className="spin-loader" />
                                    <span>Preparing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={13} />
                                    <span>Generate</span>
                                  </>
                                )}
                              </button>
                            )}

                            <Link
                              to={`/interview/${report._id}`}
                              className="row-btn row-btn--primary"
                              title="Open Strategy & Road Map"
                            >
                              <span>View Plan</span>
                              <ExternalLink size={13} />
                            </Link>

                            <button
                              type="button"
                              className="row-btn row-btn--danger"
                              onClick={() => setDeleteModalPlan(report)}
                              title="Delete interview plan"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Server Pagination Bar */}
            {pagination && pagination.totalPages > 1 && (
              <div className="history-pagination">
                <div className="history-pagination__info">
                  Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total strategies)
                </div>
                <div className="history-pagination__actions">
                  <button
                    type="button"
                    className="page-btn"
                    onClick={() => getReports({ page: pagination.page - 1, limit: pagination.limit })}
                    disabled={loading || pagination.page <= 1}
                  >
                    &larr; Previous
                  </button>
                  <button
                    type="button"
                    className="page-btn"
                    onClick={() => getReports({ page: pagination.page + 1, limit: pagination.limit })}
                    disabled={loading || pagination.page >= pagination.totalPages}
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            )}
          </>
        ) : reports.length > 0 ? (
          // Search/filter empty state
          <div className="dash-empty-state" style={{ padding: "3rem 1.5rem" }}>
            <div className="dash-empty-state__icon">
              <Search size={22} />
            </div>
            <h3>No matching interview plans</h3>
            <p>
              No strategy reports matched your search query or selected filter options.
            </p>
            <button
              type="button"
              className="empty-cta-btn"
              onClick={handleResetFilters}
            >
              <RotateCcw size={14} />
              <span>Clear Filter Criteria</span>
            </button>
          </div>
        ) : (
          // Total 0 reports empty state
          <div className="dash-empty-state" style={{ padding: "3.5rem 1.5rem" }}>
            <div className="dash-empty-state__icon">
              <FileText size={26} />
            </div>
            <h3>No interview plans yet.</h3>
            <p>
              Create your first interview plan to start preparing for your next opportunity.
            </p>
            <Link to="/create" className="empty-cta-btn">
              <Plus size={16} />
              <span>Create Interview Plan</span>
            </Link>
          </div>
        )}
      </div>

      {/* Toast Feedback */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "info" })}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalPlan && (
        <div
          className="delete-modal-overlay"
          onClick={() => !isDeleting && setDeleteModalPlan(null)}
        >
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal__icon">
              <Trash2 size={24} />
            </div>

            <div className="delete-modal__header">
              <h3>Delete Interview Preparation Plan</h3>
              <p>
                Are you sure you want to permanently delete this interview plan? This will remove all generated technical and behavioral questions, skill gap analyses, and active roadmap milestone tasks.
              </p>
            </div>

            <div className="delete-modal__target">
              <span>{deleteModalPlan.title || "Custom Interview Strategy"}</span>
            </div>

            <div className="delete-modal__actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setDeleteModalPlan(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-btn"
                onClick={handleDeletePlan}
                disabled={isDeleting}
              >
                <Trash2 size={14} />
                <span>{isDeleting ? "Deleting..." : "Delete Plan"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default InterviewHistory;
