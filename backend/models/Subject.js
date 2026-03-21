const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    branch: {
      type: String,
      trim: true,
      default: "",
    },
    semester: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Unique subject name per teacher
subjectSchema.index({ name: 1, teacherId: 1 }, { unique: true });

module.exports = mongoose.model("Subject", subjectSchema);
