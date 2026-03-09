import React, { useEffect, useState } from "react";
import "./Exams.css";
import { FaBookOpen, FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

function Exams(){

const [exams,setExams] = useState([]);
const [search,setSearch] = useState("");

const navigate = useNavigate();
const location = useLocation();

/* FETCH EXAMS */

const fetchExams = async()=>{

try{

const res = await fetch("http://localhost:5000/api/exams");
const data = await res.json();

if(Array.isArray(data)){
setExams(data);
}
else if(Array.isArray(data.exams)){
setExams(data.exams);
}
else{
setExams([]);
}

}
catch(err){
console.error(err);
setExams([]);
}

};

useEffect(()=>{

fetchExams();

const interval = setInterval(()=>{
fetchExams();
},30000);

return ()=>clearInterval(interval);

},[]);

/* STATUS */

const getStatus = (exam)=>{

if(!exam.isPublished) return "DRAFT";

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

/* DELETE */

const deleteExam = async(id)=>{

const confirm = window.confirm("Delete this exam?");
if(!confirm) return;

await fetch(`http://localhost:5000/api/exams/${id}`,{
method:"DELETE"
});

fetchExams();

};

/* TOGGLE PUBLISH */

const togglePublish = async(exam)=>{

try{

const res = await fetch(`http://localhost:5000/api/exams/toggle-publish/${exam._id}`,{
method:"PUT"
});

const data = await res.json();

if(res.ok){

alert(data.message);
fetchExams();

}
else{

alert(data.message || "Failed");

}

}
catch(err){

console.error(err);
alert("Server error");

}

};

/* SEARCH */

const filteredExams = exams.filter((exam)=>
exam.examName.toLowerCase().includes(search.toLowerCase())
);

/* STATS */

const total = exams.length;
const available = exams.filter(e=>getStatus(e)==="AVAILABLE").length;
const draft = exams.filter(e=>getStatus(e)==="DRAFT").length;
const ended = exams.filter(e=>getStatus(e)==="ENDED").length;

return(

<div className="exam-page">

{/* NAVBAR */}

<div className="top-nav">

<button
className={location.pathname==="/TeacherHome" ? "active-nav" : ""}
onClick={()=>navigate("/TeacherHome")}

>

🏠 Home </button>

<button
className={location.pathname==="/CreateExam" ? "active-nav create-btn" : "create-btn"}
onClick={()=>navigate("/CreateExam")}

>

➕ Create Exam </button>

<button
className={location.pathname==="/Classes" ? "active-nav" : ""}
onClick={()=>navigate("/Classes")}

>

📚 Classes </button>

</div>

<h2 className="exam-title">
<FaBookOpen/> Exam Dashboard
</h2>

{/* FILTERS */}

<div className="exam-filters">

<button onClick={()=>setSearch("")}>All</button>
<button onClick={()=>setSearch("AVAILABLE")}>Available</button>
<button onClick={()=>setSearch("DRAFT")}>Draft</button>
<button onClick={()=>setSearch("ENDED")}>Ended</button>

</div>

{/* STATS */}

<div className="exam-stats">

<div className="stat-card">
<h3>{total}</h3>
<p>Total Exams</p>
</div>

<div className="stat-card live">
<h3>{available}</h3>
<p>Available</p>
</div>

<div className="stat-card draft">
<h3>{draft}</h3>
<p>Draft</p>
</div>

<div className="stat-card ended">
<h3>{ended}</h3>
<p>Ended</p>
</div>

</div>

{/* SEARCH */}

<div className="search-box">

<FaSearch/>

<input
type="text"
placeholder="Search Exam..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

</div>

{/* GRID */}

<div className="exam-grid">

{filteredExams.length===0 ?

<p className="no-exam">No Exams Found</p>

:

filteredExams.map((exam)=>{

const status = getStatus(exam);

return(

<div className="exam-card" key={exam._id}>

<div className="exam-info">

<div className="exam-header">

<h3>{exam.examName}</h3>

<span className={`status-badge ${status.toLowerCase()}`}>
{status} </span>

</div>

<p><b>Subject:</b> {exam.subject}</p>

<p>
<b>Date:</b> {new Date(exam.examDate).toLocaleDateString("en-IN")}
</p>

<p>
<b>Duration:</b> {exam.duration} minutes
</p>

<p>
<b>Total Marks:</b> {exam.totalMarks}
</p>

<p>
<b>Exam Code:</b> {exam.examCode}
</p>

</div>

<div className="exam-btns">

<button
className="edit-btn"
onClick={()=>navigate(`/edit-exam/${exam._id}`)}

>

<FaEdit/> Edit </button>

<button
className="delete-btn"
onClick={()=>deleteExam(exam._id)}

>

<FaTrash/> Delete </button>

<button
className="add-btn"
onClick={()=>navigate(`/add-question/${exam._id}`)}

>

<FaPlus/> Add </button>

<button
className="send-btn"
onClick={()=>togglePublish(exam)}

>

{exam.isPublished ? "Unpublish" : "Publish"} </button>

<button
className="result-btn"
onClick={()=>navigate(`/student-results/${exam._id}`)}

>

Results </button>

</div>

</div>

);

})

}

</div>

</div>

);

}

export default Exams;
