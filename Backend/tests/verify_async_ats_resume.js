const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const http = require("http");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const interviewReportModel = require("../src/models/interviewReport.model");
const userModel = require("../src/models/user.model");
const atsResumeService = require("../src/services/atsResume.service");

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

function makeRequest(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = null;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json,
          rawBody: data,
        });
      });
    });
    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("==================================================================");
  console.log("   HIREPILOT ASYNC ATS RESUME GENERATION & UX AUTOMATED TESTS     ");
  console.log("==================================================================");

  let server;
  let baseUrl;
  let testUserA;
  let testUserB;
  let tokenA;
  let tokenB;
  let reportA;

  try {
    // ── 1. Model Schema Tests ──────────────────────────────────────────────────
    console.log("\n--- 1. Testing InterviewReport Schema for ATS Resume ---");
    const atsSchema = interviewReportModel.schema.path("atsResume");
    assert(!!atsSchema, "atsResume Schema Field", "atsResume subdocument is registered");

    const statusOptions = interviewReportModel.schema.path("atsResume.status").options;
    assert(
      statusOptions.enum &&
      statusOptions.enum.includes("not_started") &&
      statusOptions.enum.includes("generating") &&
      statusOptions.enum.includes("ready") &&
      statusOptions.enum.includes("failed"),
      "atsResume.status Enum",
      "Status allows [not_started, generating, ready, failed]"
    );
    assert(statusOptions.default === "not_started", "atsResume.status Default", "Defaults to 'not_started'");

    const pdfDataOptions = interviewReportModel.schema.path("atsResume.pdfData").options;
    assert(pdfDataOptions.select === false, "atsResume.pdfData select: false", "Protected against accidental RAM bloat in list queries");

    // ── 2. Connect Database ───────────────────────────────────────────────────
    console.log("\n--- 2. Connecting to MongoDB ---");
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    assert(mongoose.connection.readyState === 1, "Database Connectivity", "Mongoose connected successfully");

    // Create / find test users
    testUserA = await userModel.findOne({ email: "test_ats_user_a@hirepilot.test" });
    if (!testUserA) {
      testUserA = await userModel.create({
        username: "ats_user_a",
        email: "test_ats_user_a@hirepilot.test",
        password: "Password123!",
      });
    }

    testUserB = await userModel.findOne({ email: "test_ats_user_b@hirepilot.test" });
    if (!testUserB) {
      testUserB = await userModel.create({
        username: "ats_user_b",
        email: "test_ats_user_b@hirepilot.test",
        password: "Password123!",
      });
    }

    const jwtSecret = process.env.JWT_SECRET || "default_jwt_secret";
    tokenA = jwt.sign({ id: testUserA._id, email: testUserA.email }, jwtSecret, { expiresIn: "1h" });
    tokenB = jwt.sign({ id: testUserB._id, email: testUserB.email }, jwtSecret, { expiresIn: "1h" });

    // ── 3. Start Live Server ──────────────────────────────────────────────────
    console.log("\n--- 3. Starting Test HTTP Server ---");
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        console.log(`Test server running at ${baseUrl}`);
        resolve();
      });
    });

    // ── 4. Test Report Creation with Background Generation ─────────────────────
    console.log("\n--- 4. Testing Report Creation & Background Job Isolation ---");
    reportA = await interviewReportModel.create({
      user: testUserA._id,
      title: "Senior Full Stack Engineer",
      jobDescription: "React Node.js MongoDB Puppeteer AI",
      resume: "Experience with React, Node, Express, MongoDB, ATS Resumes",
      selfDescription: "Software engineer with 5 years experience",
      matchScore: 88,
      technicalQuestions: [{ question: "Explain event loop", intention: "Check JS fundamentals", answer: "Call stack + event queue" }],
      behavioralQuestions: [{ question: "Describe a conflict", intention: "Check EQ", answer: "STAR technique" }],
      preparationPlan: [{ day: 1, focus: "React internals", tasks: ["Virtual DOM", "Fiber"] }],
      skillGaps: [{ skill: "Docker", severity: "medium" }],
      atsResume: {
        status: "not_started",
      },
    });

    assert(reportA._id, "Test Report Created", `Report ID: ${reportA._id}`);

    // Query report directly: verify pdfData is NOT selected by default
    const queriedReport = await interviewReportModel.findById(reportA._id).lean();
    assert(queriedReport.atsResume.pdfData === undefined, "pdfData Projection Safeguard", "pdfData is undefined in default findById query");

    // ── 5. Test Status API Endpoint ───────────────────────────────────────────
    console.log("\n--- 5. Testing GET /api/interview/:id/resume/status ---");
    // User A querying their own report
    const statusResA = await makeRequest(`${baseUrl}/api/interview/${reportA._id}/resume/status`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(statusResA.statusCode === 200, "Status Endpoint HTTP 200", "User A successfully queried status");
    assert(statusResA.body?.status === "not_started", "Status Value", `Current status: ${statusResA.body?.status}`);

    // User B querying User A's report (IDOR Protection)
    const statusResB = await makeRequest(`${baseUrl}/api/interview/${reportA._id}/resume/status`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(statusResB.statusCode === 403, "IDOR Protection on Status Endpoint", "User B is rejected with HTTP 403 Forbidden");

    // ── 6. Test Download Endpoint When GENERATING ───────────────────────────────
    console.log("\n--- 6. Testing Download Endpoint While GENERATING ---");
    await interviewReportModel.findByIdAndUpdate(reportA._id, {
      "atsResume.status": "generating",
      "atsResume.errorMessage": null,
    });

    const downloadGenRes = await makeRequest(`${baseUrl}/api/interview/resume/pdf/${reportA._id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(downloadGenRes.statusCode === 409, "Download Returns 409 When Generating", "Does not block or synchronously regenerate; returns HTTP 409 Conflict");
    assert(downloadGenRes.body?.status === "generating", "409 Payload Status", "Payload contains { status: 'generating' }");

    // ── 7. Test Download Endpoint When READY (Instant Download) ─────────────────
    console.log("\n--- 7. Testing Download Endpoint When READY ---");
    const fakePdfBytes = Buffer.from("%PDF-1.4 Mock ATS Resume Content for Testing Instant Retrieval");
    await interviewReportModel.findByIdAndUpdate(reportA._id, {
      "atsResume.status": "ready",
      "atsResume.pdfData": fakePdfBytes,
      "atsResume.generatedAt": new Date(),
      "atsResume.errorMessage": null,
    });

    const downloadReadyRes = await makeRequest(`${baseUrl}/api/interview/resume/pdf/${reportA._id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(downloadReadyRes.statusCode === 200, "Download Returns 200 When Ready", "Instant retrieval of stored PDF");
    assert(downloadReadyRes.headers["content-type"] === "application/pdf", "Content-Type application/pdf", "Returns valid PDF mime type");
    assert(downloadReadyRes.rawBody.includes("%PDF-1.4"), "PDF Buffer Content", "Returns persisted PDF buffer bytes");

    // IDOR on Download: User B attempting to download User A's PDF
    const downloadIdorRes = await makeRequest(`${baseUrl}/api/interview/resume/pdf/${reportA._id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(downloadIdorRes.statusCode === 403, "IDOR Protection on PDF Download", "User B cannot download User A's PDF (HTTP 403)");

    // ── 8. Test Download Endpoint When FAILED ─────────────────────────────────
    console.log("\n--- 8. Testing Download Endpoint When FAILED ---");
    await interviewReportModel.findByIdAndUpdate(reportA._id, {
      "atsResume.status": "failed",
      "atsResume.errorMessage": "AI formatting error",
    });

    const downloadFailedRes = await makeRequest(`${baseUrl}/api/interview/resume/pdf/${reportA._id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(downloadFailedRes.statusCode === 422, "Download Returns 422 When Failed", "Returns 422 Unprocessable with retry instruction");

    // ── 9. Test Retry Endpoint ────────────────────────────────────────────────
    console.log("\n--- 9. Testing POST /api/interview/:id/resume/retry ---");
    // User B trying to retry User A's report (IDOR)
    const retryIdorRes = await makeRequest(`${baseUrl}/api/interview/${reportA._id}/resume/retry`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(retryIdorRes.statusCode === 403, "IDOR Protection on Retry", "User B cannot retry User A's resume generation (HTTP 403)");

    // User A retrying when status is failed
    const retryResA = await makeRequest(`${baseUrl}/api/interview/${reportA._id}/resume/retry`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(retryResA.statusCode === 200, "Retry Returns 200 OK", "User A successfully triggered retry");
    assert(retryResA.body?.status === "generating", "Retry Transitions to Generating", "Status is now 'generating'");

    // Duplicate retry when already generating
    const duplicateRetryRes = await makeRequest(`${baseUrl}/api/interview/${reportA._id}/resume/retry`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(duplicateRetryRes.statusCode === 200, "Duplicate Retry Handled Safely", "Returns current generating status without creating duplicate job");

    // ── 10. Test Duplicate Prevention in Background Service ───────────────────
    console.log("\n--- 10. Testing Duplicate Concurrency Prevention in Service ---");
    await interviewReportModel.findByIdAndUpdate(reportA._id, {
      "atsResume.status": "generating",
    });

    const started = await atsResumeService.triggerAtsResumeGeneration(reportA._id);
    assert(started === false, "Duplicate Job Prevented", "Service returned false when job already generating");

    // ── 11. Test Stale Job Auto-Recovery ──────────────────────────────────────
    console.log("\n--- 11. Testing Stale Job Auto-Recovery ---");
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
    await interviewReportModel.findByIdAndUpdate(
      reportA._id,
      {
        $set: {
          "atsResume.status": "generating",
          updatedAt: sixMinutesAgo,
        },
      },
      { timestamps: false }
    );

    const recoveredStatus = await atsResumeService.getAtsResumeStatus(reportA._id, testUserA._id);
    assert(recoveredStatus.status === "failed", "Stale Job Recovery", "Stale generating state (>5 mins) auto-transitions to 'failed'");
    assert(recoveredStatus.errorMessage.includes("timed out"), "Stale Error Message", "Friendly timeout message returned");

  } catch (err) {
    console.error("Test execution failed with error:", err);
    results.push({ name: "Global Execution", status: "FAIL", details: err.message });
  } finally {
    // Cleanup
    if (reportA?._id) {
      await interviewReportModel.findByIdAndDelete(reportA._id).catch(() => {});
    }
    if (testUserA?._id) {
      await userModel.findByIdAndDelete(testUserA._id).catch(() => {});
    }
    if (testUserB?._id) {
      await userModel.findByIdAndDelete(testUserB._id).catch(() => {});
    }
    if (server) {
      server.close();
    }
    await mongoose.disconnect().catch(() => {});

    console.log("\n==================================================================");
    console.log("                      TEST SUMMARY REPORT                         ");
    console.log("==================================================================");
    const passed = results.filter((r) => r.status === "PASS").length;
    const failed = results.filter((r) => r.status === "FAIL").length;
    console.log(`TOTAL: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);

    if (failed > 0) {
      console.error("\nSome tests failed!");
      process.exit(1);
    } else {
      console.log("\nAll async ATS resume generation tests PASSED successfully!");
      process.exit(0);
    }
  }
}

runTests();
