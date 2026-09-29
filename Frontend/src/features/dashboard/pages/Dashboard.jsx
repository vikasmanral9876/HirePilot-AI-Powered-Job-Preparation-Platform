import { useEffect, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useInterview } from "../../interview/hooks/useInterview";
import { getInterviewReportById } from "../../interview/services/interview.api";
import { usePreparationProgress } from "../hooks/usePreparationProgress";
import { getAtsResumeStatus } from "../../interview/services/interview.api";
import Toast from "../../../components/ui/Toast";
import WelcomeBanner from "../components/WelcomeBanner";
import StatsGrid from "../components/StatsGrid";
import RecentInterviews from "../components/RecentInterviews";
import PreparationProgress from "../components/PreparationProgress";
import QuickActions from "../components/QuickActions";
import RecentActivity from "../components/RecentActivity";
import "../dashboard.scss";

const Dashboard = () => {
  const { user } = useAuth();
  const { reports, getReports, getResumePdf, retryResume, loading } = useInterview();

  const [activeDetailedReport, setActiveDetailedReport] = useState(null);
  const [downloadingIds, setDownloadingIds] = useState(() => new Set());
  const [retryingIds, setRetryingIds] = useState(() => new Set());
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState("");
  const [downloadErrorMessage, setDownloadErrorMessage] = useState("");

  // Hook for roadmap tasks and activity tracking
  const { completedTasks, toggleTask, activityLog, addActivity } =
    usePreparationProgress(activeDetailedReport || reports[0]);

  // Ensure reports are fetched on dashboard mount
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
          const statusRes = await getAtsResumeStatus(r._id);
          if (statusRes?.status && statusRes.status !== "generating") {
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

  // Fetch full details of the latest plan to populate the roadmap checklist
  useEffect(() => {
    let isCurrent = true;
    const fetchLatestDetails = async () => {
      if (reports && reports.length > 0) {
        const latestId = reports[0]._id;
        try {
          const res = await getInterviewReportById(latestId);
          if (isCurrent && res?.interviewReport) {
            setActiveDetailedReport(res.interviewReport);
          }
        } catch (err) {
          console.error("Failed to load active plan details:", err);
        }
      }
    };

    fetchLatestDetails();

    return () => {
      isCurrent = false;
    };
  }, [reports]);

  const handleDownloadResume = async (reportId) => {
    if (!reportId || downloadingIds.has(reportId)) return;
    setDownloadingIds((prev) => new Set(prev).add(reportId));
    setDownloadSuccessMessage("");
    setDownloadErrorMessage("");
    try {
      await getResumePdf(reportId);
      addActivity("resume_downloaded", "Downloaded tailored ATS resume PDF", {
        reportId,
      });
      setDownloadSuccessMessage("ATS Resume downloaded successfully");
    } catch (err) {
      console.error("Error downloading resume:", err);
      setDownloadErrorMessage(
        err?.message || "Failed to download your resume PDF. Please try again shortly."
      );
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    }
  };

  const handleRetryResume = async (reportId) => {
    if (!reportId || retryingIds.has(reportId)) return;
    setRetryingIds((prev) => new Set(prev).add(reportId));
    setDownloadSuccessMessage("");
    setDownloadErrorMessage("");
    try {
      await retryResume(reportId);
      setDownloadSuccessMessage("Preparing ATS resume in background...");
      getReports();
    } catch (err) {
      console.error("Error retrying resume generation:", err);
      setDownloadErrorMessage(
        err?.message || "Failed to restart resume generation."
      );
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    }
  };

  return (
    <div className="dashboard-page">
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

      {/* 1. Welcome Header & Primary CTA */}
      <WelcomeBanner user={user} plansCount={reports.length} />

      {/* 2. Real Statistics Cards */}
      <StatsGrid reports={reports} />

      {/* 3. Main Dashboard 2-Column Grid */}
      <div className="dashboard-grid">
        {/* Left Column: Recent Interviews & Active Roadmap */}
        <div className="dashboard-column">
          <RecentInterviews
            reports={reports}
            onDownloadResume={handleDownloadResume}
            onRetryResume={handleRetryResume}
            downloadingIds={downloadingIds}
            retryingIds={retryingIds}
            loading={loading}
          />

          <PreparationProgress
            activeReport={activeDetailedReport || reports[0]}
            completedTasks={completedTasks}
            onToggleTask={toggleTask}
          />
        </div>

        {/* Right Column: Quick Actions & Activity Timeline */}
        <div className="dashboard-column">
          <QuickActions
            latestReportId={reports[0]?._id}
            onDownloadResume={handleDownloadResume}
          />

          <RecentActivity reports={reports} activityLog={activityLog} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
