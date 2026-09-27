const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { generateResumePdf } = require("../src/services/ai.service");
const { resume, selfDescription, jobDescription } = require("../src/services/temp");

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

async function runAtsResumeValidation() {
  console.log("=================================================");
  console.log("   HIREPILOT ATS RESUME PDF LAYOUT TEST SUITE   ");
  console.log("=================================================");

  try {
    // -------------------------------------------------------------
    // TEST A: Standard Junior Developer Resume (Target: 1 Page)
    // -------------------------------------------------------------
    console.log("\n--- TEST A: Normal Junior Developer Resume (Arjun Sharma Profile) ---");
    console.log("Generating Test A resume PDF with Gemini & Puppeteer...");
    const pdfBufferA = await generateResumePdf({
      resume,
      selfDescription,
      jobDescription,
      title: "Junior Full Stack Developer",
    });

    const isBufferValidA = Buffer.isBuffer(pdfBufferA) && pdfBufferA.length > 5000;
    assert(isBufferValidA, "Test A - Buffer Validity", `Valid PDF buffer generated (${(pdfBufferA.length / 1024).toFixed(1)} KB)`);

    const parserA = new pdfParse.PDFParse(Uint8Array.from(pdfBufferA));
    const infoA = await parserA.getInfo();
    const textA = (await parserA.getText())?.text || "";

    assert(infoA.total === 1, "Test A - Target 1 Page", `Generated ${infoA.total} page(s) (Expected: 1)`);
    assert(textA.includes("ARJUN SHARMA"), "Test A - Candidate Name Present", "Name parsed in PDF text");
    assert(textA.includes("MERN Stack Developer") || textA.includes("Full Stack Developer"), "Test A - Title Present", "Target role present");
    assert(textA.includes("Job Preparation") && textA.includes("E-Commerce"), "Test A - Projects Present", "Projects included");
    assert(textA.includes("Computer Science"), "Test A - Education Present", "Education included");
    assert(!textA.includes("[object Object]"), "Test A - No Object Artifacts", "No [object Object] in output");
    assert(!textA.includes("undefined"), "Test A - No Undefined Artifacts", "No undefined in output");
    assert(!textA.includes("<html") && !textA.includes("<div"), "Test A - No Raw HTML Artifacts", "No unparsed HTML tags in text");

    const outPathA = path.join(__dirname, "test_output_A_junior.pdf");
    fs.writeFileSync(outPathA, pdfBufferA);
    console.log(`Saved Test A PDF to ${outPathA}`);

    // Wait 4s between tests to prevent API rate limiting
    await new Promise((r) => setTimeout(r, 4000));

    // -------------------------------------------------------------
    // TEST B: Multi-skill Fresher with 3 Projects & Certifications (Target: 1 Page)
    // -------------------------------------------------------------
    console.log("\n--- TEST B: Fresher with 3 Projects, Skills & Certifications ---");
    const resumeB = `
PRIYA NAIR
Full Stack JavaScript Developer
Email: priya.nair@example.com | Phone: +91 91234 56789 | Location: Bangalore, India
GitHub: github.com/priyanair | LinkedIn: linkedin.com/in/priyanair

SUMMARY:
Motivated Software Developer proficient in React.js, Node.js, Express, and PostgreSQL. Experienced in creating RESTful services, integrating third-party APIs, and building responsive SPAs. Passionate about performant web architectures and agile delivery.

TECHNICAL SKILLS:
Languages: JavaScript (ES6+), TypeScript, SQL, HTML5, CSS3
Frameworks: React.js, Next.js, Node.js, Express.js, Tailwind CSS
Databases & Cloud: PostgreSQL, MongoDB, Prisma ORM, Redis, AWS S3
Tools & Practices: Git, Docker, Postman, Jest, CI/CD GitHub Actions

PROJECTS:
1. CloudNotes - Real-time Note Collaboration
Tech: React, Node.js, Socket.io, MongoDB, Docker
- Built collaborative markdown workspace supporting real-time multi-user editing with sub-50ms latency.
- Implemented role-based access control and OAuth2 login with Google and GitHub.
- Deployed microservices architecture using Docker containers on AWS EC2.

2. DevPulse - Developer Community Forum
Tech: Next.js, TypeScript, PostgreSQL, Prisma, Tailwind CSS
- Architected discussion forum with nested comment threads, vote scoring, and tag-based search.
- Designed relational schemas and indexed queries in PostgreSQL with Prisma ORM.
- Achieved 98+ Google Lighthouse score across desktop and mobile devices.

3. FinTrack - Personal Expense & Budget Tracker
Tech: React, Express.js, Chart.js, JWT, MongoDB
- Developed dashboard visualizing monthly spending trends with interactive analytics charts.
- Integrated automated CSV export and recurring budget threshold alerts.

EDUCATION:
B.Tech in Information Technology | National Institute of Technology, Karnataka | 2021 - 2025 | CGPA: 8.4/10

CERTIFICATIONS:
- AWS Certified Cloud Practitioner
- Meta Frontend Developer Professional Certificate
`;

    console.log("Generating Test B resume PDF with Gemini & Puppeteer...");
    const pdfBufferB = await generateResumePdf({
      resume: resumeB,
      selfDescription: "Aspiring full stack developer with multiple production-ready React and Node.js projects.",
      jobDescription: "Software Engineer - Frontend & Full Stack. Requirements: React, TypeScript, Node.js, REST APIs.",
      title: "Full Stack JavaScript Developer",
    });

    const isBufferValidB = Buffer.isBuffer(pdfBufferB) && pdfBufferB.length > 5000;
    assert(isBufferValidB, "Test B - Buffer Validity", `Valid PDF buffer generated (${(pdfBufferB.length / 1024).toFixed(1)} KB)`);

    const parserB = new pdfParse.PDFParse(Uint8Array.from(pdfBufferB));
    const infoB = await parserB.getInfo();
    const textB = (await parserB.getText())?.text || "";

    assert(infoB.total === 1, "Test B - Target 1 Page", `Generated ${infoB.total} page(s) (Expected: 1)`);
    assert(textB.includes("PRIYA NAIR"), "Test B - Candidate Name Present", "Name parsed in PDF text");
    assert(textB.includes("CloudNotes"), "Test B - Project 1 Present", "CloudNotes project included");
    assert(textB.includes("DevPulse"), "Test B - Project 2 Present", "DevPulse project included");
    assert(textB.includes("FinTrack"), "Test B - Project 3 Present", "FinTrack project included");
    assert(!textB.includes("[object Object]") && !textB.includes("undefined"), "Test B - Clean Text", "No formatting artifacts");

    const outPathB = path.join(__dirname, "test_output_B_fresher.pdf");
    fs.writeFileSync(outPathB, pdfBufferB);
    console.log(`Saved Test B PDF to ${outPathB}`);

    // Wait 4s between tests to prevent API rate limiting
    await new Promise((r) => setTimeout(r, 4000));

    // -------------------------------------------------------------
    // TEST C: Extensive Resume with 5 Long Projects & Multiple Jobs (Graceful Multi-Page Flow)
    // -------------------------------------------------------------
    console.log("\n--- TEST C: Extensive Senior Resume (Graceful Multi-Page Flow) ---");
    const resumeC = `
VIKRAMADITYA SEN
Lead Staff Software Architect & Engineering Manager
Email: v.sen@example.com | Phone: +1 (555) 345-6789 | Location: San Francisco, CA
LinkedIn: linkedin.com/in/vsen | Portfolio: vikramsen.io | GitHub: github.com/vsen

SUMMARY:
Seasoned engineering leader and hands-on systems architect with 12+ years of experience spearheading distributed backend systems, high-throughput financial architectures, and large-scale cloud migrations. Proven track record leading globally distributed engineering teams of 25+ engineers, optimizing database bottlenecks, and designing mission-critical enterprise platforms handling billions of transactions per month.

EXPERIENCE:
Principal Software Architect | Stripe Inc., San Francisco, CA | 2021 - Present
- Architected next-generation payment routing engine handling 45,000 requests per second with 99.999% uptime SLA.
- Led migration of monolithic Ruby on Rails core to Golang and gRPC microservices, reducing p99 latency by 64%.
- Mentored 14 senior engineers and established engineering RFC review framework across 8 cross-functional squads.
- Implemented real-time anomaly detection pipelines processing $12B+ in annual transaction volume using Kafka and Apache Flink.

Senior Engineering Lead | Uber Technologies, Seattle, WA | 2017 - 2021
- Spearheaded global driver dispatch microservice platform deployed across 600+ cities in 65 countries.
- Designed geospatial indexing algorithms using H3 hexagonal hierarchical spatial index, improving matching accuracy by 22%.
- Managed budget of $4.5M annual AWS cloud spend, reducing infrastructure costs by 31% via Kubernetes autoscaling.
- Championed zero-downtime database partition restructuring for Postgres clusters containing 20TB+ relational records.

Senior Software Engineer | Twitter Inc., Seattle, WA | 2014 - 2017
- Built scalable event bus infrastructure processing 500 million daily tweets using Apache Kafka, Finagle, and Scala.
- Re-architected notification delivery pipeline, eliminating single point of failure and decreasing queue backlog latency by 75%.
- Partnered with product and security leadership to implement end-to-end OAuth2 and SAML authentication across internal tools.

Full Stack Software Engineer | Amazon.com, Seattle, WA | 2012 - 2014
- Developed merchant fulfillment portal using Java, Spring, React, and Oracle DB for 100,000+ third-party marketplace sellers.
- Automated automated inventory reconciliation flows, cutting manual vendor audit overhead by 40 hours per week.

PROJECTS:
1. Distributed Raft Consensus Engine
Tech: Rust, Tokio, gRPC, Protobuf
- Built production-grade distributed key-value store from scratch implementing full Raft consensus specification with log compaction.
- Tested against Jepsen partition simulation framework, validating linearizability under network split and node crash conditions.

2. OpenTelemetry Performance Tracing Agent
Tech: Go, eBPF, OpenTelemetry, Prometheus, Grafana
- Developed kernel-level eBPF tracing daemon collecting socket metrics without application-level SDK instrumentation.
- Adopted by 2,000+ open-source developers on GitHub with 1.4k stars.

3. HyperFlow Workflow Orchestrator
Tech: Python, Celery, Redis, Kubernetes
- Engineered distributed DAG task scheduling system capable of coordinating 100k daily asynchronous analytical jobs.

EDUCATION:
Master of Science in Computer Science | Stanford University, Stanford, CA | 2010 - 2012
Bachelor of Science in Computer Engineering | University of Washington, Seattle, WA | 2006 - 2010

PATENTS & PUBLICATIONS:
- US Patent 10,482,192: Dynamic geospatial routing and dispatch partitioning in multi-tenant environments.
- Sen, V. et al. "High-throughput fault-tolerant consensus in geographically distributed datacenters." IEEE Trans. Parallel Distrib. Syst.
`;

    console.log("Generating Test C resume PDF with Gemini & Puppeteer...");
    const pdfBufferC = await generateResumePdf({
      resume: resumeC,
      selfDescription: "Staff Principal Engineer with 12+ years experience in large-scale distributed systems.",
      jobDescription: "VP of Engineering / Principal Architect. Requirements: Distributed systems, Go, Kubernetes, Cloud, Team Leadership.",
      title: "Principal Software Architect",
    });

    const isBufferValidC = Buffer.isBuffer(pdfBufferC) && pdfBufferC.length > 5000;
    assert(isBufferValidC, "Test C - Buffer Validity", `Valid PDF buffer generated (${(pdfBufferC.length / 1024).toFixed(1)} KB)`);

    const parserC = new pdfParse.PDFParse(Uint8Array.from(pdfBufferC));
    const infoC = await parserC.getInfo();
    const textC = (await parserC.getText())?.text || "";

    assert(infoC.total >= 1 && infoC.total <= 2, "Test C - Controlled Page Count", `Generated ${infoC.total} page(s) (Expected: 1 or 2 for extensive 12yr resume)`);
    assert(textC.includes("VIKRAMADITYA SEN"), "Test C - Candidate Name Present", "Name parsed in PDF text");
    assert(textC.includes("Stripe") || textC.includes("Uber"), "Test C - Experience Present", "Experience entries parsed in PDF text");
    assert(!textC.includes("[object Object]") && !textC.includes("undefined"), "Test C - Clean Text", "No formatting artifacts");

    const outPathC = path.join(__dirname, "test_output_C_extensive.pdf");
    fs.writeFileSync(outPathC, pdfBufferC);
    console.log(`Saved Test C PDF to ${outPathC}`);

  } catch (err) {
    console.error("Test Suite execution error:", err);
    assert(false, "Test Suite Execution", err.message);
  } finally {
    console.log("\n=================================================");
    console.log("   ATS RESUME PDF LAYOUT TEST SUMMARY");
    console.log("=================================================");
    const total = results.length;
    const passed = results.filter((r) => r.status === "PASS").length;
    const failed = results.filter((r) => r.status === "FAIL").length;
    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);

    if (failed > 0) {
      process.exitCode = 1;
    } else {
      process.exitCode = 0;
    }
  }
}

runAtsResumeValidation();
