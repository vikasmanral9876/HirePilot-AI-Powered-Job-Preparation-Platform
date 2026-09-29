import {
  getAllInterviewReports,
  generateInterviewReport,
  getInterviewReportById,
  downloadAtsResume,
  getAtsResumeStatus,
  retryAtsResume,
  deleteInterviewReport,
} from "../services/interview.api";
import { useContext, useEffect, useState, useRef } from "react";
import { InterviewContext } from "../interview.context";
import { useParams } from "react-router";

export const useInterview = () => {
  const context = useContext(InterviewContext);
  const { interviewId } = useParams();

  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }

  const {
    loading,
    setLoading,
    report,
    setReport,
    reports,
    setReports,
    pagination,
    setPagination,
    stagedResumeFile,
    setStagedResumeFile,
  } = context;

  const [atsResumeStatus, setAtsResumeStatus] = useState("not_started");
  const [atsResumeError, setAtsResumeError] = useState(null);
  const [isDownloadingResume, setIsDownloadingResume] = useState(false);
  const [isRetryingResume, setIsRetryingResume] = useState(false);

  // Sync state whenever active report changes
  useEffect(() => {
    if (report?.atsResume?.status) {
      setAtsResumeStatus(report.atsResume.status);
      setAtsResumeError(report.atsResume.errorMessage || null);
    } else if (report) {
      setAtsResumeStatus("not_started");
      setAtsResumeError(null);
    }
  }, [report]);

  // Polling mechanism for background ATS resume generation
  const activePollRef = useRef(null);

  useEffect(() => {
    const targetId = report?._id || interviewId;

    if (!targetId || atsResumeStatus !== "generating") {
      if (activePollRef.current) {
        clearInterval(activePollRef.current);
        activePollRef.current = null;
      }
      return;
    }

    let isSubscribed = true;
    let pollCount = 0;
    const maxPollAttempts = 35; // 35 * 3.5s ~ 122 seconds timeout

    activePollRef.current = setInterval(async () => {
      pollCount++;
      if (pollCount > maxPollAttempts) {
        if (activePollRef.current) {
          clearInterval(activePollRef.current);
          activePollRef.current = null;
        }
        if (isSubscribed) {
          setAtsResumeStatus("failed");
          setAtsResumeError("Resume generation timed out. Please try again.");
          setReport((prev) =>
            prev
              ? {
                  ...prev,
                  atsResume: {
                    ...(prev.atsResume || {}),
                    status: "failed",
                    errorMessage: "Resume generation timed out. Please try again.",
                  },
                }
              : prev,
          );
        }
        return;
      }

      try {
        const res = await getAtsResumeStatus(targetId);
        if (!isSubscribed) return;

        if (res?.status) {
          setAtsResumeStatus(res.status);

          if (res.status === "ready") {
            if (activePollRef.current) {
              clearInterval(activePollRef.current);
              activePollRef.current = null;
            }
            setAtsResumeError(null);
            setReport((prev) =>
              prev
                ? {
                    ...prev,
                    atsResume: {
                      ...(prev.atsResume || {}),
                      status: "ready",
                      generatedAt: res.generatedAt,
                      errorMessage: null,
                    },
                  }
                : prev,
            );
          } else if (res.status === "failed") {
            if (activePollRef.current) {
              clearInterval(activePollRef.current);
              activePollRef.current = null;
            }
            const errMsg = res.errorMessage || "Unable to generate your ATS resume.";
            setAtsResumeError(errMsg);
            setReport((prev) =>
              prev
                ? {
                    ...prev,
                    atsResume: {
                      ...(prev.atsResume || {}),
                      status: "failed",
                      errorMessage: errMsg,
                    },
                  }
                : prev,
            );
          }
        }
      } catch (err) {
        console.error("Error polling ATS resume status:", err);
      }
    }, 3500);

    return () => {
      isSubscribed = false;
      if (activePollRef.current) {
        clearInterval(activePollRef.current);
        activePollRef.current = null;
      }
    };
  }, [atsResumeStatus, report?._id, interviewId]);

  const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
    setLoading(true);
    try {
      const response = await generateInterviewReport({
        jobDescription,
        selfDescription,
        resumeFile,
      });

      const newReport = response?.interviewReport;
      if (newReport) {
        setReport(newReport);
        setAtsResumeStatus(newReport.atsResume?.status || "generating");
      }
      return newReport;
    } catch (error) {
      console.error("Error generating interview report:", error?.message || error);
      const rawMsg = error?.response?.data?.message || error?.message || "";
      const status = error?.response?.status;

      // 1. Validation error from server (400)
      if (status === 400 && error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      // 2. Authentication error (401)
      if (status === 401) {
        const authError = new Error("Your session has expired. Please sign in again.");
        authError.response = { status: 401, data: { message: "Your session has expired. Please sign in again." } };
        throw authError;
      }

      // 3. For any AI failure (503, 429, network, timeout, or malformed response)
      const friendlyError = new Error(
        "We're temporarily unable to generate your interview plan. Please try again later."
      );
      friendlyError.response = error?.response;
      throw friendlyError;
    } finally {
      setLoading(false);
    }
  };

  const getReportById = async (id) => {
    const targetId = id || interviewId;
    if (!targetId) return null;
    setLoading(true);
    let response = null;
    try {
      response = await getInterviewReportById(targetId);
      if (response?.interviewReport) {
        setReport(response.interviewReport);
        setAtsResumeStatus(response.interviewReport.atsResume?.status || "not_started");
        setAtsResumeError(response.interviewReport.atsResume?.errorMessage || null);
      }
    } catch (error) {
      console.error("Error fetching interview report:", error);
    } finally {
      setLoading(false);
    }
    return response?.interviewReport;
  };

  const getReports = async ({ page, limit } = {}) => {
    setLoading(true);
    let response = null;
    try {
      response = await getAllInterviewReports({ page, limit });
      if (response?.interviewReports) {
        setReports(response.interviewReports);
      }
      if (response?.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }

    return response;
  };

  const downloadResume = async (interviewReportId) => {
    const targetId = interviewReportId || report?._id || interviewId;
    if (!targetId || isDownloadingResume) return;

    setIsDownloadingResume(true);
    try {
      const response = await downloadAtsResume({ interviewReportId: targetId });
      const url = window.URL.createObjectURL(
        new Blob([response], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `resume_${targetId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      return response;
    } catch (error) {
      console.error("Error downloading resume PDF:", error);
      throw error;
    } finally {
      setIsDownloadingResume(false);
    }
  };

  // Backwards-compatible alias for existing callers
  const getResumePdf = async (interviewReportId) => {
    return downloadResume(interviewReportId);
  };

  const retryResume = async (interviewReportId) => {
    const targetId = interviewReportId || report?._id || interviewId;
    if (!targetId || isRetryingResume) return;

    setIsRetryingResume(true);
    try {
      const res = await retryAtsResume(targetId);
      setAtsResumeStatus("generating");
      setAtsResumeError(null);
      setReport((prev) =>
        prev
          ? {
              ...prev,
              atsResume: {
                ...(prev.atsResume || {}),
                status: "generating",
                errorMessage: null,
              },
            }
          : prev,
      );
      return res;
    } catch (error) {
      console.error("Error retrying ATS resume generation:", error);
      throw error;
    } finally {
      setIsRetryingResume(false);
    }
  };

  const deleteReport = async (id) => {
    const targetId = id || interviewId;
    if (!targetId) return false;
    try {
      await deleteInterviewReport(targetId);
      setReports((prev) => prev.filter((r) => r._id !== targetId));
      if (report && report._id === targetId) {
        setReport(null);
      }
      try {
        localStorage.removeItem(`hirepilot_prep_${targetId}`);
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith("hirepilot_prep_") && key.endsWith(targetId)) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.error("Failed to clear prep checklist:", e);
      }
      return true;
    } catch (error) {
      console.error("Error deleting report:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (interviewId) {
      if (!report || report._id !== interviewId) {
        getReportById(interviewId);
      }
    }
  }, [interviewId]);

  return {
    loading,
    report,
    reports,
    pagination,
    generateReport,
    getReportById,
    getReports,
    getResumePdf,
    downloadResume,
    retryResume,
    atsResumeStatus,
    atsResumeError,
    isDownloadingResume,
    isRetryingResume,
    deleteReport,
    stagedResumeFile,
    setStagedResumeFile,
  };
};