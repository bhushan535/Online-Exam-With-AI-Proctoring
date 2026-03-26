import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Toast from "../../Common/Toast";
import useToast from "../../Common/useToast";
import { FaEdit, FaBook, FaCalendarAlt, FaClock, FaCheckCircle, FaLock, FaGlobeAmericas, FaShieldAlt, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import BackButton from "../../Common/BackButton";
import "./CreateExam.css"; // Shared styling
import { BASE_URL } from '../../../config';

function EditExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toasts, showToast, removeToast } = useToast();

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    examName: "", subject: "", semester: "",
    examDate: "",
    marksPerQuestion: "", totalMarks: "", duration: "", totalQuestions: "",
    visibility: "private",
    isPublished: false,
    proctoringConfig: {
      enabled: true,
      autoSubmitLimit: 0,
      requireFullScreen: false,
      disableTabSwitching: false,
      warningLimit: 3
    }
  });

  const [status, setStatus] = useState("");

  /* ================= FETCH EXAM ================= */
  useEffect(() => {
    if (!token) return;
    fetch(`${BASE_URL}/exams/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((exam) => {
        if (!exam || exam.success === false) {
          showToast("Exam not found or access denied.", "error");
          setTimeout(() => navigate("/Exams"), 1500);
          return;
        }

        // Compute status from examDate
        const now = new Date();
        const examDay = new Date(exam.examDate);
        examDay.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let currentStatus = "UPCOMING";
        if (today.getTime() === examDay.getTime()) currentStatus = "LIVE";
        if (today > examDay) currentStatus = "ENDED";

        setStatus(currentStatus);

        setForm({
          examName: exam.examName,
          subject: exam.subject,
          semester: exam.semester,
          examDate: exam.examDate?.slice(0, 10),
          marksPerQuestion: exam.marksPerQuestion || 0,
          totalMarks: exam.totalMarks || 0,
          duration: exam.duration,
          totalQuestions: exam.totalQuestions,
          visibility: exam.visibility || "private",
          isPublished: exam.isPublished || false,
          proctoringConfig: exam.proctoringConfig || {
            enabled: true,
            autoSubmitLimit: 0,
            requireFullScreen: false,
            disableTabSwitching: false,
            warningLimit: 3
          }
        });
      })
      .catch(err => {
        console.error("FETCH EXAM ERROR:", err);
        showToast("Failed to load exam.", "error");
      });
  }, [id, token, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("proctoring.")) {
      const field = name.split(".")[1];
      setForm({
        ...form,
        proctoringConfig: {
          ...form.proctoringConfig,
          [field]: type === "checkbox" ? checked : (type === "number" ? Number(value) : value)
        }
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.examDate || !form.totalQuestions || !form.duration || !form.marksPerQuestion) {
      showToast("Required fields are missing.", "warning");
      return;
    }

    const res = await fetch(`${BASE_URL}/exams/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        ...form,
        totalMarks: Number(form.totalQuestions) * Number(form.marksPerQuestion)
      }),
    });

    if (!res.ok) {
      showToast("Server rejected the update. Please check fields.", "error");
      return;
    }

    showToast("Exam updated successfully! ✅", "success");
    setTimeout(() => navigate("/Exams"), 1500);
  };

  const isLocked = form.isPublished && (status === "LIVE" || status === "ENDED");

  return (
    <div className="create-exam-container">
      <BackButton to="/Exams" />
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="ce-header">
        <div className="ce-badge"><FaEdit /> Edit Exam</div>
        <h1>Modify Exam Properties</h1>
        <p>Update settings for {form.examName || "this exam"}.</p>
      </div>

      {isLocked && (
        <div className="ce-lock-banner animate-pulse">
          <FaExclamationTriangle />
          <span>Evaluation Immutable: Status is {status}. Parameters are now locked for integrity.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ce-form-v2">
        <div className="ce-form-grid">
          {/* Context */}
          <div className="ce-section glass-v2">
            <div className="section-head">
              <FaBook />
              <h3>Academic Core</h3>
            </div>
            <div className="ce-group">
              <label>Exam Name</label>
              <input name="examName" value={form.examName} onChange={handleChange} disabled={isLocked} placeholder="Exam Name" />
            </div>
            <div className="ce-group">
              <label>Subject</label>
              <input name="subject" value={form.subject} onChange={handleChange} disabled={isLocked} placeholder="Subject" />
            </div>
            <div className="ce-group">
              <label>Semester</label>
              <input name="semester" value={form.semester} onChange={handleChange} disabled={isLocked} placeholder="Semester" />
            </div>
          </div>

          {/* Logistics */}
          <div className="ce-section glass-v2">
            <div className="section-head">
              <FaCalendarAlt />
              <h3>Evaluation </h3>
            </div>
            <div className="ce-group">
              <label>Scheduled Date</label>
              <div className="input-with-icon-v2">
                <FaClock />
                <input type="date" name="examDate" min={today} value={form.examDate} onChange={handleChange} disabled={isLocked} />
              </div>
            </div>
            <div className="ce-input-row three-col">
              <div className="ce-group">
                <label>Total Questions</label>
                <input type="number" name="totalQuestions" value={form.totalQuestions} onChange={handleChange} disabled={isLocked} />
              </div>
              <div className="ce-group">
                <label>Duration (minutes)</label>
                <input type="number" name="duration" value={form.duration} onChange={handleChange} disabled={isLocked} />
              </div>
              <div className="ce-group">
                <label>Mark / Question</label>
                <input type="number" name="marksPerQuestion" value={form.marksPerQuestion} onChange={handleChange} disabled={isLocked} />
              </div>
            </div>

            <div className="marks-summary-card" style={{ marginTop: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', padding: '1.2rem', borderRadius: '20px' }}>
              <div className="summary-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Total Points</div>
              <div className="summary-value" style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--success-color)' }}>
                {(Number(form.totalQuestions) * Number(form.marksPerQuestion)) || 0}
              </div>
            </div>

            <div className="ce-group">
              <label>Visibility Protocol</label>
              <div className="ce-select-wrapper">
                <select name="visibility" value={form.visibility} onChange={handleChange} disabled={isLocked}>
                  <option value="private">Private Access</option>
                  <option value="organization">Institutional Shared</option>
                </select>
              </div>
            </div>
          </div>

          {/* Proctoring */}
          <div className={`ce-section glass-v2 proctoring-highlights ${isLocked ? 'dimmed' : ''}`}>
            <div className="section-head">
              <FaShieldAlt />
              <h3>Safe-Exam Environment</h3>
            </div>
            <div className="proctoring-toggle-belt">
              <span>Enable AI Proctoring</span>
              <label className="ce-switch">
                <input
                  type="checkbox"
                  name="proctoring.enabled"
                  checked={form.proctoringConfig.enabled}
                  onChange={(e) => {
                    const isEn = e.target.checked;
                    setForm({
                      ...form,
                      proctoringConfig: {
                        enabled: isEn,
                        autoSubmitLimit: 0,
                        requireFullScreen: isEn,
                        disableTabSwitching: isEn,
                        warningLimit: 3
                      }
                    });
                  }}
                  disabled={isLocked}
                />
                <span className="ce-slider"></span>
              </label>
            </div>

            <div className="proctoring-info-footer" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--ce-border)', paddingTop: '1rem' }}>
              <FaShieldAlt />
              <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                {form.proctoringConfig.enabled
                  ? "Dynamic supervision active: Full-screen enforcement, tab-switching detection, and multi-face monitoring enabled."
                  : "Standard mode: No AI supervision or browser restrictions will be applied to this assessment."
                }
              </p>
            </div>
          </div>
        </div>

        {!isLocked && (
          <div className="ce-actions">
            <button type="submit" className="ce-submit-btn">
              <FaCheckCircle /> Save Updates
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default EditExam;
