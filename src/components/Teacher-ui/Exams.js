import React, { useEffect, useState } from "react";
import "./Exams.css";
import { FaBookOpen, FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Toast      from "../Toast";
import useToast   from "../useToast";
import PopupModal from "../PopupModal";
import { BASE_URL } from '../../config';

function Exams(){
const { token } = useAuth();
const [exams,setExams] = useState([]);
const [activeTab, setActiveTab] = useState("my"); // "my" or "org"
const [search,setSearch] = useState("");
const [showCodes,setShowCodes] = useState(false);
const [codes,setCodes] = useState([]);

const [deleteModal, setDeleteModal] = useState({ open: false, targetId: null });

const { toasts, showToast, removeToast } = useToast();

const navigate = useNavigate();
const location = useLocation();

/* FETCH EXAMS */

const fetchExams = async()=>{
try{
const res = await fetch(`${BASE_URL}/exams`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
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
if (token) fetchExams();

const interval = setInterval(()=>{
if (token) fetchExams();
},30000);

return ()=>clearInterval(interval);

},[token]);

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

const confirmDeleteExam = async (id) => {
  await fetch(`${BASE_URL}/exams/${id}`, { 
    method: "DELETE",
    headers: { 'Authorization': `Bearer ${token}` }
  });
  fetchExams();
  showToast("Exam deleted.", "info");
};

/* TOGGLE PUBLISH */

const togglePublish = async(exam)=>{
try{
const res = await fetch(`${BASE_URL}/exams/toggle-publish/${exam._id}`,{
method:"PUT",
headers: { 'Authorization': `Bearer ${token}` }
});

const data = await res.json();

if(res.ok){
showToast(data.message || "Publish status updated!", "success");
fetchExams();
}
else{
showToast(data.message || "Failed to update", "error");
}

}
catch(err){
console.error(err);
showToast("Server error", "error");
}

};

/* CLONE EXAM */
const handleClone = async (examId) => {
  try {
    const res = await fetch(`${BASE_URL}/exams/clone/${examId}`, {
      method: "POST",
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast("Exam cloned! Check your (Copy) exam.", "success");
      fetchExams();
    } else {
      showToast(data.message, "error");
    }
  } catch (err) {
    showToast("Cloning failed", "error");
  }
};

/* GENERATE STUDENT CODES */

const generateCodes = async(exam)=>{

try{

const res = await fetch(
`${BASE_URL}/exams/generate-codes/${exam._id}`,
{
method:"POST",
headers:{
"Content-Type":"application/json",
"Authorization": `Bearer ${token}`
},
body:JSON.stringify({
classId:exam.classId
})
}
);

const data = await res.json();

/* FIX FOR MAP ERROR */

if(Array.isArray(data)){
setCodes(data);
}
else{
setCodes([]);
console.log("Server response:",data);
}

setShowCodes(true);

}
catch(err){

console.error(err);
setCodes([]);
showToast("Failed to generate codes", "error");

}

};

/* SEARCH & TAB FILTER */

const filteredExams = exams.filter((exam) => {
  const matchesSearch = exam.examName.toLowerCase().includes(search.toLowerCase());
  
  if (activeTab === "my") {
    // Show exams created by me
    return matchesSearch && exam.createdBy === (user?._id || user?.id);
  } else {
    // Show exams shared by others in organization
    return matchesSearch && exam.createdBy !== (user?._id || user?.id) && exam.visibility === 'organization';
  }
});

/* STATS */

const total = exams.length;
const available = exams.filter(e=>getStatus(e)==="AVAILABLE").length;
const draft = exams.filter(e=>getStatus(e)==="DRAFT").length;
const ended = exams.filter(e=>getStatus(e)==="ENDED").length;

return(

<div className="exam-page">

<Toast toasts={toasts} removeToast={removeToast} />

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

<div className="exam-tabs">
  <button 
    className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`} 
    onClick={() => setActiveTab('my')}
  >
    My Exams
  </button>
  <button 
    className={`tab-btn ${activeTab === 'org' ? 'active' : ''}`} 
    onClick={() => setActiveTab('org')}
  >
    Organization Library
  </button>
</div>

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

</div>

<div className="exam-btns">
  {activeTab === "my" ? (
    <>
      <button className="edit-btn" onClick={() => navigate(`/edit-exam/${exam._id}`)}>
        <FaEdit /> Edit
      </button>
      <button className="delete-btn" onClick={() => setDeleteModal({ open: true, targetId: exam._id })}>
        <FaTrash /> Delete
      </button>
      <button className="add-btn" onClick={() => navigate(`/add-question/${exam._id}`)}>
        <FaPlus /> Add
      </button>
      <button className="send-btn" onClick={() => togglePublish(exam)}>
        {exam.isPublished ? "Unpublish" : "Publish"}
      </button>
      <button className="code-btn" onClick={() => generateCodes(exam)}>
        Codes
      </button>
      <button className="clone-btn" onClick={() => handleClone(exam._id)} style={{ background: "#10b981" }}>
        Clone
      </button>
      <button className="result-btn" onClick={() => navigate(`/student-results/${exam._id}`)}>
        Results
      </button>
    </>
  ) : (
    <>
      <button className="clone-btn" onClick={() => handleClone(exam._id)} style={{ background: "#10b981", gridColumn: "span 2" }}>
        Clone to My Library
      </button>
      <button className="result-btn" onClick={() => navigate(`/student-results/${exam._id}`)}>
        View Results
      </button>
    </>
  )}
</div>

</div>

);

})

}

</div>

{/* POPUP */}

{showCodes && (

<div className="code-popup">

<div className="code-box">

<h3>Student Exam Codes</h3>

<table>

<thead>
<tr>
<th>Student</th>
<th>Code</th>
</tr>
</thead>

<tbody>

{Array.isArray(codes) && codes.map((c,index)=>(

<tr key={index}>
<td>{c.studentName}</td>
<td>{c.code}</td>
</tr>

))}

</tbody>

</table>

<button onClick={()=>setShowCodes(false)}>
Close </button>

</div>

</div>

)}

{/* Delete Exam Confirmation */}
<PopupModal
  isOpen={deleteModal.open}
  type="error"
  title="Delete Exam?"
  message="Are you sure you want to delete this exam? All related questions, codes, and results will be permanently removed."
  confirmText="Yes, Delete"
  cancelText="Cancel"
  confirmColor="#dc2626"
  onConfirm={async () => {
    await confirmDeleteExam(deleteModal.targetId);
    setDeleteModal({ open: false, targetId: null });
  }}
  onCancel={() => setDeleteModal({ open: false, targetId: null })}
/>

</div>

);

}

export default Exams;
