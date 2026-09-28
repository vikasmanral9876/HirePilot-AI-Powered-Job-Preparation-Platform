const mongoose = require("mongoose");

/**
 * - job description schema : String
 * - resume text : String
 * - Self description : String
 *
 * - matchScore : Number
 *
 * - Technical questions :
 *          [{
 *              questions: "",
 *              intention: "",
 *              answer: "",
 *          }]
 * - Behavioral questions :
 *          [{
 *              questions: "",
 *              intention: "",
 *              answer: "",
 *          }]
 * - Skill gaps : [{
 *              skill: "",
 *              severity: {
 *                  type: String,
 *                  enum: ["low", "medium", "high"]
 *              }
 *          }]
 * - Preparation plan : [{
 *              day : Number,
 *              focus : String,
 *              tasks : [String]
 *          }]
 */

const technicalQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Technical question is required"],
    },
    intention: {
      type: String,
      required: [true, "Intention is required"],
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
    },
  },
  {
    _id: false,
  },
);

const behavioralQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Technical question is required"],
    },
    intention: {
      type: String,
      required: [true, "Intention is required"],
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
    },
  },
  {
    _id: false,
  },
);

const skillGapSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: [true, "Skill is required"],
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      required: [true, "Severity is required"],
    },
  },
  {
    _id: false,
  },
);

const preparationPlanSchema = new mongoose.Schema({
  day: {
    type: Number,
    required: [true, "Day is required"],
  },
  focus: {
    type: String,
    required: [true, "Focus is required"],
  },
  tasks: [
    {
      type: String,
      required: [true, "Task is required"],
    },
  ],
});

const atsResumeSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["not_started", "generating", "ready", "failed"],
      default: "not_started",
    },
    pdfData: {
      type: Buffer,
      default: null,
      select: false, // Prevents loading binary PDF buffer in standard queries
    },
    generatedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const interviewReportSchema = new mongoose.Schema(
  {
    jobDescription: {
      type: String,
      required: [true, "Job description is required"],
    },
    resume: {
      type: String,
    },
    selfDescription: {
      type: String,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    technicalQuestions: [technicalQuestionSchema],
    behavioralQuestions: [behavioralQuestionSchema],
    skillGaps: [skillGapSchema],
    preparationPlan: [preparationPlanSchema],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
    },
    atsResume: {
      type: atsResumeSchema,
      default: () => ({
        status: "not_started",
        pdfData: null,
        generatedAt: null,
        errorMessage: null,
      }),
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for fast user reports retrieval and sorting
interviewReportSchema.index({ user: 1, createdAt: -1 });

const interviewReportModel = mongoose.model("InterviewReport", interviewReportSchema);

module.exports = interviewReportModel;
