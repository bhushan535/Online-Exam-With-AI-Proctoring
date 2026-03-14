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

module.exports = mongoose.model("Exam",examSchema);
