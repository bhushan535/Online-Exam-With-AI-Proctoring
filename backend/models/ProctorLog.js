const mongoose = require("mongoose");

const ProctorLogSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true,
  },
  studentId: {
    type: String, // Enrollment number or student ID string
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  snapshot: {
    type: String, // Base64 image data
    default: null,
  },
  meta: {
    count: { type: Number, default: null },
    duration: { type: Number, default: null },
    object: { type: String, default: null },
    direction: { type: String, default: null },
    key: { type: String, default: null },
    tabTitle: { type: String, default: null },
    dB: { type: Number, default: null },
  },
}, { timestamps: true });

module.exports = mongoose.model("ProctorLog", ProctorLogSchema);
