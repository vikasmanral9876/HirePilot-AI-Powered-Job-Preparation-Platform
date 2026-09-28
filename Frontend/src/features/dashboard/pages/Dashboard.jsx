import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useInterview } from "../../interview/hooks/useInterview";
import { getInterviewReportById } from "../../interview/services/interview.api";
import { usePreparationProgress } from "../hooks/usePreparationProgress";
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState("");
  const [downloadErrorMessage, setDownloadErrorMessage] = useState("");

  // Hook for roadmap tasks and activity tracking
  const { completedTasks, toggleTask, activityLog, addActivity } =
    usePreparationProgress(activeDetailedReport || reports[0]);

  // Ensure reports are fetched on dashboard mount
  useEffect(() => {
    getReports();
  }, []);

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
    if (!reportId || isDownloading) return;
    setIsDownloading(true);
    setDownloadSuccessMessage("");
    setDownloadErrorMessage("");
    try {
      await getResumePdf(reportId);
      addActivity("resume_downloaded", "Downloaded tailored ATS resume PDF", {
        reportId,
      });
      setDownloadSuccessMessage("ATS Resume downloaded successfully");
      setTimeout(() => setDownloadSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Error downloading resume:", err);
      setDownloadErrorMessage(
        err?.message || "Failed to download your resume PDF. Please try again shortly."
      );
      setTimeout(() => setDownloadErrorMessage(""), 4000);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRetryResume = async (reportId) => {
    if (!reportId) return;
    try {
      await retryResume(reportId);
      getReports();
    } catch (err) {
      console.error("Error retrying resume generation:", err);
      setDownloadErrorMessage(
        err?.message || "Failed to restart resume generation."
      );
      setTimeout(() => setDownloadErrorMessage(""), 4000);
    }
  };

  return (
    <div className="dashboard-page">
      {/* Download Alert Toasts */}
      {downloadSuccessMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#10b981",
            color: "#ffffff",
            padding: "0.75rem 1.25rem",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: "600",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            zIndex: 9999,
          }}
        >
          {downloadSuccessMessage}
        </div>
      )}

      {downloadErrorMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#ef4444",
            color: "#ffffff",
            padding: "0.75rem 1.25rem",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: "600",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            zIndex: 9999,
          }}
        >
          {downloadErrorMessage}
        </div>
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
            isDownloading={isDownloading}
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
