require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const {
  generateGeminiContent,
  classifyGeminiError,
  extractRetryDelayMs,
  isDailyOrProjectQuotaExhausted,
  isAuthError,
  isModelUnavailable,
  isTemporaryRateLimit,
  setAiClientForTesting,
  GEMINI_MODEL,
  FALLBACK_MODELS,
} = require("../src/services/ai.service");

const results = [];

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`[PASS] ${testName} ${details ? "- " + details : ""}`);
    results.push({ name: testName, status: "PASS", details });
  } else {
    console.error(`[FAIL] ${testName} ${details ? "- " + details : ""}`);
    results.push({ name: testName, status: "FAIL", details });
  }
}

async function runTests() {
  console.log("==================================================================");
  console.log("   HIREPILOT GEMINI MODEL AVAILABILITY & QUOTA HANDLING TESTS    ");
  console.log("==================================================================");

  try {
    // ── 1. Model Configuration Checks ──────────────────────────────────────────
    console.log("\n--- 1. Model Configuration & Fallback List ---");
    assert(
      GEMINI_MODEL === "gemini-3.8-flash",
      "Primary Gemini Model",
      `Primary model is configured as "${GEMINI_MODEL}"`
    );

    assert(
      !FALLBACK_MODELS.includes("gemini-2.5-flash"),
      "Fallback Models Exclusion",
      "gemini-2.5-flash is not present in fallback models"
    );

    assert(
      FALLBACK_MODELS.includes("gemini-3.7-flash"),
      "Fallback Candidates",
      `Fallback candidates: ${FALLBACK_MODELS.join(", ")}`
    );

    // ── 2. Error Classifier Unit Tests ────────────────────────────────────────
    console.log("\n--- 2. Error Classification & Delay Extraction ---");

    // 2.1 Daily quota error
    const dailyQuotaErr = {
      status: 429,
      message:
        "Quota exceeded for quota metric 'GenerateRequestsPerDayPerModel-FreeTier' and limit '20' of service 'generativelanguage.googleapis.com' for consumer 'projects/12345'",
      errorDetails: [
        {
          "@type": "type.googleapis.com/google.rpc.ErrorInfo",
          reason: "RESOURCE_EXHAUSTED",
          metadata: {
            quota_metric: "GenerateRequestsPerDayPerModel-FreeTier",
          },
        },
      ],
    };
    assert(
      isDailyOrProjectQuotaExhausted(dailyQuotaErr),
      "Daily Quota Exhaustion Detection",
      "Correctly detects GenerateRequestsPerDayPerModel-FreeTier as daily quota"
    );
    const dailyClassification = classifyGeminiError(dailyQuotaErr);
    assert(
      dailyClassification.type === "DAILY_QUOTA_EXHAUSTED" &&
      dailyClassification.allowModelFallback === false &&
      dailyClassification.retryable === false,
      "Daily Quota Classification",
      "Classified with allowModelFallback: false, retryable: false"
    );

    // 2.2 Temporary rate limit with retryDelay
    const tempRpmErr = {
      status: 429,
      message: "Resource exhausted: Rate limit exceeded for RPM. Please retry after 27s",
      errorDetails: [
        {
          "@type": "type.googleapis.com/google.rpc.RetryInfo",
          retryDelay: "27s",
        },
      ],
    };
    assert(
      !isDailyOrProjectQuotaExhausted(tempRpmErr),
      "Temporary Rate Limit Is Not Daily",
      "RPM rate limit is correctly distinguished from daily quota"
    );
    assert(
      isTemporaryRateLimit(tempRpmErr),
      "Temporary Rate Limit Detection",
      "Correctly identifies transient rate limit"
    );
    const extractedDelay = extractRetryDelayMs(tempRpmErr);
    assert(
      extractedDelay === 27000,
      "RetryDelay Extraction",
      `Extracted ${extractedDelay}ms (expected 27000ms)`
    );

    // 2.3 Auth error
    const authErr = {
      status: 401,
      message: "API_KEY_INVALID: API key not valid. Please pass a valid API key.",
    };
    assert(isAuthError(authErr), "Auth Error Detection", "Detects 401 / API_KEY_INVALID");
    const authClassification = classifyGeminiError(authErr);
    assert(
      authClassification.type === "AUTH_ERROR" &&
      authClassification.allowModelFallback === false,
      "Auth Error Classification",
      "Classified as AUTH_ERROR with no fallback allowed"
    );

    // 2.4 Model unavailable 404
    const notFoundErr = {
      status: 404,
      message: "models/gemini-test is not found for api version v1beta",
    };
    assert(isModelUnavailable(notFoundErr), "Model Unavailable Detection", "Detects 404 model not found");
    const modelUnavailableClassification = classifyGeminiError(notFoundErr);
    assert(
      modelUnavailableClassification.type === "MODEL_UNAVAILABLE" &&
      modelUnavailableClassification.allowModelFallback === true,
      "Model Unavailable Classification",
      "Classified as MODEL_UNAVAILABLE with allowModelFallback: true"
    );

    // ── 3. Flow Verification with Mock AI Client ──────────────────────────────
    console.log("\n--- 3. Flow Verification: Successful Generation ---");
    let callHistory = [];
    const mockSuccessClient = {
      models: {
        generateContent: async ({ model }) => {
          callHistory.push({ model });
          return { text: JSON.stringify({ success: true, message: "OK" }) };
        },
      },
    };
    setAiClientForTesting(mockSuccessClient);

    const successRes = await generateGeminiContent({
      contents: "Hello",
      model: "gemini-3.8-flash",
    });
    assert(
      callHistory.length === 1 && callHistory[0].model === "gemini-3.8-flash",
      "Successful Generation on Primary Model",
      `Called exactly 1 time on ${callHistory[0]?.model}`
    );
    assert(successRes.text.includes("OK"), "Success Response Content", "Received expected model response");

    // ── 4. Flow Verification: 404 Fallback Allowed ────────────────────────────
    console.log("\n--- 4. Flow Verification: 404 Model Unavailable -> Fallback ---");
    callHistory = [];
    const mockFallbackClient = {
      models: {
        generateContent: async ({ model }) => {
          callHistory.push({ model });
          if (model === "gemini-3.8-flash") {
            const err = new Error("models/gemini-3.8-flash is not found for api version");
            err.status = 404;
            throw err;
          }
          return { text: JSON.stringify({ success: true, from: model }) };
        },
      },
    };
    setAiClientForTesting(mockFallbackClient);

    const fallbackRes = await generateGeminiContent({
      contents: "Hello",
      model: "gemini-3.8-flash",
    });
    assert(
      callHistory.length === 2 &&
      callHistory[0].model === "gemini-3.8-flash" &&
      callHistory[1].model === "gemini-3.7-flash",
      "Model Fallback on 404",
      `Tried primary (${callHistory[0]?.model}), then fell back to (${callHistory[1]?.model})`
    );
    assert(
      fallbackRes.text.includes("gemini-3.7-flash"),
      "Fallback Response Delivered",
      "Successfully received response from fallback model"
    );

    // ── 5. Flow Verification: Temporary 429 -> Retry with Backoff ─────────────
    console.log("\n--- 5. Flow Verification: Temporary 429 -> Retry with Backoff ---");
    callHistory = [];
    let attemptsOnSameModel = 0;
    const mockTemp429Client = {
      models: {
        generateContent: async ({ model }) => {
          callHistory.push({ model, attempt: ++attemptsOnSameModel });
          if (attemptsOnSameModel === 1) {
            const err = new Error("Rate limit exceeded for RPM. Please retryDelay: 0.1s");
            err.status = 429;
            err.errorDetails = [
              {
                "@type": "type.googleapis.com/google.rpc.RetryInfo",
                retryDelay: "0.1s",
              },
            ];
            throw err;
          }
          return { text: JSON.stringify({ success: true, attempt: attemptsOnSameModel }) };
        },
      },
    };
    setAiClientForTesting(mockTemp429Client);

    const retryRes = await generateGeminiContent({
      contents: "Hello",
      model: "gemini-3.8-flash",
    });
    assert(
      callHistory.length === 2 &&
      callHistory[0].model === "gemini-3.8-flash" &&
      callHistory[1].model === "gemini-3.8-flash",
      "Temporary 429 Retry on Same Model",
      "Retried on the same model without model switching"
    );
    assert(
      retryRes.text.includes('"attempt":2'),
      "Retry Succeeded",
      "Second attempt succeeded after retry delay"
    );

    // ── 6. Flow Verification: Daily Free-Tier Quota -> No Fallback & No Retries ─
    console.log("\n--- 6. Flow Verification: Daily Free-Tier Quota Exhausted ---");
    callHistory = [];
    const mockDailyQuotaClient = {
      models: {
        generateContent: async ({ model }) => {
          callHistory.push({ model });
          const err = new Error(
            "Quota exceeded for quota metric 'GenerateRequestsPerDayPerModel-FreeTier' and limit '20' of service 'generativelanguage.googleapis.com'"
          );
          err.status = 429;
          throw err;
        },
      },
    };
    setAiClientForTesting(mockDailyQuotaClient);

    let quotaCaught = null;
    try {
      await generateGeminiContent({
        contents: "Hello",
        model: "gemini-3.8-flash",
      });
    } catch (e) {
      quotaCaught = e;
    }

    assert(
      quotaCaught !== null,
      "Daily Quota Threw Error",
      `Error thrown: "${quotaCaught?.message}"`
    );
    assert(
      quotaCaught?.isQuotaExhausted === true,
      "isQuotaExhausted Flag Set",
      "Error has isQuotaExhausted: true"
    );
    assert(
      quotaCaught?.message === "Gemini API quota has been reached. Please try again later.",
      "User-friendly Quota Error Message",
      "Returned exact clean user-friendly quota message"
    );
    assert(
      callHistory.length === 1,
      "Zero Retries and Zero Model Fallbacks on Daily Quota",
      `Exactly 1 call made (actual: ${callHistory.length}). No wasteful API calls.`
    );

    // ── 7. Flow Verification: Auth Error -> No Fallback ────────────────────────
    console.log("\n--- 7. Flow Verification: Authentication Error ---");
    callHistory = [];
    const mockAuthClient = {
      models: {
        generateContent: async ({ model }) => {
          callHistory.push({ model });
          const err = new Error("API_KEY_INVALID: API key not valid.");
          err.status = 401;
          throw err;
        },
      },
    };
    setAiClientForTesting(mockAuthClient);

    let authCaught = null;
    try {
      await generateGeminiContent({
        contents: "Hello",
        model: "gemini-3.8-flash",
      });
    } catch (e) {
      authCaught = e;
    }

    assert(
      authCaught !== null && authCaught?.isAuthError === true,
      "Auth Error Thrown",
      `Error: "${authCaught?.message}"`
    );
    assert(
      callHistory.length === 1,
      "Zero Fallbacks on Auth Error",
      `Exactly 1 call made (actual: ${callHistory.length}). Stopped immediately.`
    );

    // ── 8. Flow Verification: All Models Unavailable -> Clean Error ───────────
    console.log("\n--- 8. Flow Verification: All Models Unavailable ---");
    callHistory = [];
    const mockAll404Client = {
      models: {
        generateContent: async ({ model }) => {
          callHistory.push({ model });
          const err = new Error(`models/${model} is not found`);
          err.status = 404;
          throw err;
        },
      },
    };
    setAiClientForTesting(mockAll404Client);

    let all404Caught = null;
    try {
      await generateGeminiContent({
        contents: "Hello",
        model: "gemini-3.8-flash",
      });
    } catch (e) {
      all404Caught = e;
    }

    assert(
      all404Caught !== null,
      "All Models 404 Threw Error",
      `Error: "${all404Caught?.message}"`
    );
    assert(
      all404Caught?.message.includes("All configured Gemini models are currently unavailable"),
      "Clean Final Error for Unavailable Models",
      "Clean final error returned without exposing API internals"
    );
    assert(
      callHistory.length >= 2,
      "Candidate Models Attempted",
      `Attempted ${callHistory.length} candidates: ${callHistory.map((c) => c.model).join(", ")}`
    );

  } catch (err) {
    console.error("Test execution encountered an error:", err);
    results.push({ name: "Global Execution", status: "FAIL", details: err.message });
  } finally {
    // Reset test client
    setAiClientForTesting(null);

    console.log("\n==================================================================");
    console.log("                      TEST SUMMARY REPORT                         ");
    console.log("==================================================================");
    const passed = results.filter((r) => r.status === "PASS").length;
    const failed = results.filter((r) => r.status === "FAIL").length;
    console.log(`TOTAL: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);

    if (failed > 0) {
      console.error("\nSome Gemini model & quota tests failed!");
      process.exit(1);
    } else {
      console.log("\nAll Gemini model availability and quota handling tests PASSED!");
      process.exit(0);
    }
  }
}

runTests();
