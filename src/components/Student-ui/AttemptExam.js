import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AttemptExam.css";

function AttemptExam() {

const navigate = useNavigate();
const [exams,setExams] = useState([]);

const student = JSON.parse(localStorage.getItem("student"));

useEffect(()=>{

if(!student || !student.classId) return;

fetch(`http://localhost:5000/api/exams/student/${student.classId}`)
.then(res=>res.json())
.then(data=>{

/* SHOW ONLY PUBLISHED EXAMS */

const published = data.filter(e => e.isPublished);
setExams(published);

});

},[student]);

/* EXAM STATUS */

const getStatus = (exam)=>{

const now = new Date();
const examDay = new Date(exam.examDate);

if(now.toDateString() === examDay.toDateString()){
return "AVAILABLE";
}

if(now < examDay){
return "UPCOMING";
}

return "ENDED";

};

if(!student){
return <h2>Please login again</h2>;
}

return(

<div className="attempt-exam-page">

<h2>Available Exams</h2>

{exams.length === 0 ?

<p>No exams available right now</p>

:

exams.map((exam)=>{

const status = getStatus(exam);

return(

<div className="exam-card" key={exam._id}>

<h3>{exam.examName}</h3>

<p><b>Subject:</b> {exam.subject}</p>

<p>
<b>Date:</b> {new Date(exam.examDate).toLocaleDateString("en-IN")}
</p>

<p>
<b>Duration:</b> {exam.duration} minutes
</p>

<p>
<b>Status:</b> {status}
</p>

{status === "AVAILABLE" ?

<button
className="start-btn"
onClick={()=>navigate(`/exam-instructions/${exam._id}`)}

>

Start Exam </button>

:

<button className="start-btn" disabled>

{status === "UPCOMING"
? "Not Started Yet"
: "Exam Ended"}

</button>

}

</div>

);

})

}

</div>

);

}

export default AttemptExam;