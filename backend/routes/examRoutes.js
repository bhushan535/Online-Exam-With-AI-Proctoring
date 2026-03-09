const express = require("express");
const router = express.Router();

const Exam = require("../models/Exam");
const Student = require("../models/Student");
const ExamAccess = require("../models/ExamAccess");

/* ======================
CREATE EXAM
====================== */

router.post("/exams", async (req,res)=>{

try{

const{
examName,
branch,
year,
semester,
subject,
subCode,
examDate,
totalQuestions,
duration,
totalMarks,
classId
}=req.body;

if(
!examName ||
!branch ||
!year ||
!semester ||
!subject ||
!subCode ||
!examDate ||
!classId
){
return res.status(400).json({
success:false,
message:"Missing required fields"
});
}

const safeDate = new Date(examDate);

const exam = new Exam({

examName,
branch,
year,
semester,
subject,
subCode,

examDate:safeDate,

totalQuestions:Number(totalQuestions) || 0,
duration:Number(duration) || 0,
totalMarks:Number(totalMarks) || 0,

classId,

isPublished:false

});

await exam.save();

res.status(201).json({
success:true,
message:"Exam created successfully",
exam
});

}
catch(err){

console.error("CREATE EXAM ERROR:",err);

res.status(500).json({
success:false,
message:err.message
});

}

});

/* ======================
GET ALL EXAMS
====================== */

router.get("/exams", async (req,res)=>{

try{

const exams = await Exam.find().sort({createdAt:-1});

res.json(exams);

}
catch(err){

console.error("GET EXAMS ERROR:",err);

res.status(500).json({
message:err.message
});

}

});

/* ======================
PUBLISH / UNPUBLISH
====================== */

router.put("/exams/toggle-publish/:id", async (req,res)=>{

try{

const exam = await Exam.findById(req.params.id);

if(!exam){

return res.status(404).json({
success:false,
message:"Exam not found"
});

}

/* toggle publish */

exam.isPublished = !exam.isPublished;

await exam.save();

res.json({

success:true,
message: exam.isPublished ? "Exam Published" : "Exam Unpublished",
exam

});

}
catch(err){

console.error("TOGGLE PUBLISH ERROR:",err);

res.status(500).json({
success:false,
message:err.message
});

}

});

/* ======================
GENERATE STUDENT CODES
====================== */

router.post("/exams/generate-codes/:examId", async (req,res)=>{

try{

const examId = req.params.examId;
const {classId} = req.body;

/* find students in class */

const students = await Student.find({classId});

if(!students.length){

return res.json([]);

}

const codes = [];

/* generate unique codes */

for(const student of students){

const code = Math.floor(100000 + Math.random()*900000).toString();

const access = new ExamAccess({

examId,
studentId:student._id,
accessCode:code,
used:false

});

await access.save();

codes.push({

studentName:student.name,
studentId:student._id,
code

});

}

res.json(codes);

}
catch(err){

console.error("GENERATE CODES ERROR:",err);

res.status(500).json({
message:err.message
});

}

});

/* ======================
   GET EXAMS FOR STUDENT
====================== */

router.get("/exams/student/:classId", async (req, res) => {

  try {

    const exams = await Exam.find({
      classId: req.params.classId,
      isPublished: true
    }).sort({ examDate: 1 });

    res.json(exams);

  } catch (err) {

    console.error("STUDENT EXAMS ERROR:", err);

    res.status(500).json({
      message: err.message
    });

  }

});

module.exports = router;
