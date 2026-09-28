const { GoogleGenAI } = require("@google/genai");
const puppeteer = require("puppeteer");
const { prepareAtsResumeHtml } = require("./resumeTemplate.service");

const dns = require("dns");
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY,
});

const GEMINI_PRIMARY_MODEL = "gemini-3.8-flash";
const GEMINI_MODEL =
  process.env.GEMINI_MODEL && process.env.GEMINI_MODEL !== "gemini-2.5-flash"
    ? process.env.GEMINI_MODEL
    : GEMINI_PRIMARY_MODEL;

const FALLBACK_MODELS = ["gemini-3.7-flash", "gemini-3.5-flash"];

let testAiClient = null;

/**
 * Allows automated tests to inject a mock AI client without making real external API calls.
 */
function setAiClientForTesting(client) {
  testAiClient = client;
}

/**
 * Extracts retry delay in milliseconds from Gemini API error responses or headers.
 * Looks for:
 * 1. google.rpc.RetryInfo in errorDetails/details (e.g. retryDelay: "27s" or { seconds: 27 })
 * 2. Retry-After HTTP header
 * 3. Text patterns in error messages (e.g. 'retryDelay: 27s', 'retry in 27s')
 */
function extractRetryDelayMs(err) {
  try {
    const details = err?.errorDetails || err?.details || [];
    if (Array.isArray(details)) {
      for (const d of details) {
        if (d && (d["@type"]?.includes("RetryInfo") || d.retryDelay)) {
          if (typeof d.retryDelay === "string") {
            const match = d.retryDelay.match(/(\d+(?:\.\d+)?)/);
            if (match) {
              return Math.round(parseFloat(match[1]) * 1000);
            }
          } else if (typeof d.retryDelay === "object" && d.retryDelay !== null) {
            const sec = Number(d.retryDelay.seconds || 0);
            const nanos = Number(d.retryDelay.nanos || 0);
            return Math.round(sec * 1000 + nanos / 1e6);
          }
        }
      }
    }

    const retryAfter =
      err?.headers?.["retry-after"] ||
      (typeof err?.response?.headers?.get === "function" &&
        err.response.headers.get("retry-after"));
    if (retryAfter) {
      const parsedSec = parseFloat(retryAfter);
      if (!isNaN(parsedSec) && parsedSec > 0) {
        return Math.round(parsedSec * 1000);
      }
    }

    const errStr = typeof err?.message === "string" ? err.message : String(err || "");
    const match =
      errStr.match(/retrydelay["']?\s*[:=]\s*["']?(\d+(?:\.\d+)?)\s*s?/i) ||
      errStr.match(/retry\s+in\s+["']?(\d+(?:\.\d+)?)\s*s/i) ||
      errStr.match(/retry\s+after\s+["']?(\d+(?:\.\d+)?)\s*s/i);

    if (match && match[1]) {
      const sec = parseFloat(match[1]);
      if (!isNaN(sec) && sec > 0) {
        return Math.round(sec * 1000);
      }
    }
  } catch (e) {
    // ignore parse error
  }
  return null;
}

/**
 * Determines whether a Gemini 429 error represents daily/free-tier project quota exhaustion
 * where switching models or repeated retries would be futile and wasteful.
 */
function isDailyOrProjectQuotaExhausted(err) {
  const errStr = (
    (err?.message || "") +
    " " +
    JSON.stringify(err?.errorDetails || err?.details || "")
  ).toLowerCase();

  const is429OrExhausted =
    err?.status === 429 ||
    err?.statusCode === 429 ||
    errStr.includes("resource_exhausted") ||
    errStr.includes("quota exceeded") ||
    errStr.includes("429");

  if (!is429OrExhausted) return false;

  return (
    errStr.includes("generaterequestsperday") ||
    errStr.includes("generaterequestsperdaypermodel-freetier") ||
    errStr.includes("free_tier") ||
    errStr.includes("freetier") ||
    errStr.includes("perday") ||
    errStr.includes("per_day") ||
    errStr.includes("daily") ||
    errStr.includes("requests per day")
  );
}

/**
 * Checks if the error is an authentication / API key failure.
 */
function isAuthError(err) {
  const status = err?.status || err?.statusCode || (err?.response && err?.response?.status);
  if (status === 401 || status === 403) return true;

  const errStr = (
    (err?.message || "") +
    " " +
    JSON.stringify(err?.errorDetails || err?.details || "")
  ).toLowerCase();

  return (
    errStr.includes("api_key_invalid") ||
    errStr.includes("api key not valid") ||
    errStr.includes("permission_denied") ||
    errStr.includes("unauthenticated") ||
    errStr.includes("invalid api key")
  );
}

/**
 * Checks if the model is unavailable or not found (404), where fallback to the next
 * candidate model is appropriate.
 */
function isModelUnavailable(err) {
  const status = err?.status || err?.statusCode || (err?.response && err?.response?.status);
  if (status === 404) return true;

  const errStr = (err?.message || "").toLowerCase();
  return (
    errStr.includes("is not found for api version") ||
    errStr.includes("is not supported for this api version") ||
    errStr.includes("model not found") ||
    (errStr.includes("models/") && errStr.includes("not found")) ||
    errStr.includes("is not supported") ||
    errStr.includes("no longer available")
  );
}

/**
 * Checks if the error is a client-side 4xx error (other than 404 and 429).
 */
function isClientError(err) {
  const status = err?.status || err?.statusCode || (err?.response && err?.response?.status);
  if (status && status >= 400 && status < 500 && status !== 404 && status !== 429) {
    return true;
  }
  const errStr = (err?.message || "").toLowerCase();
  return errStr.includes("invalid_argument") || errStr.includes("bad request");
}

/**
 * Checks if the error is a temporary rate limit (e.g. RPM / capacity) rather than daily exhaustion.
 */
function isTemporaryRateLimit(err) {
  const status = err?.status || err?.statusCode || (err?.response && err?.response?.status);
  const errStr = (
    (err?.message || "") +
    " " +
    JSON.stringify(err?.errorDetails || err?.details || "")
  ).toLowerCase();

  return (
    status === 429 ||
    errStr.includes("resource_exhausted") ||
    errStr.includes("rate limit") ||
    errStr.includes("rate_limit") ||
    errStr.includes("too many requests")
  );
}

/**
 * Checks if the error is a transient server error or network timeout.
 */
function isTransientServerError(err) {
  const status = err?.status || err?.statusCode || (err?.response && err?.response?.status);
  if (status === 503 || status === 500 || status === 502 || status === 504) return true;

  const isTimeoutOrNetwork =
    err?.code === "ETIMEDOUT" ||
    err?.name === "ConnectTimeoutError" ||
    err?.code === "UND_ERR_CONNECT_TIMEOUT" ||
    err?.message?.includes("timed out") ||
    err?.message?.includes("fetch failed") ||
    err?.message?.includes("Connect Timeout Error");

  const errStr = (err?.message || "").toLowerCase();
  return (
    isTimeoutOrNetwork ||
    errStr.includes("high demand") ||
    errStr.includes("overloaded") ||
    errStr.includes("service unavailable") ||
    errStr.includes("temporarily unavailable")
  );
}

/**
 * Classifies a Gemini API error into clean categorization for structured handling.
 */
function classifyGeminiError(err) {
  if (isDailyOrProjectQuotaExhausted(err)) {
    return {
      type: "DAILY_QUOTA_EXHAUSTED",
      retryable: false,
      allowModelFallback: false,
      userMessage: "Gemini API quota has been reached. Please try again later.",
    };
  }
  if (isAuthError(err)) {
    return {
      type: "AUTH_ERROR",
      retryable: false,
      allowModelFallback: false,
      userMessage: "Gemini API authentication failed. Please check your API key.",
    };
  }
  if (isClientError(err)) {
    return {
      type: "CLIENT_ERROR",
      retryable: false,
      allowModelFallback: false,
      userMessage: "Invalid request sent to AI model.",
    };
  }
  if (isModelUnavailable(err)) {
    return {
      type: "MODEL_UNAVAILABLE",
      retryable: false,
      allowModelFallback: true,
      userMessage: "Configured AI model is unavailable.",
    };
  }
  if (isTemporaryRateLimit(err)) {
    return {
      type: "TEMPORARY_RATE_LIMIT",
      retryable: true,
      allowModelFallback: false,
      retryDelayMs: extractRetryDelayMs(err),
      userMessage: "Gemini API rate limit reached. Please try again in a few moments.",
    };
  }
  if (isTransientServerError(err)) {
    return {
      type: "TRANSIENT_SERVER_ERROR",
      retryable: true,
      allowModelFallback: true,
      userMessage: "AI service temporarily overloaded. Please try again shortly.",
    };
  }
  return {
    type: "UNKNOWN_ERROR",
    retryable: false,
    allowModelFallback: false,
    userMessage: "We couldn't generate your interview. Please try again.",
  };
}

/**
 * Executes a Gemini API generateContent call with intelligent error classification:
 * - gemini-3.8-flash is primary model.
 * - gemini-2.5-flash is removed from normal fallback.
 * - 404 model unavailable -> tries next configured candidate model.
 * - Daily free-tier quota exhausted -> stops immediately without model cycling or retrying.
 * - Temporary 429 -> respects API retryDelay or bounded exponential backoff on current model.
 * - Authentication error -> stops immediately.
 */
async function generateGeminiContent(params) {
  const client = params.aiClient || testAiClient || ai;

  const primaryModel = params.model || GEMINI_MODEL;
  const modelCandidates = [
    primaryModel,
    ...FALLBACK_MODELS,
  ].filter((m) => m && m !== "gemini-2.5-flash");

  const uniqueModels = [...new Set(modelCandidates)];

  let lastError;
  for (let i = 0; i < uniqueModels.length; i++) {
    const currentModel = uniqueModels[i];
    const maxRetries = 2; // Maximum 2 attempts per model for transient errors

    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        const attempt = client.models.generateContent({
          ...params,
          model: currentModel,
        });
        return await withTimeout(attempt, 25000, `Gemini Attempt (${currentModel})`);
      } catch (err) {
        lastError = err;

        // Log detailed backend error for debugging (never leak raw stack traces to user)
        console.error(
          `[Gemini] Error on model "${currentModel}" (attempt ${retry + 1}/${maxRetries}):`,
          err?.message || err
        );

        const classification = classifyGeminiError(err);

        // 1. Daily / Free-Tier Project Quota Exhaustion
        if (classification.type === "DAILY_QUOTA_EXHAUSTED") {
          console.error(
            `[Gemini] Daily/free-tier quota exhausted on model "${currentModel}". Stopping immediately without switching models.`
          );
          const quotaErr = new Error(classification.userMessage);
          quotaErr.status = 429;
          quotaErr.isQuotaExhausted = true;
          throw quotaErr;
        }

        // 2. Authentication / API-Key Error
        if (classification.type === "AUTH_ERROR") {
          console.error(
            `[Gemini] Authentication error on model "${currentModel}". Stopping immediately.`
          );
          const authErr = new Error(classification.userMessage);
          authErr.status = 401;
          authErr.isAuthError = true;
          throw authErr;
        }

        // 3. Other 4xx Client Errors (Bad Request, Invalid Argument, etc.)
        if (classification.type === "CLIENT_ERROR") {
          console.error(
            `[Gemini] Client error (${err?.status || 400}) on model "${currentModel}". Not switching models.`
          );
          throw err;
        }

        // 4. Model Unavailable (404 / not found / not supported)
        if (classification.type === "MODEL_UNAVAILABLE") {
          console.warn(
            `[Gemini] Model "${currentModel}" is unavailable (${err?.status || "404"}). Trying next configured model...`
          );
          break; // Stop retrying this model, proceed to the next candidate model
        }

        // 5. Temporary Rate Limit / RPM / Temporary capacity (NOT daily quota)
        if (classification.type === "TEMPORARY_RATE_LIMIT") {
          if (retry < maxRetries - 1) {
            const extractedDelay = classification.retryDelayMs || extractRetryDelayMs(err);
            // Use API-provided retryDelay or bounded exponential backoff (1s - 30s)
            const delayMs = extractedDelay
              ? Math.min(Math.max(extractedDelay, 1000), 30000)
              : Math.min(2000 * Math.pow(2, retry), 10000);

            console.warn(
              `[Gemini] Model "${currentModel}" temporary rate limit. Waiting ${Math.round(delayMs / 1000)}s before retry...`
            );
            await new Promise((r) => setTimeout(r, delayMs));
            continue;
          } else {
            console.warn(
              `[Gemini] Model "${currentModel}" rate limit retries exhausted. Stopping without model switching.`
            );
            const rateLimitErr = new Error(classification.userMessage);
            rateLimitErr.status = 429;
            throw rateLimitErr;
          }
        }

        // 6. Transient Server Errors (503 / 500 / ETIMEDOUT / network)
        if (classification.type === "TRANSIENT_SERVER_ERROR") {
          if (retry < maxRetries - 1) {
            console.warn(
              `[Gemini] Model "${currentModel}" transient server error (${err?.status || err?.code || "timeout"}). Retrying in 2s...`
            );
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          } else {
            console.warn(
              `[Gemini] Model "${currentModel}" persistent server error. Trying next candidate model...`
            );
            break; // Try next candidate model
          }
        }

        // 7. Unknown error: stop without blindly cycling models
        throw err;
      }
    }
  }

  // If all models in candidate list were attempted and unavailable
  console.error("[Gemini] All configured candidate models are unavailable.");
  const allModelsErr = new Error("All configured Gemini models are currently unavailable. Please try again later.");
  allModelsErr.status = 503;
  throw allModelsErr;
}

const interviewReportJsonSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "The job title / role for which the interview report is generated (e.g. Senior Software Engineer)",
    },
    matchScore: {
      type: "number",
      description: "A score between 0 and 100 indicating how well the candidate's profile matches the job description",
    },
    technicalQuestions: {
      type: "array",
      description: "Technical questions that can be asked in the interview along with their intention and model answers",
      items: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The technical question can be asked in the interview",
          },
          intention: {
            type: "string",
            description: "The intention of interviewer behind asking this question",
          },
          answer: {
            type: "string",
            description: "How to answer this question, what points to cover, what approach to take etc.",
          },
        },
        required: ["question", "intention", "answer"],
      },
    },
    behavioralQuestions: {
      type: "array",
      description: "Behavioral questions that can be asked in the interview along with their intention and model answers",
      items: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The behavioral question can be asked in the interview",
          },
          intention: {
            type: "string",
            description: "The intention of interviewer behind asking this question",
          },
          answer: {
            type: "string",
            description: "How to answer this question, what points to cover, what approach to take etc.",
          },
        },
        required: ["question", "intention", "answer"],
      },
    },
    skillGaps: {
      type: "array",
      description: "List of skill gaps in the candidate's profile along with their severity",
      items: {
        type: "object",
        properties: {
          skill: {
            type: "string",
            description: "The skill which the candidate is lacking",
          },
          severity: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "The severity of this skill gap",
          },
        },
        required: ["skill", "severity"],
      },
    },
    preparationPlan: {
      type: "array",
      description: "A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively",
      items: {
        type: "object",
        properties: {
          day: {
            type: "number",
            description: "The day number in the preparation plan, starting from 1",
          },
          focus: {
            type: "string",
            description: "The main focus of this day in the preparation plan",
          },
          tasks: {
            type: "array",
            items: { type: "string" },
            description: "List of tasks to be done on this day",
          },
        },
        required: ["day", "focus", "tasks"],
      },
    },
  },
  required: [
    "title",
    "matchScore",
    "technicalQuestions",
    "behavioralQuestions",
    "skillGaps",
    "preparationPlan",
  ],
};

/**
 * Executes a promise with an enforced timeout to prevent indefinitely hanging requests.
 */
function withTimeout(promise, timeoutMs = 60000, operationName = "AI Request") {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(
        `${operationName} timed out after ${timeoutMs / 1000} seconds.`,
      );
      error.code = "ETIMEDOUT";
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

/**
 * Safely parses JSON responses from Gemini, stripping markdown code fences if present.
 */
function safeJsonParse(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Empty response received from AI model");
  }

  let text = rawText.trim();

  // Strip markdown code fences if returned (e.g. ```json ... ``` or ``` ...)
  if (text.startsWith("```")) {
    text = text
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();
  }

  try {
    return JSON.parse(text);
  } catch (initialErr) {
    // Fallback: extract substring between outermost JSON braces { ... }
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = text.substring(firstBrace, lastBrace + 1);
      return JSON.parse(candidate);
    }
    throw initialErr;
  }
}

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

  Ensure the output strictly includes a concise, realistic "title" for the target job role (e.g. "Senior Full-Stack Engineer" or extracted from the Job Description).
    `;
  try {
    const aiCall = generateGeminiContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: interviewReportJsonSchema,
      },
    });

    const response = await withTimeout(
      aiCall,
      60000,
      "Interview Plan Generation",
    );

    return safeJsonParse(response.text);
  } catch (err) {
    console.error("Gemini API Error in generateInterviewReport:", err?.message || err);
    if (err?.isQuotaExhausted || err?.message?.includes("quota")) {
      const quotaErr = new Error("Gemini API quota has been reached. Please try again later.");
      quotaErr.status = 429;
      quotaErr.isQuotaExhausted = true;
      throw quotaErr;
    }
    if (err?.isAuthError || err?.message?.includes("authentication")) {
      const authErr = new Error("Gemini API authentication failed. Please check your API key.");
      authErr.status = 401;
      authErr.isAuthError = true;
      throw authErr;
    }
    if (err?.message?.includes("rate limit")) {
      const rateLimitErr = new Error("Gemini API rate limit reached. Please try again in a few moments.");
      rateLimitErr.status = 429;
      throw rateLimitErr;
    }
    throw new Error(
      "We couldn't generate your interview. Please try again.",
    );
  }
}

async function generatePdfFromHtml(htmlContent) {
  let browser;
  try {
    const formattedHtml = prepareAtsResumeHtml(htmlContent);

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(formattedHtml, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0.45in",
        bottom: "0.45in",
        left: "0.48in",
        right: "0.48in",
      },
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("Puppeteer PDF generation failed:", error);
    throw new Error("Failed to generate PDF document");
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("Error closing Puppeteer browser instance:", closeErr);
      }
    }
  }
}

async function generateResumePdf({ resume, selfDescription, jobDescription, title }) {
  const resumePdfJsonSchema = {
    type: "object",
    properties: {
      html: {
        type: "string",
        description:
          "The HTML content of the resume which can be converted to PDF using any library like puppeteer",
      },
    },
    required: ["html"],
  };

  const prompt = `Generate a high-impact, ATS-optimized resume for a candidate tailored to the target job:
${title ? `Target Job Title: ${title}\n` : ""}
Resume: ${resume || "Not provided"}
Self Description: ${selfDescription || "Not provided"}
Job Description: ${jobDescription || "Not provided"}

CRITICAL LAYOUT & ATS REQUIREMENTS:
1. TARGET 1 PAGE: For standard/junior profiles (2-3 projects, education, skills), the resume MUST be structured to fit cleanly onto exactly ONE A4 page. Keep content concise, high-impact, and avoid verbose filler.
2. ATS COMPATIBILITY: Use standard semantic HTML (<header>, <section>, <h1>, <h2>, <p>, <ul>, <li>). Do NOT use icons, emojis, progress bars, or complex decorative shapes. Use clean text separators like " | " or " • ".
3. STRUCTURE:
   - Header:
     - <h1 class="name">Candidate Full Name (in uppercase)</h1>
     - <div class="role">Target Job Title</div>
     - <div class="contact-bar">Location | Email | Phone | LinkedIn | GitHub</div> (on a single compact line, without emojis)
   - Professional Summary:
     - <section class="section"><h2 class="section-title">Professional Summary</h2><p class="summary-text">...</p></section>
     - 2-3 focused sentences summarizing technical proficiency and impact.
   - Technical Skills:
     - <section class="section"><h2 class="section-title">Technical Skills</h2>
     - Group skills logically by category on single lines (e.g. Frontend, Backend, Databases, Tools) inside a 2-column or inline grid (<div class="skills-grid"><div class="skill-item"><span class="skill-label">Category:</span> Skills list</div>...</div>). Avoid long single-column bullet lists of individual skills.
   - Projects:
     - <section class="section"><h2 class="section-title">Key Projects</h2>
     - Feature 2-3 most relevant projects. For each (<div class="project-item">):
       - <div class="project-header"><span class="project-title">Project Name</span> <span class="project-tech">Tech Stack</span></div>
       - <ul class="bullets">: 2-3 concise bullet points starting with strong action verbs.
   - Education:
     - <section class="section"><h2 class="section-title">Education</h2>
     - Degree, Institution, Dates, GPA/details on compact lines.
   - Certifications / Achievements (if present in profile):
     - Keep concise, organized in a 2-column layout alongside Education or compact bullet lists.

The response MUST be a JSON object with a single field "html" containing the HTML structure.`;
  try {
    const aiCall = generateGeminiContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: resumePdfJsonSchema,
      },
    });

    const response = await withTimeout(
      aiCall,
      90000,
      "Resume Tailoring",
    );

    const jsonContent = safeJsonParse(response.text);

    if (!jsonContent || !jsonContent.html) {
      throw new Error("Invalid resume format returned by AI");
    }

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

    return pdfBuffer;
  } catch (err) {
    console.error("Error in generateResumePdf:", err?.message || err);
    if (err?.isQuotaExhausted || err?.message?.includes("quota")) {
      const quotaErr = new Error("Gemini API quota has been reached. Please try again later.");
      quotaErr.status = 429;
      quotaErr.isQuotaExhausted = true;
      throw quotaErr;
    }
    throw new Error("Failed to generate resume PDF. Please try again.");
  }
}

module.exports = {
  generateInterviewReport,
  generateResumePdf,
  generateGeminiContent,
  classifyGeminiError,
  extractRetryDelayMs,
  isDailyOrProjectQuotaExhausted,
  isAuthError,
  isModelUnavailable,
  isTemporaryRateLimit,
  isTransientServerError,
  setAiClientForTesting,
  GEMINI_MODEL,
  FALLBACK_MODELS,
};
