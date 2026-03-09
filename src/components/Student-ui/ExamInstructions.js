import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ExamInstructions.css";

function ExamInstructions(){

const { examId } = useParams();
const navigate = useNavigate();

const [agree,setAgree] = useState(false);
const [exam,setExam] = useState(null);
const [enteredCode,setEnteredCode] = useState("");

/* FETCH EXAM DETAILS */

useEffect(()=>{

fetch("http://localhost:5000/api/exams")
.then(res=>res.json())
.then(data=>{

const found = data.find(e => e._id === examId);
setExam(found);

});

},[examId]);

/* START EXAM */

const startExam = ()=>{

if(!exam) return;

/* CHECK EXAM CODE */

if(enteredCode !== exam.examCode){
alert("Invalid Exam Code");
return;
}

/* SAVE INSTRUCTION ACCEPTED */

localStorage.setItem("instructionAccepted",examId);

/* NAVIGATE TO EXAM */

navigate(`/attempt-exam/${examId}`);

};

return(

<div className="instruction-page">

<h2>Examination Instructions</h2>

{exam && (

<div className="exam-details">

<p><b>Exam:</b> {exam.examName}</p>
<p><b>Subject:</b> {exam.subject}</p>
<p><b>Duration:</b> {exam.duration} minutes</p>

</div>

)}

<ul className="instruction-list">

<li>The total duration of the examination is fixed and will not be extended.</li>

<li>Once the examination starts, it cannot be paused or restarted.</li>

<li>Do not refresh or close the browser during the exam.</li>

<li>Each question carries equal marks unless specified.</li>

<li>Only one option is correct for each question.</li>

<li>The exam will automatically submit when time expires.</li>

<li>Any malpractice may result in disqualification.</li>

<li>Ensure a stable internet connection before starting.</li>

<li>The institution is not responsible for power or network failures.</li>

</ul>

{/* EXAM CODE INPUT */}

<div className="exam-code-box">

<label>Enter Exam Code</label>

<input
type="text"
placeholder="Enter exam code provided by teacher"
value={enteredCode}
onChange={(e)=>setEnteredCode(e.target.value)}
/>

</div>

{/* AGREEMENT */}

<div className="agree-box">

<input
type="checkbox"
id="agree"
checked={agree}
onChange={(e)=>setAgree(e.target.checked)}
/>

<label htmlFor="agree">
I have read and understood all the instructions and agree to follow them.
</label>

</div>

<button
className="start-btn"
disabled={!agree}
onClick={startExam}

>

Start Examination

</button>

</div>

);

}

export default ExamInstructions;