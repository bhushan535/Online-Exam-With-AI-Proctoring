import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import "./AttemptExam.css";

function AttemptExam() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exams, setExams] = useState([]);

  // Support both context-based user and legacy student object
  const student = user || JSON.parse(localStorage.getItem("student") || "{}");

  useEffect(() => {
    const classId = student.classId || (student.role === 'student' ? student.classId : null);
    if (!classId) return;

    axios.get(`/api/exams/student/${classId}`)
      .then(res => {
        const published = res.data.filter(e => e.isPublished);
        setExams(published);
      })
      .catch(err => console.error("Error fetching exams:", err));
  }, [student]);

/* EXAM STATUS */

const getStatus = (exam) => {
  const now = new Date();

  // Compare just the dates first
  const today = new Date();
  today.setHours(0,0,0,0);
  const examOnlyDate = new Date(exam.examDate);
  examOnlyDate.setHours(0,0,0,0);

  if (examOnlyDate < today) return "ENDED";
  if (examOnlyDate > today) return "UPCOMING";

  // It's today. Check exact times if available.
  if (exam.startTime) {
    const [startHour, startMin] = exam.startTime.split(':').map(Number);
    const examStart = new Date(exam.examDate);
    examStart.setHours(startHour, startMin, 0, 0);

    let examEnd = null;
    if (exam.endTime) {
       const [endHour, endMin] = exam.endTime.split(':').map(Number);
       examEnd = new Date(exam.examDate);
       examEnd.setHours(endHour, endMin, 0, 0);
    } else if (exam.duration) {
       examEnd = new Date(examStart.getTime() + exam.duration * 60000);
    }

    if (now < examStart) return "UPCOMING";
    if (examEnd && now > examEnd) return "ENDED";
    return "AVAILABLE";
  }

  return "AVAILABLE";
};

if(!student){
return <div className="attempt-exam-page"><h2>Please login again</h2></div>;
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

<p><b>Branch:</b> {exam.branch || "N/A"}</p>

<p><b>Semester:</b> {exam.semester || "N/A"}</p>

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