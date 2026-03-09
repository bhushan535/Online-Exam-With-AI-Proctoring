const mongoose = require("mongoose");

const examAccessSchema = new mongoose.Schema({

examId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Exam",
required:true
},

studentId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Student",
required:true
},

accessCode:{
type:String,
required:true
},

used:{
type:Boolean,
default:false
}

},{timestamps:true});

module.exports = mongoose.model("ExamAccess",examAccessSchema);