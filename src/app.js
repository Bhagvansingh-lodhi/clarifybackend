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

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:5173", // later change for frontend URL
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/api/auth", authRoutes);
app.use("/api/decisions", decisionRoutes);


// Rate limiter (basic)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Routes
app.get("/", (req, res) => {
  res.send("DecisionAI Backend API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/decisions", decisionRoutes);
app.use("/api/ai", aiRoutes);


// Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
