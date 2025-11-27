// src/app.js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const decisionRoutes = require("./routes/decisionRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

// ---------------- CORS CONFIG ----------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://clarifyai1.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // For tools like Postman / curl (no origin header)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// (optional but helps with some preflight cases)
app.options("*", cors());

// ---------------- SECURITY & MIDDLEWARES ----------------
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Rate limiter (basic) - apply before API routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use(limiter);

// ---------------- ROUTES ----------------
app.get("/", (req, res) => {
  res.send("DecisionAI Backend API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/decisions", decisionRoutes);
app.use("/api/ai", aiRoutes);

// ---------------- ERROR HANDLERS ----------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
