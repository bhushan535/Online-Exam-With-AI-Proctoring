import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateExam.css";

function CreateExam() {

const navigate = useNavigate();

const today = new Date().toISOString().split("T")[0];

/* EXAM FIELDS */

const [examName,setExamName] = useState("");
const [subject,setSubject] = useState("");
const [subCode,setSubCode] = useState("");
const [examDate,setExamDate] = useState("");
const [totalQuestions,setTotalQuestions] = useState("");
const [duration,setDuration] = useState("");
const [totalMarks,setTotalMarks] = useState("");

/* CLASS DATA */

const [classId,setClassId] = useState("");
const [branch,setBranch] = useState("");
const [year,setYear] = useState("");
const [semester,setSemester] = useState("");

const [classes,setClasses] = useState([]);

/* FETCH CLASSES */

useEffect(()=>{

fetch("http://localhost:5000/api/classes")
.then(res=>res.json())
.then(data=>setClasses(data));

},[]);

/* SUBJECT OPTIONS */

const subjectOptions = {

"1st Sem":[{name:"BSC",code:"311305"}],

"2nd Sem":[{name:"BEE",code:"312302"}],

"3rd Sem":[{name:"SUB3",code:"313000"}],

"4th Sem":[{name:"EES",code:"314301"}],

"5th Sem":[{name:"SUB5",code:"315000"}],

"6th Sem":[
{name:"MAN",code:"315301"},
{name:"ETI",code:"316313"}
]

};

/* CLASS SELECT */

const handleClassChange = (id)=>{

setClassId(id);

const selectedClass = classes.find(c=>c._id === id);

if(!selectedClass) return;

setBranch(selectedClass.branch);
setYear(selectedClass.year);
setSemester(selectedClass.semester);

setSubject("");
setSubCode("");

};

/* SUBJECT SELECT */

const handleSubjectChange = (value)=>{

const selected = subjectOptions[semester]?.find(
s=>s.name === value
);

setSubject(value);
setSubCode(selected?.code || "");

};

/* SUBMIT */

const handleSubmit = async(e)=>{

e.preventDefault();

const examData = {

examName,
classId,
branch,
year,
semester,
subject,
subCode,
examDate,

totalQuestions:Number(totalQuestions),
duration:Number(duration),
totalMarks:Number(totalMarks)

};

const res = await fetch("http://localhost:5000/api/exams",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify(examData)

});

const data = await res.json();

if(!res.ok){

alert(data.message || "Failed to create exam");
return;

}

alert("Exam created successfully");

navigate("/Exams");

};

return (

<div className="create-exam-page">

<h2>Create Exam</h2>

<form className="create-exam-form" onSubmit={handleSubmit}>

<label>Select Class</label>

<select
value={classId}
onChange={(e)=>handleClassChange(e.target.value)}
required

>

<option value="">Select Class</option>

{classes.map((c)=>(

<option key={c._id} value={c._id}>

{c.className} ({c.branch} - {c.semester})

</option>

))}

</select>

<label>Branch</label> <input value={branch} readOnly />

<label>Year</label> <input value={year} readOnly />

<label>Semester</label> <input value={semester} readOnly />

<label>Exam Name</label>

<input
value={examName}
onChange={(e)=>setExamName(e.target.value)}
required
/>

{semester && (

<>

<label>Subject</label>

<select
value={subject}
onChange={(e)=>handleSubjectChange(e.target.value)}
required

>

<option value="">Select Subject</option>

{subjectOptions[semester]?.map((s)=>(

<option key={s.code} value={s.name}>
{s.name}
</option>

))}

</select>

</>

)}

{subCode && (

<>

<label>Subject Code</label>

<input value={subCode} readOnly />

</>

)}

<label>Exam Date</label>

<input
type="date"
value={examDate}
min={today}
onChange={(e)=>setExamDate(e.target.value)}
required
/>

<label>No. of Questions</label>

<input
type="number"
value={totalQuestions}
onChange={(e)=>setTotalQuestions(e.target.value)}
required
/>

<label>Duration (minutes)</label>

<input
type="number"
value={duration}
onChange={(e)=>setDuration(e.target.value)}
required
/>

<label>Total Marks</label>

<input
type="number"
value={totalMarks}
onChange={(e)=>setTotalMarks(e.target.value)}
required
/>

<button type="submit">
Create Exam
</button>

</form>

</div>

);

}

export default CreateExam;
