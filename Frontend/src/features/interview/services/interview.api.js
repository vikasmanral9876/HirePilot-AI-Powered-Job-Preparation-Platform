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
      } catch {
        // Blob is not JSON, retain default error
      }
    }

    const status = error.response?.status;
    const serverMsg = error.response?.data?.message || "";
    const isBlob = error.config?.responseType === "blob";

    // 1. Network failure
    if (!error.response) {
      error.message =
        "Unable to connect to the server. Please check your connection and try again.";
      return Promise.reject(error);
    }

    // 2. Authentication
    if (status === 401) {
      error.message = "Your session has expired. Please sign in again.";
      return Promise.reject(error);
    }

    // 3. Forbidden / IDOR
    if (status === 403) {
      error.message = "You don't have access to this resume.";
      return Promise.reject(error);
    }

    // 4. Not Found
    if (status === 404) {
      error.message = isBlob
        ? "Resume not found."
        : serverMsg || "Requested resource not found.";
      return Promise.reject(error);
    }

    // 5. Conflict (ATS resume still generating)
    if (status === 409) {
      error.message =
        "Your ATS resume is still being prepared. Please try again shortly.";
      return Promise.reject(error);
    }

    // 6. Unprocessable (ATS resume failed)
    if (status === 422) {
      error.message =
        serverMsg || "ATS Resume couldn't be generated. Please try again.";
      return Promise.reject(error);
    }

    // 7. Rate Limit & Gemini Quota
    if (status === 429) {
      error.isQuotaExhausted = true;
      error.message =
        "We're temporarily unable to generate your interview plan. Please try again later.";
      return Promise.reject(error);
    }

    // 8. Server Error (500, 502, 503)
    if (status >= 500) {
      if (isBlob) {
        error.message =
          "Unable to download the resume right now. Please try again.";
      } else if (
        status === 503 ||
        serverMsg === "We're temporarily unable to generate your interview plan. Please try again later." ||
        serverMsg.toLowerCase().includes("quota") ||
        serverMsg.toLowerCase().includes("gemini") ||
        serverMsg.toLowerCase().includes("demand") ||
        serverMsg.toLowerCase().includes("overloaded")
      ) {
        error.message =
          "We're temporarily unable to generate your interview plan. Please try again later.";
      } else if (
        serverMsg &&
        !serverMsg.includes("node_modules") &&
        !serverMsg.includes("at ") &&
        !serverMsg.includes("Mongo") &&
        !serverMsg.includes("CastError")
      ) {
        error.message = serverMsg;
      } else {
        error.message =
          "We're temporarily unable to generate your interview plan. Please try again later.";
      }
      return Promise.reject(error);
    }

    // Fallback sanitation: never expose stack traces or raw technical strings
    if (
      !error.message ||
      serverMsg.includes("generativelanguage.googleapis.com") ||
      serverMsg.includes("Mongo") ||
      serverMsg.includes("CastError") ||
      serverMsg.includes("node_modules") ||
      serverMsg.includes("at ") ||
      serverMsg.includes("ECONNREFUSED") ||
      error.message.includes("at ")
    ) {
      error.message =
        "We're temporarily unable to generate your interview plan. Please try again later.";
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
