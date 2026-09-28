const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const interviewController = require("../controllers/interview.controller");
const upload = require("../middlewares/file.middlewares");
const {
  aiGenerationLimiter,
  pdfGenerationLimiter,
} = require("../middlewares/rateLimit.middleware");

const interviewRouter = express.Router();

/**
 * @route POST /api/interview/
 * @description generate new interview report on the basis of user self description, resume pdf and job description
 * @access private
 */
interviewRouter.post(
  "/",
  authMiddleware.authUser,
  aiGenerationLimiter,
  upload.single("resume"),
  interviewController.generateInterviewReportController,
);

/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId
 * @access private
 */
interviewRouter.get(
  "/report/:interviewId",
  authMiddleware.authUser,
  interviewController.getInterviewReportByIdController,
);

/**
 * @route GET /api/interview/
 * @description get all interview reports for the authenticated user
 * @access private
 */
interviewRouter.get(
  "/",
  authMiddleware.authUser,
  interviewController.getAllInterviewReportsController,
);

/**
 * @route POST /api/interview/resume/pdf/:interviewReportId
 * @description retrieve pre-generated ATS resume PDF (backwards compatible POST route)
 * @access private
 */
interviewRouter.post(
  "/resume/pdf/:interviewReportId",
  authMiddleware.authUser,
  pdfGenerationLimiter,
  interviewController.generateResumePdfController,
);

/**
 * @route GET /api/interview/resume/pdf/:interviewReportId
 * @description retrieve pre-generated ATS resume PDF (GET route)
 * @access private
 */
interviewRouter.get(
  "/resume/pdf/:interviewReportId",
  authMiddleware.authUser,
  pdfGenerationLimiter,
  interviewController.generateResumePdfController,
);

/**
 * @route GET /api/interview/:interviewId/resume/status
 * @description query background ATS resume generation status
 * @access private
 */
interviewRouter.get(
  "/:interviewId/resume/status",
  authMiddleware.authUser,
  interviewController.getAtsResumeStatusController,
);

interviewRouter.get(
  "/report/:interviewId/resume/status",
  authMiddleware.authUser,
  interviewController.getAtsResumeStatusController,
);

/**
 * @route POST /api/interview/:interviewId/resume/retry
 * @description trigger retry for failed or not_started ATS resume generation
 * @access private
 */
interviewRouter.post(
  "/:interviewId/resume/retry",
  authMiddleware.authUser,
  pdfGenerationLimiter,
  interviewController.retryAtsResumeController,
);

interviewRouter.post(
  "/report/:interviewId/resume/retry",
  authMiddleware.authUser,
  pdfGenerationLimiter,
  interviewController.retryAtsResumeController,
);

/**
 * @route DELETE /api/interview/:interviewId
 * @description delete an interview report by interviewId
 * @access private
 */
interviewRouter.delete(
  "/:interviewId",
  authMiddleware.authUser,
  interviewController.deleteInterviewReportController,
);

module.exports = interviewRouter;