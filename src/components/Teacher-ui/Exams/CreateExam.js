import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext"; // Added useAuth
import Toast from "../../Common/Toast";
import useToast from "../../Common/useToast";
import { FaGraduationCap, FaBook, FaCalendarAlt, FaClock, FaCheckCircle, FaLock, FaGlobeAmericas, FaShieldAlt, FaTrash, FaPlus, FaCheck, FaSearch } from 'react-icons/fa';
import BackButton from "../../Common/BackButton";
import SearchableDropdown from '../Shared/SearchableDropdown';
import "./CreateExam.css";
import { BASE_URL } from '../../../config';

function CreateExam() {
    const { token, user } = useAuth(); // Get token and user
    const navigate = useNavigate();
    const { toasts, showToast, removeToast } = useToast();

    const today = new Date().toISOString().split("T")[0];

    /* EXAM FIELDS */
    const [examName, setExamName] = useState("");
    const [subject, setSubject] = useState("");
    const [subCode, setSubCode] = useState("");
    const [examDate, setExamDate] = useState("");
    const [totalQuestions, setTotalQuestions] = useState("");
    const [duration, setDuration] = useState("");
    const [marksPerQuestion, setMarksPerQuestion] = useState("");
    const [visibility, setVisibility] = useState("private");

    /* PROCTORING CONFIG */
    const [proctoringConfig, setProctoringConfig] = useState({
        enabled: true,
        autoSubmitLimit: 0,
        requireFullScreen: false,
        disableTabSwitching: false,
        warningLimit: 3
    });

    /* CLASS DATA */
    const [classId, setClassId] = useState("");
    const [branch, setBranch] = useState("");
    const [year, setYear] = useState("");
    const [semester, setSemester] = useState("");

    const [classes, setClasses] = useState([]);
    const [orgSubjects, setOrgSubjects] = useState([]); // Dynamic subjects

    /* FETCHING DATA */
    useEffect(() => {
        if (token) {
            // Fetch classes (Only Active)
            fetch(`${BASE_URL}/classes?status=active`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setClasses(Array.isArray(data) ? data : []));

            // Fetch organization subjects if in organization mode
            if (user?.mode === 'organization') {
                fetch(`${BASE_URL}/principal/organization`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success && data.organization.subjects) {
                            setOrgSubjects(data.organization.subjects);
                        }
                    });
            } else if (user?.mode === 'solo') {
                // Fetch solo teacher subjects
                fetch(`${BASE_URL}/teacher/subjects`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            setOrgSubjects(data.subjects);
                        }
                    });
            }
        }
    }, [token, user]);

    /* CLASS SELECT */
    const handleClassChange = (id) => {
        setClassId(id);
        const selectedClass = classes.find(c => c._id === id);
        if (!selectedClass) return;

        setBranch(selectedClass.branch);
        setYear(selectedClass.year || "");
        setSemester(selectedClass.semester);

        // Auto-populate subject for solo mode
        if (user?.mode === 'solo') {
            // Find subject that matches the class branch (legacy solo logic used branch as subject name)
            // Or find from recently fetched orgSubjects
            const matchedSubject = orgSubjects.find(s => s.name === selectedClass.branch);
            if (matchedSubject) {
                setSubject(matchedSubject.name);
                setSubCode(matchedSubject.code);
            } else {
                setSubject(selectedClass.branch); // Fallback to branch name
                setSubCode("");
            }
        } else {
            // Auto-reset subject when class changes in org mode
            setSubject("");
            setSubCode("");
        }
    };

    /* SUBJECT SELECT */
    const handleSubjectSelect = (selected) => {
        setSubject(selected.name || selected);
        setSubCode(selected.code || "");
    };

    /* SUBMIT */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (Number(totalQuestions) <= 0 || Number(duration) <= 0 || Number(marksPerQuestion) <= 0) {
            showToast("Questions, duration, and marks must be greater than zero.", "error");
            return;
        }

        const examData = {
            examName,
            classId,
            branch,
            year,
            semester,
            subject,
            subCode,
            examDate,
            totalQuestions: Number(totalQuestions),
            duration: Number(duration),
            marksPerQuestion: Number(marksPerQuestion),
            totalMarks: Number(totalQuestions) * Number(marksPerQuestion),
            visibility,
            proctoringConfig
        };

        const res = await fetch(`${BASE_URL}/exams`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // Added Authorization
            },
            body: JSON.stringify(examData)
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.message || "Failed to initialize assessment. Check connectivity.", "error");
            return;
        }

        showToast("Deep-scan assessment initialized! 🚀", "success");
        setTimeout(() => navigate("/Exams"), 1500);
    };

    return (

        <div className="create-exam-container">
            <BackButton to="/Exams" />
            <Toast toasts={toasts} removeToast={removeToast} />

            <div className="ce-header">
                <div className="ce-badge"><FaPlus /> Welcome </div>
                <h1>Create New Exam</h1>
                <p>Configure academic evaluation, parameters and proctoring protocols.</p>
            </div>

            <form className={`ce-form-v2 ${user?.mode === 'solo' ? 'solo-layout' : ''}`} onSubmit={handleSubmit}>
                <div className="ce-form-grid">
                    {user?.mode === 'organization' ? (
                        <>
                            {/* Organization Mode: Original 3-Column Layout */}
                            {/* Left Column: Academic Context */}
                            <div className="ce-section glass-v2">
                                <div className="section-head">
                                    <FaBook />
                                    <h3>Academic Info</h3>
                                </div>

                                <div className="ce-input-row">
                                    <div className="ce-group full">
                                        <label>Class</label>
                                        <div className="ce-select-wrapper">
                                            <select
                                                value={classId}
                                                onChange={(e) => handleClassChange(e.target.value)}
                                                required
                                            >
                                                <option value="">Select Class...</option>
                                                {classes.map((c) => (
                                                    <option key={c._id} value={c._id}>
                                                        {c.className} ({c.branch} - {c.semester})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="ce-input-row three-col">
                                    <div className="ce-group">
                                        <label>Department</label>
                                        <input value={branch || "---"} readOnly className="readonly-input" />
                                    </div>
                                    <div className="ce-group">
                                        <label>Year</label>
                                        <input value={year || "---"} readOnly className="readonly-input" />
                                    </div>
                                    <div className="ce-group">
                                        <label>Semester</label>
                                        <input value={semester || "---"} readOnly className="readonly-input" />
                                    </div>
                                </div>

                                {(semester) && (
                                    <div className="ce-group">
                                        <label>Assigned Subject</label>
                                        <div className="ce-select-wrapper">
                                            <select
                                                value={subject}
                                                onChange={(e) => {
                                                    const sel = orgSubjects.find(s => s.name === e.target.value &&
                                                        (!s.branch || s.branch === branch) &&
                                                        (!s.semester || String(s.semester) === String(semester)));
                                                    handleSubjectSelect(sel ? { name: sel.name, code: sel.code } : { name: e.target.value, code: "" });
                                                }}
                                                required
                                            >
                                                <option value="">Select Subject...</option>
                                                {orgSubjects
                                                    .filter(s => (!s.branch || s.branch === branch) && (!s.semester || String(s.semester) === String(semester)))
                                                    .map(s => (
                                                        <option key={s._id || s.name} value={s.name}>{s.name} ({s.code})</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>
                                )}
                                <div className="ce-group">
                                    <label>Subject Code</label>
                                    <input
                                        placeholder="e.g. 316313"
                                        value={subCode}
                                        onChange={(e) => setSubCode(e.target.value)}
                                        className={`highlight ${!subCode ? 'manual-entry' : ''}`}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Middle Column: Evaluation Specs */}
                            <div className="ce-section glass-v2">
                                <div className="section-head">
                                    <FaCalendarAlt />
                                    <h3>Evaluation </h3>
                                </div>

                                <div className="ce-group">
                                    <label>Exam Name</label>
                                    <input
                                        placeholder="e.g. Unit Test I"
                                        value={examName}
                                        onChange={(e) => setExamName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="ce-input-row">
                                    <div className="ce-group">
                                        <label>Date</label>
                                        <input type="date" value={examDate} min={today} onChange={(e) => setExamDate(e.target.value)} required />
                                    </div>
                                    <div className="ce-group">
                                        <label>Visibility</label>
                                        <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                                            <option value="private">Private</option>
                                            <option value="organization">Institutional</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="ce-input-row three-col">
                                    <div className="ce-group">
                                        <label>Total Questions</label>
                                        <input type="number" value={totalQuestions} onChange={(e) => setTotalQuestions(e.target.value)} min="1" required />
                                    </div>
                                    <div className="ce-group">
                                        <label>Duration (Mins)</label>
                                        <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" required />
                                    </div>
                                    <div className="ce-group">
                                        <label>Marks /Question</label>
                                        <input type="number" value={marksPerQuestion} onChange={(e) => setMarksPerQuestion(e.target.value)} min="1" required />
                                    </div>
                                </div>

                                <div className="marks-summary-card">
                                    <div className="summary-label">Total Marks</div>
                                    <div className="summary-value">{(Number(totalQuestions) * Number(marksPerQuestion)) || 0}</div>
                                </div>
                            </div>

                            {/* Right Column: Proctoring */}
                            <div className="ce-section glass-v2 proctoring-highlights">
                                <div className="section-head">
                                    <FaShieldAlt />
                                    <h3>Safe-Exam Environment</h3>
                                </div>
                                <div className="proctoring-toggle-belt">
                                    <span>Enable AI Proctoring</span>
                                    <label className="ce-switch">
                                        <input
                                            type="checkbox"
                                            checked={proctoringConfig.enabled}
                                            onChange={(e) => setProctoringConfig({
                                                ...proctoringConfig,
                                                enabled: e.target.checked,
                                                requireFullScreen: e.target.checked,
                                                disableTabSwitching: e.target.checked
                                            })}
                                        />
                                        <span className="ce-slider"></span>
                                    </label>
                                </div>
                                <div className="proctoring-info-footer">
                                    <FaShieldAlt />
                                    <p>{proctoringConfig.enabled ? "AI supervision active." : "Standard mode active."}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Solo Mode: Consolidated 2-Column Layout */}
                            {/* Card 1: Assessment Identification */}
                            <div className="ce-section glass-v2 solo-redesign card-identity">
                                <div className="section-head">
                                    <FaBook />
                                    <h3>Assessment Identity</h3>
                                </div>

                                <div className="ce-group identity-group">
                                    <label>Exam Identity (Exam Name)</label>
                                    <input
                                        placeholder="e.g. Unit Test I - Advanced Algorithms"
                                        value={examName}
                                        onChange={(e) => setExamName(e.target.value)}
                                        className="premium-input"
                                        required
                                    />
                                </div>

                                <div className="ce-input-row spacing-v2">
                                    <div className="ce-group">
                                        <label>Target Class</label>
                                        <div className="ce-select-wrapper">
                                            <select
                                                value={classId}
                                                onChange={(e) => handleClassChange(e.target.value)}
                                                required
                                            >
                                                <option value="">Select Class...</option>
                                                {classes.map((c) => (
                                                    <option key={c._id} value={c._id}>
                                                        {c.className}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="ce-group">
                                        <label>Assigned Subject</label>
                                        <input
                                            value={subject || "Select Class first..."}
                                            readOnly
                                            className="readonly-input highlight-v2"
                                            placeholder="Auto-populated from class..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Technical Configuration & Security */}
                            <div className="ce-section glass-v2 solo-redesign card-config">
                                <div className="section-head">
                                    <FaCalendarAlt />
                                    <h3>Technical Configuration</h3>
                                </div>

                                <div className="ce-input-row spacing-v2">
                                    <div className="ce-group full">
                                        <label>Date of Exam Published</label>
                                        <div className="input-with-icon-v2">
                                            <FaClock />
                                            <input
                                                type="date"
                                                value={examDate}
                                                min={today}
                                                onChange={(e) => setExamDate(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="ce-input-row three-col spacing-v2">
                                    <div className="ce-group">
                                        <label>Total Que.</label>
                                        <input type="number" placeholder="0" value={totalQuestions} onChange={(e) => setTotalQuestions(e.target.value)} min="1" required />
                                    </div>
                                    <div className="ce-group">
                                        <label>Duration (Mins)</label>
                                        <input type="number" placeholder="Min" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" required />
                                    </div>
                                    <div className="ce-group">
                                        <label>Mark/Que.</label>
                                        <input type="number" placeholder="Val" value={marksPerQuestion} onChange={(e) => setMarksPerQuestion(e.target.value)} min="1" required />
                                    </div>
                                </div>

                                <div className="proctoring-toggle-belt">
                                    <span>Enable AI Proctoring</span>
                                    <label className="ce-switch">
                                        <input
                                            type="checkbox"
                                            checked={proctoringConfig.enabled}
                                            onChange={(e) => setProctoringConfig({
                                                ...proctoringConfig,
                                                enabled: e.target.checked,
                                                requireFullScreen: e.target.checked,
                                                disableTabSwitching: e.target.checked
                                            })}
                                        />
                                        <span className="ce-slider"></span>
                                    </label>
                                </div>

                                <div className="marks-summary-card premium-summary">
                                    <div className="summary-label">Total Marks</div>
                                    <div className="summary-value">
                                        {(Number(totalQuestions) * Number(marksPerQuestion)) || 0}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="ce-actions">
                    <button type="submit" className="ce-submit-btn">
                        <FaCheckCircle /> Create Exam
                    </button>
                    <p className="ce-disclaimer">By initializing, you agree to the institution's digital assessment guidelines.</p>
                </div>
            </form>

        </div>

    );

}

export default CreateExam;
