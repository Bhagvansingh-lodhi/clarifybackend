// src/models/Evaluation.js
const mongoose = require("mongoose");

const proConSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    impactScore: {
      type: Number, // 1–5
      required: true,
      min: 1,
      max: 5,
    },
  },
  { _id: false }
);

const evaluationSchema = new mongoose.Schema(
  {
    decision: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Decision",
      required: true,
    },
    option: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Option",
      required: true,
    },
    criteria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Criteria",
      required: true,
    },
    pros: [proConSchema],
    cons: [proConSchema],
  },
  { timestamps: true }
);

const Evaluation = mongoose.model("Evaluation", evaluationSchema);

module.exports = Evaluation;
