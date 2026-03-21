const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
{
examName:{
type:String,
required:true
},

branch:{
type:String,
required:true
},

year:{
type:String,
required:true
},

semester:{
type:String,
required:true
},

subject:{
type:String,
required:true
},

subCode:{
type:String,
required:true
},

examDate:{
type:Date,
required:true
},

duration:{
type:Number,
required:true
}, // minutes

totalQuestions:{
type:Number,
required:true
},

totalMarks:{
type:Number,
required:true
},

classId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Class",
required:true
},

marksPerQuestion: { type: Number, default: 1 },

examCode:{
type:String
}, // students enter before exam

isPublished:{
type:Boolean,
default:false
},

createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
},

organizationId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Organization',
},

teacherId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true,
},

mode: {
  type: String,
  enum: ['solo', 'organization'],
  default: 'solo',
},

visibility: {
  type: String,
  enum: ['private', 'organization', 'public'],
  default: 'private',
},

editableBy: {
  type: String,
  enum: ['creator_only', 'collaborators'],
  default: 'creator_only',
},

sharedWithTeachers: [{
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  permission: {
    type: String,
    enum: ['view', 'edit'],
    default: 'view',
  },
  sharedAt: {
    type: Date,
    default: Date.now,
  },
}],

proctoringConfig: {
  enabled: { type: Boolean, default: true },
  autoSubmitLimit: { type: Number, default: 0 }, // 0 = no auto-submit
  requireFullScreen: { type: Boolean, default: false },
  disableTabSwitching: { type: Boolean, default: false },
  warningLimit: { type: Number, default: 3 },
},

status: {
  type: String,
  enum: ['draft', 'published', 'active', 'completed', 'archived'],
  default: 'draft',
},

isArchived: {
  type: Boolean,
  default: false,
}

},
{timestamps:true}
);

// Cascade delete related records when an exam is deleted
examSchema.pre('findOneAndDelete', async function (next) {
  try {
    const examId = this.getQuery()._id;
    if (!examId) return next();

    const Question = mongoose.model("Question");
    const Result = mongoose.model("Result");
    const ProctorLog = mongoose.model("ProctorLog");
    const ExamAccess = mongoose.model("ExamAccess");

    // Atomic cascade delete (best effort at DB level)
    await Promise.all([
      Question.deleteMany({ examId }),
      Result.deleteMany({ examId }),
      ProctorLog.deleteMany({ examId }),
      ExamAccess.deleteMany({ examId })
    ]);

    console.log(`[CASCADE DELETE] Automatically removed questions, results, logs, and access codes for exam ${examId}`);
    next();
  } catch (err) {
    console.error(`[CASCADE DELETE ERROR] Failed for exam ${this.getQuery()._id}:`, err);
    next(err);
  }
});

module.exports = mongoose.model("Exam",examSchema);
