const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

const { vikasHtml } = require("./simulate_density_test");

// Let's create mock or actual HTML for Test A, Test B, Test C
const htmlA = `
<div class="header">
  <h1 class="name">ARJUN SHARMA</h1>
  <div class="role">Junior Full Stack Developer</div>
  <div class="contact-bar">
    <span>New Delhi, India</span> • <span>+91 98765 43210</span> • <span>arjun.sharma.dev@gmail.com</span> • <span>linkedin.com/in/arjunsharma</span> • <span>github.com/arjunsharma</span>
  </div>
</div>
<section class="section">
  <h2 class="section-title">PROFESSIONAL SUMMARY</h2>
  <p class="summary-text">Performance-driven Junior Full Stack Developer with hands-on proficiency in building scalable web applications using React.js, Node.js, Express.js, and MongoDB. Skilled in architecting secure RESTful APIs, JWT-based authentication, and responsive frontend architectures, with practical experience integrating generative AI APIs (Gemini). Strong foundation in data structures, asynchronous JavaScript, and Git collaboration workflows, committed to writing clean, maintainable code in an Agile environment.</p>
</section>
<section class="section">
  <h2 class="section-title">TECHNICAL SKILLS</h2>
  <div class="skills-grid">
    <div class="skill-item"><strong>Frontend:</strong> JavaScript (ES6+), React.js, React Hooks, HTML5, CSS3, Tailwind CSS, Axios, Vite</div>
    <div class="skill-item"><strong>Backend:</strong> Node.js, Express.js, RESTful APIs, JWT Authentication, bcrypt, Middleware, Asynchronous Programming</div>
    <div class="skill-item"><strong>Databases:</strong> MongoDB, Mongoose, MySQL, Sequelize ORM</div>
    <div class="skill-item"><strong>Tools & Practices:</strong> Git, GitHub, Postman, MongoDB Compass, VS Code, Render, Agile/Scrum Methodologies</div>
  </div>
</section>
<section class="section">
  <h2 class="section-title">KEY PROJECTS</h2>
  <div class="project-item">
    <div class="project-header">
      <span class="project-title">AI Job Preparation Platform</span>
      <span class="project-tech">React.js, Node.js, Express.js, MongoDB, JWT, Gemini API</span>
    </div>
    <ul class="bullets">
      <li>Architected an AI-powered full-stack application analyzing resumes and job descriptions to provide automated interview questions and skill-gap reports using the Google Gemini API.</li>
      <li>Engineered robust authentication with JWT and password encryption with bcrypt, securing client access through React protected routes and Express middleware.</li>
      <li>Designed optimized MongoDB schemas with Mongoose and built modular RESTful endpoints consuming asynchronous API payloads with Axios.</li>
    </ul>
  </div>
  <div class="project-item">
    <div class="project-header">
      <span class="project-title">E-Commerce Web Application</span>
      <span class="project-tech">React.js, Vite, Node.js, Express.js, Sequelize, MySQL, Render</span>
    </div>
    <ul class="bullets">
      <li>Developed an end-to-end responsive e-commerce platform incorporating product catalogs, dynamic shopping cart management, and seamless order checkout workflows.</li>
      <li>Built clean, scalable RESTful micro-endpoints using Node.js and Sequelize ORM for ACID-compliant transactional data handling in MySQL.</li>
      <li>Configured and deployed web services and production builds to Render, managing environment configs and continuous deployment.</li>
    </ul>
  </div>
  <div class="project-item">
    <div class="project-header">
      <span class="project-title">Task Management Web App</span>
      <span class="project-tech">React.js, Node.js, Express.js, MongoDB, Mongoose, Tailwind CSS</span>
    </div>
    <ul class="bullets">
      <li>Built a full-stack task organizer featuring complete CRUD capabilities, multi-status filtering, and responsive UI components styled with Tailwind CSS.</li>
      <li>Implemented custom Express route guards and JWT verification to isolate workspace data per authenticated user profile.</li>
    </ul>
  </div>
</section>
<div class="columns">
  <section class="section">
    <h2 class="section-title">EDUCATION</h2>
    <div class="edu-item">
      <div class="edu-inst">
        <span class="edu-degree">B.Tech in Computer Science and Engineering</span>
        <span>2022 – 2026</span>
      </div>
      <div style="font-size: 8.8pt; color: #4b5563; margin-top: 1px;">ABC Institute of Technology, New Delhi</div>
      <div class="edu-meta">CGPA: 8.1 / 10.0</div>
    </div>
  </section>
  <section class="section">
    <h2 class="section-title">CERTIFICATIONS & ACHIEVEMENTS</h2>
    <ul class="compact-list">
      <li>Problem Solving: Solved 150+ DSA problems across LeetCode & GeeksforGeeks.</li>
      <li>Certifications: Full Stack Web Development & Node.js/Express.js Development.</li>
      <li>Hackathons: Active participant in college-level technical hackathons and coding contests.</li>
    </ul>
  </section>
</div>
`;

const htmlB = `
<div class="header">
  <h1 class="name">PRIYA NAIR</h1>
  <div class="role">FULL STACK JAVASCRIPT DEVELOPER</div>
  <div class="contact-bar">
    <span>Bangalore, India</span> • <span>priya.nair@example.com</span> • <span>+91 91234 56789</span> • <span>linkedin.com/in/priyanair</span> • <span>github.com/priyanair</span>
  </div>
</div>
<section class="section">
  <h2 class="section-title">PROFESSIONAL SUMMARY</h2>
  <p class="summary-text">Motivated and solutions-oriented Software Developer with strong proficiency in React.js, Node.js, Express, and PostgreSQL. Experienced in architecting robust RESTful APIs, integrating standard OAuth flows, and engineering responsive single-page web applications. Passionate about maximizing frontend performance, designing efficient database systems, and collaborating within agile development lifecycles.</p>
</section>
<section class="section">
  <h2 class="section-title">TECHNICAL SKILLS</h2>
  <div class="skills-grid">
    <div class="skill-item"><strong>Languages:</strong> JavaScript (ES6+), TypeScript, SQL, HTML5, CSS3</div>
    <div class="skill-item"><strong>Databases & Cloud:</strong> PostgreSQL, MongoDB, Prisma ORM, Redis, AWS S3</div>
    <div class="skill-item"><strong>Frameworks:</strong> React.js, Next.js, Node.js, Express.js, Tailwind CSS</div>
    <div class="skill-item"><strong>Tools & Practices:</strong> Git, Docker, Postman, Jest, CI/CD GitHub Actions</div>
  </div>
</section>
<section class="section">
  <h2 class="section-title">KEY PROJECTS</h2>
  <div class="project-item">
    <div class="project-header">
      <span class="project-title">CloudNotes – Real-time Note Collaboration</span>
      <span class="project-tech">React • Node.js • Socket.io • MongoDB • Docker</span>
    </div>
    <ul class="bullets">
      <li>Engineered a collaborative markdown workspace supporting real-time multi-user synchronization with latency under 50ms.</li>
      <li>Implemented secured web routing by integrating role-based access control (RBAC) and OAuth2 protocols via Google and GitHub.</li>
      <li>Containerized microservices using Docker and successfully orchestrated deployments on AWS EC2 instances.</li>
    </ul>
  </div>
  <div class="project-item">
    <div class="project-header">
      <span class="project-title">DevPulse – Developer Community Forum</span>
      <span class="project-tech">Next.js • TypeScript • PostgreSQL • Prisma • Tailwind CSS</span>
    </div>
    <ul class="bullets">
      <li>Architected and optimized a discussion forum engine supporting complex nested comments, vote scoring, and dynamic search indexing.</li>
      <li>Designed normalized relational schemas and optimized queries in PostgreSQL utilizing Prisma ORM.</li>
      <li>Achieved excellent page loading performance resulting in a Google Lighthouse score of 98+ on desktop and mobile platforms.</li>
    </ul>
  </div>
  <div class="project-item">
    <div class="project-header">
      <span class="project-title">FinTrack – Personal Budgeting & Analytics Dashboard</span>
      <span class="project-tech">React • Express.js • Chart.js • JWT • MongoDB</span>
    </div>
    <ul class="bullets">
      <li>Developed a visually engaging finance dashboard parsing transactions and displaying monthly spending trends using Chart.js.</li>
      <li>Built clean endpoints to enable secure automated CSV spreadsheet data exports and threshold limit alerts via background jobs.</li>
    </ul>
  </div>
</section>
<div class="columns">
  <section class="section">
    <h2 class="section-title">EDUCATION</h2>
    <div class="edu-item">
      <div class="edu-inst">
        <span class="edu-degree">B.Tech in Information Technology</span>
        <span>2021 – 2025</span>
      </div>
      <div style="font-size: 8.8pt; color: #4b5563; margin-top: 1px;">National Institute of Technology, Karnataka</div>
      <div class="edu-meta">CGPA: 8.4 / 10</div>
    </div>
  </section>
  <section class="section">
    <h2 class="section-title">CERTIFICATIONS</h2>
    <ul class="compact-list">
      <li>AWS Certified Cloud Practitioner – Amazon Web Services</li>
      <li>Meta Frontend Developer Professional Certificate – Meta • Coursera</li>
    </ul>
  </section>
</div>
`;

const htmlC = `
<div class="header">
  <h1 class="name">VIKRAMADITYA SEN</h1>
  <div class="role">Principal Software Architect | Distributed Systems & Cloud Infrastructure</div>
  <div class="contact-bar">
    <span>San Francisco, CA</span> | <span>+1 (555) 345-6789</span> | <span>v.sen@example.com</span> | <span>linkedin.com/in/vsen</span> | <span>github.com/vsen</span> | <span>vikramsen.io</span>
  </div>
</div>
<section class="section">
  <h2 class="section-title">PROFESSIONAL SUMMARY</h2>
  <p class="summary-text">Accomplished Principal Software Architect and Engineering Leader with 12+ years of experience designing high-throughput distributed architectures, resilient fault-tolerant systems, and enterprise cloud migrations. Proven track record leading multi-disciplinary engineering organizations, driving microservices transitions handling 45K+ RPS, and architecting mission-critical financial platforms managing billions in transactional throughput with 99.999% availability.</p>
</section>
<section class="section">
  <h2 class="section-title">TECHNICAL SKILLS</h2>
  <div class="skills-grid">
    <div class="skill-item"><strong>Architecture & Systems:</strong> Distributed Systems, Microservices, Event-Driven, Raft Consensus, High Availability, Fault Tolerance</div>
    <div class="skill-item"><strong>Languages:</strong> Go, Rust, Java, Scala, Python, C++, SQL, gRPC/Protobuf</div>
    <div class="skill-item"><strong>Cloud & Infrastructure:</strong> Kubernetes, AWS, GCP, Docker, Terraform, CI/CD, eBPF, Prometheus, Grafana</div>
    <div class="skill-item"><strong>Data & Messaging:</strong> Apache Kafka, Apache Flink, PostgreSQL, DynamoDB, Redis, Cassandra</div>
  </div>
</section>
<section class="section">
  <h2 class="section-title">WORK EXPERIENCE</h2>
  <div class="project-item">
    <div class="project-header">
      <span class="project-title">Principal Software Architect — Stripe Inc.</span>
      <span class="project-tech">San Francisco, CA | 2021 – Present</span>
    </div>
    <ul class="bullets">
      <li>Architected next-generation payment routing engine handling 45,000 requests/sec with a 99.999% SLA and zero single points of failure.</li>
      <li>Led company-wide migration from monolithic Ruby on Rails to Golang/gRPC microservices, slashing p99 latency by 64%.</li>
      <li>Formulated real-time streaming anomaly detection pipelines processing $12B+ in annual transaction volume via Kafka and Apache Flink.</li>
      <li>Mentored 14 Staff/Senior engineers and instituted cross-organization architectural RFC standards across 8 engineering squads.</li>
    </ul>
  </div>
  <div class="project-item">
    <div class="project-header">
      <span class="project-title">Senior Engineering Lead — Uber Technologies</span>
      <span class="project-tech">Seattle, WA | 2017 – 2021</span>
    </div>
    <ul class="bullets">
      <li>Spearheaded global driver dispatch microservice platform operating across 600+ cities in 65 countries with sub-100ms response targets.</li>
      <li>Designed geospatial indexing algorithms leveraging H3 hierarchical spatial indexing, boosting matching efficiency and accuracy by 22%.</li>
      <li>Governed $4.5M annual AWS cloud spend, generating 31% cost reduction via Kubernetes auto-scaling and spot instance optimization.</li>
      <li>Executed zero-downtime horizontal database partitioning strategy across 20TB+ production PostgreSQL relational clusters.</li>
    </ul>
  </div>
  <div class="project-item">
    <div class="project-header">
      <span class="project-title">Senior Software Engineer — Twitter Inc.</span>
      <span class="project-tech">Seattle, WA | 2014 – 2017</span>
    </div>
    <ul class="bullets">
      <li>Engineered distributed event-bus pipelines processing 500M+ daily tweets using Apache Kafka, Finagle, and Scala.</li>
      <li>Re-architected notification delivery topology, eliminating processing bottlenecks and reducing queue backlog latency by 75%.</li>
      <li>Standardized enterprise OAuth2 and SAML authentication protocols across tier-1 internal engineering infrastructure.</li>
    </ul>
  </div>
</section>
<section class="section">
  <h2 class="section-title">KEY PROJECTS</h2>
  <div class="project-item">
    <div class="project-header">
      <span class="project-title">Distributed Raft Consensus Key-Value Store</span>
      <span class="project-tech">Rust, Tokio, gRPC, Protobuf, Jepsen</span>
    </div>
    <ul class="bullets">
      <li>Implemented production-ready Raft consensus engine with log compaction, snapshotting, and leader election validated by Jepsen fault-injection tests.</li>
    </ul>
  </div>
  <div class="project-item">
    <div class="project-header">
      <span class="project-title">eBPF-Based OpenTelemetry Performance Tracer</span>
      <span class="project-tech">Go, eBPF, OpenTelemetry, Prometheus</span>
    </div>
    <ul class="bullets">
      <li>Built low-overhead kernel socket metric tracing daemon without SDK overhead, adopted by 2,000+ open-source developers (1.4k GitHub stars).</li>
    </ul>
  </div>
</section>
<div class="columns">
  <section class="section">
    <h2 class="section-title">EDUCATION</h2>
    <div class="edu-item">
      <div class="edu-inst">
        <span class="edu-degree">M.S. in Computer Science</span>
        <span>2010 – 2012</span>
      </div>
      <div style="font-size: 8.8pt; color: #4b5563;">Stanford University | Stanford, CA</div>
    </div>
    <div class="edu-item" style="margin-top: 4px;">
      <div class="edu-inst">
        <span class="edu-degree">B.S. in Computer Engineering</span>
        <span>2006 – 2010</span>
      </div>
      <div style="font-size: 8.8pt; color: #4b5563;">University of Washington | Seattle, WA</div>
    </div>
  </section>
  <section class="section">
    <h2 class="section-title">PATENTS & PUBLICATIONS</h2>
    <ul class="compact-list">
      <li>US Patent 10,482,192: Dynamic geospatial routing & dispatch partitioning in distributed environments.</li>
      <li>IEEE TPDS: High-throughput fault-tolerant consensus in geographically distributed datacenters.</li>
    </ul>
  </section>
</div>
`;

module.exports = { htmlA, htmlB, htmlC };
