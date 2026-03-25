const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  enrollmentNo: {
    type: String,
    required: true,
  },
  rollNo: {
    type: Number,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
  },
  currentSemester: {
    type: String,
  },
  currentYear: {
    type: String,
  },
  branch: {
    type: String,
  },
  academicHistory: [
    {
      year: String,
      semester: String,
      classes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Class",
        },
      ],
      examResults: [
        {
          examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },
          examName: String,
          subject: String,
          score: Number,
          totalMarks: Number,
          percentage: Number,
          grade: String
        }
      ],
      completedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  status: {
    type: String,
    enum: ["active", "graduated", "inactive"],
    default: "active",
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Handle uniqueness differently for Organization vs Solo
studentSchema.index({ enrollmentNo: 1, organizationId: 1 }, { 
  unique: true, 
  partialFilterExpression: { organizationId: { $ne: null } } 
});

studentSchema.index({ enrollmentNo: 1, addedBy: 1 }, { 
  unique: true, 
  partialFilterExpression: { organizationId: null } 
});

module.exports = mongoose.model("Student", studentSchema);
