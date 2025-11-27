// src/models/Criteria.js
const mongoose = require("mongoose");

const criteriaSchema = new mongoose.Schema(
  {
    decision: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Decision",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Criteria name is required"],
      trim: true,
    },
    weight: {
      type: Number, // 1–5 recommended
      required: true,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

const Criteria = mongoose.model("Criteria", criteriaSchema);

module.exports = Criteria;
