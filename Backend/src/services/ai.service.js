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

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/**
 * Executes a Gemini API generateContent call with automatic model fallback
 * to stable aliases (e.g. gemini-flash-latest) if the configured model is retired or overloaded.
 */
async function generateGeminiContent(params) {
  const modelCandidates = [
    params.model || GEMINI_MODEL,
    "gemini-3.7-flash",
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
  ];
  const uniqueModels = [...new Set(modelCandidates)];

  let lastError;
  for (let i = 0; i < uniqueModels.length; i++) {
    const currentModel = uniqueModels[i];
    for (let retry = 0; retry < 2; retry++) {
      try {
        const attempt = ai.models.generateContent({
          ...params,
          model: currentModel,
        });
        return await withTimeout(attempt, 22000, `Gemini Attempt (${currentModel})`);
      } catch (err) {
        lastError = err;
        const is404 =
          err?.status === 404 ||
          err?.message?.includes("no longer available") ||
          err?.message?.includes("not found") ||
          err?.message?.includes("not supported");
        const is503Or429 =
          err?.status === 503 ||
          err?.status === 429 ||
          err?.message?.includes("high demand") ||
          err?.message?.includes("overloaded") ||
          err?.message?.includes("quota") ||
          err?.message?.includes("rate limit");
        const isTimeoutOrNetwork =
          err?.code === "ETIMEDOUT" ||
          err?.name === "ConnectTimeoutError" ||
          err?.code === "UND_ERR_CONNECT_TIMEOUT" ||
          err?.message?.includes("timed out") ||
          err?.message?.includes("fetch failed") ||
          err?.message?.includes("Connect Timeout Error");

        if (is404) {
          console.warn(`Gemini model "${currentModel}" unavailable (404/retired). Trying next model...`);
          break; // Don't retry a 404 model, proceed directly to fallback
        }

        if (is503Or429 || isTimeoutOrNetwork) {
          if (retry === 0) {
            console.warn(`Gemini model "${currentModel}" transient issue (${err?.status || err?.code || "timeout"}). Retrying in 2s...`);
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          } else {
            console.warn(`Gemini model "${currentModel}" persistent transient issue (${err?.status || err?.code || "timeout"}). Moving to next candidate...`);
            break;
          }
        }

        throw err;
      }
    }
  }

  throw lastError;
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
    console.error("Gemini API Error in generateInterviewReport:", err);
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
    console.error("Error in generateResumePdf:", err);
    throw new Error("Failed to generate resume PDF. Please try again.");
  }
}

module.exports = { generateInterviewReport, generateResumePdf };
