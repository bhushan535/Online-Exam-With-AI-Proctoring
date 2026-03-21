const mongoose = require('mongoose');

const teacherProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mode: {
    type: String,
    enum: ['solo', 'organization'],
  },
  classesCreated: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
  ],
  examsCreated: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
    },
  ],
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
  },
  department: {
    type: String,
  },
  employeeId: {
    type: String,
  },
  designation: {
    type: String,
  },
  phone: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('TeacherProfile', teacherProfileSchema);
