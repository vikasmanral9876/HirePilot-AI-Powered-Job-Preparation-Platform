const express = require("express");
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express();

app.use(express.json());
app.use(cookieParser());
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://hirepilot-frontend-7a9v.onrender.com"
];

const envOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
      .map((url) => url.trim())
      .filter(Boolean)
  : [];

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

const mongoose = require("mongoose");

/* health check route */
app.get("/api/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? "ok" : "degraded",
    service: "HirePilot API",
    database: isDbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

// 404 catch-all handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    message: "Resource not found",
  });
});

// Central error handling middleware
app.use((err, req, res, next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File size exceeds the 10MB limit. Please upload a smaller PDF.",
    });
  }
  if (
    err &&
    (err.code === "INVALID_FILE_TYPE" || err.message?.includes("PDF"))
  ) {
    return res.status(400).json({
      message: "Invalid file type. Only PDF files are allowed.",
    });
  }
  if (err && err.message?.includes("CORS")) {
    return res.status(403).json({
      message: err.message,
    });
  }
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal server error",
  });
});

module.exports = app;