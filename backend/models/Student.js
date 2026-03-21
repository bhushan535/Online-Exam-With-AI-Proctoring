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

studentSchema.index({ enrollmentNo: 1, organizationId: 1, addedBy: 1 }, { unique: true });

module.exports = mongoose.model("Student", studentSchema);
