// src/models/Option.js
const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
  {
    decision: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Decision",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Option name is required"],
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Option = mongoose.model("Option", optionSchema);

module.exports = Option;
