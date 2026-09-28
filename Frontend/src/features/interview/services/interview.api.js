import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({
  jobDescription,
  selfDescription,
  resumeFile,
}) => {
  const formData = new FormData();
  formData.append("jobDescription", jobDescription);
  formData.append("selfDescription", selfDescription);
  formData.append("resume", resumeFile);

  const response = await api.post("/api/interview/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
  const response = await api.get(`/api/interview/report/${interviewId}`);

  return response.data;
};

// Response interceptor for user-friendly error normalization
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If response is a Blob (e.g. from responseType: "blob" on error), parse JSON from it
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const parsed = JSON.parse(text);
        if (parsed) {
          error.response.data = parsed;
          if (parsed.message) error.message = parsed.message;
        }
      } catch (e) {
        // Blob is not JSON, retain default error
      }
    }

    if (!error.response) {
      error.message =
        "Network connection error. Please check your internet connection.";
    } else if (error.response.status === 409) {
      error.message =
        error.response.data?.message ||
        "Your ATS resume is currently being generated. Please wait a moment.";
    } else if (error.response.status === 429) {
      error.message =
        error.response.data?.message ||
        "Request limit reached. Please wait a few moments before trying again.";
    } else if (error.response.status >= 500) {
      error.message =
        error.response.data?.message ||
        "Failed to generate your resume PDF. Please try again shortly.";
    }
    return Promise.reject(error);
  },
);

/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async ({ page, limit } = {}) => {
  const params = {};
  if (page) params.page = page;
  if (limit) params.limit = limit;
  const response = await api.get("/api/interview/", { params });

  return response.data;
};

/**
 * @description Service to query ATS resume generation status.
 */
export const getAtsResumeStatus = async (interviewId) => {
  const response = await api.get(`/api/interview/${interviewId}/resume/status`);
  return response.data;
};

/**
 * @description Service to trigger retry for failed or not_started ATS resume generation.
 */
export const retryAtsResume = async (interviewId) => {
  const response = await api.post(`/api/interview/${interviewId}/resume/retry`);
  return response.data;
};

/**
 * @description Service to download the pre-generated ATS tailored resume PDF.
 */
export const downloadAtsResume = async ({ interviewReportId }) => {
  const response = await api.get(
    `/api/interview/resume/pdf/${interviewReportId}`,
    {
      responseType: "blob",
    },
  );

  return response.data;
};

/**
 * @description Alias to downloadAtsResume for backwards compatibility.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
  return downloadAtsResume({ interviewReportId });
};

/**
 * @description Service to delete an interview report by id.
 */
export const deleteInterviewReport = async (interviewId) => {
  const response = await api.delete(`/api/interview/${interviewId}`);
  return response.data;
};
