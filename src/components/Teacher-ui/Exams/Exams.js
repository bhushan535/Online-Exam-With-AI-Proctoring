import React, { useEffect, useState } from "react";
import "./Exams.css";
import { FaBookOpen, FaEdit, FaTrash, FaPlus, FaSearch, FaCogs, FaCopy, FaChartBar, FaGlobe, FaLock, FaBuilding, FaGraduationCap } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Toast      from "../../Common/Toast";
import useToast   from "../../Common/useToast";
import PopupModal from "../../Common/PopupModal";
import BackButton from "../../Common/BackButton";
import { BASE_URL } from '../../../config';
import * as XLSX from 'xlsx';

function Exams(){
const { token, user, org } = useAuth();
const [exams,setExams] = useState([]);
const [activeTab, setActiveTab] = useState("my"); // "my" or "org"
const [search,setSearch] = useState("");
const [showCodes,setShowCodes] = useState(false);
const [codes,setCodes] = useState([]);
const [filterBranch, setFilterBranch] = useState("");
const [filterSemester, setFilterSemester] = useState("");
const [currentExam, setCurrentExam] = useState(null);
const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL", "AVAILABLE", "DRAFT", "ENDED"

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

const confirmDeleteExam = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/exams/${id}`, { 
      method: "DELETE",
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(data.message || "Exam removed from records.", "success");
      fetchExams();
    } else {
      showToast(data.message || "Failed to delete exam.", "error");
    }
  } catch (err) {
    console.error("Delete Exam Error:", err);
    showToast("Network error during deletion.", "error");
  }
};

const togglePublish = async(exam)=>{
try{
const res = await fetch(`${BASE_URL}/exams/toggle-publish/${exam._id}`,{
method:"PUT",
headers: { 'Authorization': `Bearer ${token}` }
});

const data = await res.json();

if(res.ok){
showToast(data.message || "Visibility updated!", "success");
fetchExams();
}
else{
showToast(data.message || "Action failed", "error");
}

}
catch(err){
console.error(err);
showToast("Network error", "error");
}

};

const handleClone = async (examId) => {
  try {
    const res = await fetch(`${BASE_URL}/exams/clone/${examId}`, {
      method: "POST",
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast("Exam duplicated to your library.", "success");
      fetchExams();
      setActiveTab("my");
    } else {
      showToast(data.message, "error");
    }
  } catch (err) {
    showToast("Duplicate failed", "error");
  }
};

const fetchGeneratedCodes = async(exam)=>{
  if (!exam.isPublished) {
    showToast("Codes are only available for published exams.", "warning");
    return;
  }
  
  try {
    const res = await fetch(`${BASE_URL}/exams/${exam._id}/access-codes`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      showToast(errorData.message || "Failed to fetch codes. Please ensure the server is updated and restarted.", "error");
      return;
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.codes)) {
      setCodes(data.codes);
      setCurrentExam(exam); // Store for filename
      setShowCodes(true);
    } else {
      setCodes([]);
      showToast(data.message || "No codes found for this exam.", "warning");
    }
  } catch (err) {
    console.error(err);
    setCodes([]);
    showToast("Network error or server update required. Please restart your backend.", "error");
  }
};

const handleExportExcel = () => {
    if (!codes || codes.length === 0) return;
    
    // Prepare data
    const exportData = codes.map(c => ({
        "Roll No": c.rollNo || "N/A",
        "Student Name": c.studentName,
        "Enrollment ID": c.studentId,
        "Login Password": c.password || "N/A",
        "Exam Access Code": c.code || c.accessCode
    }));

    // Create Worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Access Codes");

    // Filename
    const fileName = `AccessCodes_${currentExam?.subjectName || 'Exam'}_${new Date().toLocaleDateString()}.xlsx`;
    
    // Download
    XLSX.writeFile(wb, fileName);
};
const uniqueSemesters = [...new Set(exams.map(e => String(e.semester)).filter(Boolean))].sort((a,b)=> Number(a) - Number(b));

const filteredExams = exams.filter((exam) => {
  const matchesSearch = exam.examName.toLowerCase().includes(search.toLowerCase()) || 
                      (exam.subject && exam.subject.toLowerCase().includes(search.toLowerCase()));
  const matchesBranch = filterBranch === "" || exam.branch === filterBranch;
  const matchesSem = filterSemester === "" || String(exam.semester) === filterSemester;
  
  const status = getStatus(exam);
  const matchesStatus = statusFilter === "ALL" || status === statusFilter;

  // Robust ID comparison function
  const isOwner = (exam.createdBy === (user?._id || user?.id)) || 
                  (exam.teacherId === (user?._id || user?.id));

  if (user?.mode === 'solo') {
    return matchesSearch && matchesBranch && matchesSem && matchesStatus;
  }

  if (activeTab === "my") {
    return matchesSearch && matchesBranch && matchesSem && matchesStatus && isOwner;
  } else {
    return matchesSearch && matchesBranch && matchesSem && matchesStatus && !isOwner && exam.visibility === 'organization';
  }
});

const total = exams.length;
const available = exams.filter(e=>getStatus(e)==="AVAILABLE").length;
const draft = exams.filter(e=>getStatus(e)==="DRAFT").length;
const ended = exams.filter(e=>getStatus(e)==="ENDED").length;

return(
<div className="exams-container">
    <Toast toasts={toasts} removeToast={removeToast} />
    <BackButton to="/TeacherHome" />
    
    <div className="exams-header">
        <div className="header-text">
            <h2><FaBookOpen /> Manage Exams</h2>
            <p>Design, schedule, and review institutional examinations</p>
        </div>
        <div className="header-actions">
           <button className="dashboard-btn" onClick={() => navigate("/TeacherHome")}>Dashboard</button>
           <button className="create-exam-btn" onClick={() => navigate("/CreateExam")}>
             <FaPlus /> Create New Exam
           </button>
        </div>
    </div>

    <div className="exams-layout">
        {/* Sidebar Stats */}
        <aside className="exams-sidebar">
            <div className="stats-glass">
                <div className="mini-stat">
                    <span>Total Exams</span>
                    <h4>{total}</h4>
                </div>
                <div className="mini-stat live">
                    <span>Available</span>
                    <h4>{available}</h4>
                </div>
                <div className="mini-stat draft">
                    <span>Drafts</span>
                    <h4>{draft}</h4>
                </div>
                <div className="mini-stat ended">
                    <span>Completed</span>
                    <h4>{ended}</h4>
                </div>
            </div>

            <div className="tag-filters">
                <h5>Filter by Status</h5>
                <button className={statusFilter === "ALL" ? "active" : ""} onClick={()=>setStatusFilter("ALL")}>All Assessments</button>
                <button className={statusFilter === "AVAILABLE" ? "active" : ""} onClick={()=>setStatusFilter("AVAILABLE")}>Live Now</button>
                <button className={statusFilter === "DRAFT" ? "active" : ""} onClick={()=>setStatusFilter("DRAFT")}>Drafts Only</button>
                <button className={statusFilter === "ENDED" ? "active" : ""} onClick={()=>setStatusFilter("ENDED")}>Past Exams</button>
            </div>
        </aside>

        {/* Main Content */}
        <main className="exams-main">
            <div className="content-filters">
                <div className="tab-switcher">
                    <button 
                        className={activeTab === 'my' ? 'active' : ''} 
                        onClick={() => setActiveTab('my')}
                    >
                        My Exams
                    </button>
                    <button 
                        className={activeTab === 'org' ? 'active' : ''} 
                        onClick={() => setActiveTab('org')}
                    >
                        Shared Repository
                    </button>
                </div>
                <div className="search-bar-modern">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search by name or subject..."
                        value={search}
                        onChange={(e)=>setSearch(e.target.value)}
                    />
                </div>
                {user?.mode === 'organization' && (
                    <div className="filter-controls" style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
                        <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
                            <option value="">All Branches</option>
                            {org?.branches?.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
                            <option value="">All Semesters</option>
                            {org?.semesters?.map(s => <option key={s} value={s}>Sem {s}</option>)}
                        </select>
                    </div>
                )}
            </div>

            <div className="exams-grid-modern">
                {filteredExams.length === 0 ? (
                    <div className="empty-exams">
                        <p>No examinations found matching your criteria.</p>
                    </div>
                ) : (
                    filteredExams.map((exam) => {
                        const status = getStatus(exam);
                        return (
                            <div className={`exam-card-v2 status-${status.toLowerCase()}`} key={exam._id}>
                                <div className="card-top">
                                    <div className="status-indicator">{status}</div>
                                    <div className="visibility-icon">
                                        {exam.visibility === 'organization' ? <FaGlobe title="Public to Org" /> : <FaLock title="Private" />}
                                    </div>
                                </div>
                                
                                <div className="card-body">
                                    <h3>{exam.examName}</h3>
                                    <p className="subject">{exam.subject}</p>
                                    
                                    <div className="exam-meta-grid">
                                        <div className="meta-item">
                                            <span>Date</span>
                                            <p>{new Date(exam.examDate).toLocaleDateString("en-IN")}</p>
                                        </div>
                                        <div className="meta-item">
                                            <span>Duration</span>
                                            <p>{exam.duration}m</p>
                                        </div>
                                        <div className="meta-item">
                                            <span>Total Marks</span>
                                            <p>{exam.totalMarks}</p>
                                        </div>
                                        {/* New Branch and Semester items */}
                                        <div className="meta-item">
                                            <span>Branch</span>
                                            <p>{exam.branch || "N/A"}</p>
                                        </div>
                                        <div className="meta-item">
                                            <span>Semester</span>
                                            <p>{exam.semester || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-footer-actions">
                                    {activeTab === "my" ? (
                                        <div className="action-groups">
                                            <div className="action-row main-actions">
                                                <button className={`btn-publish ${exam.isPublished ? 'unpublish' : 'publish'}`} onClick={() => togglePublish(exam)}>
                                                    {exam.isPublished ? "Unpublish" : "Publish"}
                                                </button>
                                                <button className="btn-secondary" onClick={() => fetchGeneratedCodes(exam)}>Codes</button>
                                            </div>
                                            <div className="action-row icon-actions">
                                                <div className="group">
                                                    <button className="btn-icon edit" title="Edit Properties" onClick={() => navigate(`/edit-exam/${exam._id}`)}>
                                                        <FaEdit />
                                                    </button>
                                                    <button className="btn-icon add" title="Manage Questions" onClick={() => navigate(`/add-question/${exam._id}`)}>
                                                        <FaPlus />
                                                    </button>
                                                </div>
                                                <div className="group">
                                                    <button className="btn-icon clone" title="Duplicate Exam" onClick={() => handleClone(exam._id)}>
                                                        <FaCopy />
                                                    </button>
                                                    <button className="btn-icon results" title="View Results" onClick={() => navigate(`/student-results/${exam._id}`)}>
                                                        <FaChartBar />
                                                    </button>
                                                </div>
                                                <button className="btn-icon delete" title="Delete Exam" onClick={() => setDeleteModal({ open: true, targetId: exam._id })}>
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="action-groups">
                                            <button className="btn-full clone" onClick={() => handleClone(exam._id)}>
                                                <FaCopy /> Copy to My Library
                                            </button>
                                            <button className="btn-full results" onClick={() => navigate(`/student-results/${exam._id}`)}>
                                                <FaChartBar /> Performance Analytics
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </main>
    </div>

    {/* Security Code Popup */}
    {showCodes && (
        <div className="code-overlay">
            <div className="code-modal">
                <div className="modal-header">
                   <h2>Exam Access Codes</h2>
                   <button className="btn-secondary excel-btn" onClick={handleExportExcel} style={{marginRight: 'auto', marginLeft: '20px'}}>
                       Export to Excel
                   </button>
                   <button className="close-btn" onClick={()=>setShowCodes(false)}>&times;</button>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Roll No</th>
                                <th>Student Name</th>
                                <th>Login Password</th>
                                <th>Access Code</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(codes) && codes.map((c,index)=>(
                                <tr key={index}>
                                    <td>{c.rollNo || "N/A"}</td>
                                    <td>{c.studentName}</td>
                                    <td><code style={{color: 'var(--accent-color)'}}>{c.password || "N/A"}</code></td>
                                    <td className="code-cell"><code>{c.code || c.accessCode}</code></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )}

    <PopupModal
        isOpen={deleteModal.open}
        type="error"
        title="Delete Exam Session?"
        message="All associated questions, security codes, and student results will be permanently removed."
        confirmText="Confirm Delete"
        cancelText="Cancel"
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
