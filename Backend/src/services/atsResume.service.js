const interviewReportModel = require("../models/interviewReport.model");
const { generateResumePdf } = require("./ai.service");

/**
 * Service to manage background ATS resume generation.
 * Ensures:
 * 1. Single asynchronous execution per interview report (no duplicate jobs).
 * 2. Atomic status transition: not_started / failed -> generating -> ready / failed.
 * 3. Sanitized error messages persisted to database without exposing internal traces.
 * 4. Stale job recovery for unexpected server restarts.
 */

// Stale timeout threshold: 5 minutes
const STALE_JOB_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Triggers ATS resume generation in the background.
 * Returns immediately without blocking the caller.
 *
 * @param {string|mongoose.Types.ObjectId} interviewReportId
 * @param {object} options
 * @param {boolean} options.forceRetry - If true, allows retry from failed state
 */
async function triggerAtsResumeGeneration(interviewReportId, { forceRetry = false } = {}) {
  try {
    const staleCutoff = new Date(Date.now() - STALE_JOB_THRESHOLD_MS);

    // Build atomic match conditions to prevent duplicate concurrent runs
    const eligibleConditions = [
      { "atsResume.status": "not_started" },
      { "atsResume.status": { $exists: false } },
      // Stale recovery: if generating for longer than 5 mins, allow recovery
      { "atsResume.status": "generating", updatedAt: { $lt: staleCutoff } },
    ];

    if (forceRetry) {
      eligibleConditions.push({ "atsResume.status": "failed" });
    }

    const claimedReport = await interviewReportModel.findOneAndUpdate(
      {
        _id: interviewReportId,
        $or: eligibleConditions,
      },
      {
        $set: {
          "atsResume.status": "generating",
          "atsResume.errorMessage": null,
        },
      },
      { returnDocument: "after" }
    ).select("resume jobDescription selfDescription title");

    // If no document was claimed, generation is either already active or already completed
    if (!claimedReport) {
      return false;
    }

    // Launch background generation asynchronously (non-blocking)
    setImmediate(async () => {
      try {
        const { resume, jobDescription, selfDescription, title } = claimedReport;

        const pdfBuffer = await generateResumePdf({
          resume: resume || "",
          jobDescription: jobDescription || "",
          selfDescription: selfDescription || "",
          title: title || "Target Role Strategy",
        });

        if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length < 1000) {
          throw new Error("Generated PDF buffer is invalid or empty");
        }

        await interviewReportModel.findByIdAndUpdate(interviewReportId, {
          $set: {
            "atsResume.status": "ready",
            "atsResume.pdfData": pdfBuffer,
            "atsResume.generatedAt": new Date(),
            "atsResume.errorMessage": null,
          },
        });
      } catch (err) {
        console.error(`Background ATS resume generation failed for ${interviewReportId}:`, err?.message || err);
        const errMsg = err?.isQuotaExhausted || err?.message?.includes("quota")
          ? "Gemini API quota has been reached. Please try again later."
          : "Unable to generate your ATS resume. Please try again.";

        await interviewReportModel.findByIdAndUpdate(interviewReportId, {
          $set: {
            "atsResume.status": "failed",
            "atsResume.errorMessage": errMsg,
          },
        });
      }
    });

    return true;
  } catch (err) {
    console.error(`Error in triggerAtsResumeGeneration for ${interviewReportId}:`, err);
    return false;
  }
}

/**
 * Checks and returns the current ATS resume status for an interview report.
 * Automatically recovers stale "generating" jobs.
 */
async function getAtsResumeStatus(interviewReportId, userId) {
  const report = await interviewReportModel.findOne({
    _id: interviewReportId,
    user: userId,
  }).select("atsResume updatedAt");

  if (!report) {
    return null;
  }

  let status = report.atsResume?.status || "not_started";
  const generatedAt = report.atsResume?.generatedAt || null;
  let errorMessage = report.atsResume?.errorMessage || null;

  // Stale recovery check
  if (status === "generating") {
    const isStale = Date.now() - new Date(report.updatedAt).getTime() > STALE_JOB_THRESHOLD_MS;
    if (isStale) {
      status = "failed";
      errorMessage = "Resume generation timed out. Please try again.";
      await interviewReportModel.findByIdAndUpdate(interviewReportId, {
        $set: {
          "atsResume.status": "failed",
          "atsResume.errorMessage": errorMessage,
        },
      });
    }
  }

  return {
    status,
    generatedAt,
    errorMessage,
  };
}

module.exports = {
  triggerAtsResumeGeneration,
  getAtsResumeStatus,
  STALE_JOB_THRESHOLD_MS,
};
