// src/routes/aiRoutes.js
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { suggestDecisionData } = require("../controllers/aiController");

const router = express.Router();

router.post("/suggest", protect, suggestDecisionData);

module.exports = router;
