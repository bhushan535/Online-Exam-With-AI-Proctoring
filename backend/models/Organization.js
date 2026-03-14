const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['school', 'college', 'university', 'coaching'],
    required: true,
  },
  principalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  logo: {
    type: String,
  },
  address: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  teachers: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      department: {
        type: String,
      },
      employeeId: {
        type: String,
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active',
      },
    },
  ],
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  settings: {
    allowTeacherStudentAdd: {
      type: Boolean,
      default: true,
    },
    requirePrincipalApproval: {
      type: Boolean,
      default: false,
    },
    examSharingEnabled: {
      type: Boolean,
      default: true,
    },
  },
});

module.exports = mongoose.model('Organization', organizationSchema);
