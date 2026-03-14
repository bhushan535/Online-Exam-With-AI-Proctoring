const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true,
    },

    branch: {
      type: String,
      required: true,
      trim: true,
    },

    year: {
      type: String,
      required: true,
      trim: true,
    },

    semester: {
      type: String,
      required: true,
      trim: true,
    },

    // 🔥 Students Array (NO required inside)
    students: [
      {
        rollNo: {
          type: Number,
        },

        enrollment: {
          type: String,
        },

        name: {
          type: String,
        },

        password: {
          type: String,
        },

        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },

    mode: {
      type: String,
      enum: ['solo', 'organization'],
      default: 'solo',
    },

    registrationOpen: {
      type: Boolean,
      default: true,
    },

    registrationDeadline: Date,

    maxStudents: {
      type: Number,
      default: 100,
    },

    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
    },

    academicYear: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Class", classSchema);