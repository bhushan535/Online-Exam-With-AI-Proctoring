const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  examId:      { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  studentId:   { type: String, required: true },
  studentName: { type: String, default: "" },
  semester:    { type: String, default: "" },
  year:        { type: String, default: "" },
  answers:     { type: Map, of: String },
  score:       { type: Number, required: true },
  totalMarks:  { type: Number, required: true },
  correct:     { type: Number, default: 0 },
  wrong:       { type: Number, default: 0 },
  unattempted: { type: Number, default: 0 },
  percentage:  { type: Number, default: 0 },
  grade:       { type: String, default: "F" },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Result", resultSchema);
