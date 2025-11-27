// src/routes/decisionRoutes.js
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createDecision,
  getDecisions,
  getDecisionById,
  updateDecision,
  deleteDecision,
  addOption,
  addCriteria,
  addEvaluation,
  analyzeDecision,
  applyAiSuggestion, // 👈 yaha import kiya
} = require("../controllers/decisionController");

const router = express.Router();

// saare routes protected
router.use(protect);

// /api/decisions
router
  .route("/")
  .post(createDecision)
  .get(getDecisions);

// /api/decisions/:id
router
  .route("/:id")
  .get(getDecisionById)
  .put(updateDecision)
  .delete(deleteDecision);

// options, criteria, evaluations
router.post("/:id/options", addOption);
router.post("/:id/criteria", addCriteria);
router.post("/:id/evaluations", addEvaluation);

// analyze endpoint
router.post("/:id/analyze", analyzeDecision);

// 🧠 AI se aayi criteria + evaluations ko apply karne ke liye
router.post("/:id/apply-ai", applyAiSuggestion);

module.exports = router;
