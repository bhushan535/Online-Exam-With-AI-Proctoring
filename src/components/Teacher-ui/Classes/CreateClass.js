import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../../Common/Toast";
import useToast from "../../Common/useToast";
import BackButton from "../../Common/BackButton";
import { FaPlusCircle, FaBook, FaLayerGroup, FaCalendarAlt, FaGraduationCap, FaChevronRight, FaUsers, FaFileAlt } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext";
import "./CreateClass.css";
import { BASE_URL } from '../../../config';

function CreateClass() {
  const navigate = useNavigate();
  const { user, token, teacherProfile, org } = useAuth();
  const { toasts, showToast, removeToast } = useToast();

  const [className, setClassName] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [description, setDescription] = useState("");
  const [maxStudents, setMaxStudents] = useState(100);
  const [loading, setLoading] = useState(false);

  // Auto-set defaults for Solo Mode or branch for Teachers in Org mode
  useEffect(() => {
    if (user?.role === 'teacher') {
      if (user?.mode === 'organization' && teacherProfile?.department) {
        setBranch(teacherProfile.department);
      } else if (user?.mode === 'solo') {
        // Solo Defaults: Satisfy DB schema while reducing UI noise
        setBranch("General"); 
        setSemester("N/A");
        setYear(new Date().getFullYear().toString());
      }
    }
  }, [user, teacherProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { className, branch, semester, year, description, maxStudents };

    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/classes`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Failed to create class", "error");
        setLoading(false);
        return;
      }

      showToast("Class initialized! 🚀", "success");
      setTimeout(() => navigate("/Classes"), 1500);
    } catch (err) {
      showToast("Network protocol error", "error");
      setLoading(false);
    }
  };

  const isSolo = user?.mode === 'solo';
  const branches = org?.branches || [];
  const years = org?.academicYears || [];
  const semesters = org?.semesters || [];

  return (
    <div className="cc-premium-overlay">
      <Toast toasts={toasts} removeToast={removeToast} />
      <div className="cc-nav-top">
        <BackButton to="/TeacherHome" />
      </div>
      
      <div className="cc-premium-container">
        <div className="cc-visual-sidebar">
            <div className="cc-sidebar-content">
                <div className="cc-brand-badge">{isSolo ? "Solo Educator" : "Management Hub"}</div>
                <h1>{isSolo ? "New Course" : "Create New"} <br/><span>Class Section</span></h1>
                <p>
                  {isSolo 
                    ? "Launch a new teaching environment. Your students can join via a unique link or direct enrollment."
                    : "Define the academic structure. All settings are validated against the institutional hierarchy."}
                </p>
                
                <div className="cc-steps">
                    <div className={`cc-step ${className ? 'active' : ''}`}>
                        <div className="step-num">01</div>
                        <div className="step-label">{isSolo ? "Class Info" : "Identity"}</div>
                    </div>
                    {!isSolo && (
                      <div className={`cc-step ${branch && semester ? 'active' : ''}`}>
                          <div className="step-num 02">02</div>
                          <div className="step-label">Academic Link</div>
                      </div>
                    )}
                </div>
            </div>
        </div>

        <div className="cc-form-section glass-premium animate-fade-in">
          <div className="cc-form-header">
            <div className="pulse-icon"><FaPlusCircle /></div>
            <h2>{isSolo ? "Basic Details" : "Class Details"}</h2>
            <p>{isSolo ? "Fill in the fundamentals of your new course." : "Enter the required academic configuration."}</p>
          </div>

          <form onSubmit={handleSubmit} className="cc-premium-form">
            <div className="cc-input-wrapper">
              <label><FaBook /> {isSolo ? "Class / Course Name" : "Class Identifier"}</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  placeholder={isSolo ? "e.g. Master the Mongoose" : "e.g. CS-4A Machine Learning"}
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  required
                />
              </div>
            </div>

            {isSolo ? (
              <>
                <div className="cc-grid-row animate-slide-up">
                  <div className="cc-input-wrapper">
                    <label><FaLayerGroup /> Subject / Topic</label>
                    <div className="input-with-icon">
                      <input
                        type="text"
                        placeholder="e.g. Computer Science"
                        value={branch === "General" ? "" : branch}
                        onChange={(e) => setBranch(e.target.value || "General")}
                        required
                      />
                    </div>
                  </div>
                  <div className="cc-input-wrapper">
                    <label><FaUsers /> Capacity</label>
                    <div className="input-with-icon">
                      <input
                        type="number"
                        placeholder="Max Students"
                        value={maxStudents}
                        onChange={(e) => setMaxStudents(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="cc-input-wrapper animate-slide-up">
                  <label><FaFileAlt /> Class Description</label>
                  <div className="input-with-icon">
                    <textarea
                      placeholder="Briefly describe what this class is about..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="cc-textarea-premium"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="cc-grid-row">
                    <div className="cc-input-wrapper">
                      <label><FaLayerGroup /> Branch / Domain</label>
                      <select
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        required
                        disabled={user?.role === 'teacher' && user?.mode === 'organization'}
                      >
                        <option value="">Select Branch</option>
                        {branches.map((b) => <option key={b} value={b}>{b}</option>)}
                        {!branches.length && <option value={branch}>{branch || "Loading..."}</option>}
                      </select>
                    </div>
                    <div className="cc-input-wrapper">
                      <label><FaCalendarAlt /> Academic Year</label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        required
                      >
                        <option value="">Select Year</option>
                        {years.map((y) => <option key={y} value={y}>{y}</option>)}
                        {!years.length && <option value={year}>{year}</option>}
                      </select>
                    </div>
                </div>

                <div className="cc-input-wrapper">
                  <label><FaGraduationCap /> Target Semester</label>
                  <select value={semester} onChange={(e) => setSemester(e.target.value)} required>
                    <option value="">Select Semester</option>
                    {semesters.length > 0 ? (
                        semesters.map((sem) => <option key={sem} value={sem}>{sem}</option>)
                    ) : (
                        <option disabled>No semesters defined by Principal</option>
                    )}
                  </select>
                </div>
              </>
            )}

            <button type="submit" className="cc-launch-btn" disabled={loading}>
                {loading ? "Initializing..." : <>{isSolo ? "Launch Class" : "Create Class"} <FaChevronRight /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateClass;
