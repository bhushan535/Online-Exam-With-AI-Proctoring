import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Toast    from "../Toast";
import useToast from "../useToast";
import "./CreateExam.css";
import { BASE_URL } from '../../config';

function EditExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    examName: "", subject: "", semester: "",
    examDate: "", startTime: "", endTime: "",
    totalMarks: "", duration: "", totalQuestions: "",
    visibility: "private",
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
    fetch(`${BASE_URL}/exams/${id}`)
      .then((res) => res.json())
      .then((exam) => {
        if (!exam || exam.success === false) {
          showToast("Exam not found. Redirecting...", "error");
          setTimeout(() => navigate("/exams"), 1500);
          return;
        }

        const now = new Date();
        const start = new Date(exam.startDateTime);
        const end = new Date(exam.endDateTime);

        let currentStatus = "UPCOMING";
        if (now >= start && now <= end) currentStatus = "LIVE";
        if (now > end) currentStatus = "ENDED";

        setStatus(currentStatus);

        setForm({
          examName: exam.examName,
          subject: exam.subject,
          semester: exam.semester,
          examDate: exam.examDate?.slice(0, 10),
          startTime: exam.startTime,
          endTime: exam.endTime,
          totalMarks: exam.totalMarks,
          duration: exam.duration,
          totalQuestions: exam.totalQuestions,
          visibility: exam.visibility || "private",
          proctoringConfig: exam.proctoringConfig || {
            enabled: true,
            autoSubmitLimit: 0,
            requireFullScreen: false,
            disableTabSwitching: false,
            warningLimit: 3
          }
        });
      });
    // eslint-disable-next-line
  }, [id, navigate]);

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

    if (form.startTime >= form.endTime) {
      showToast("End time must be after start time.", "warning");
      return;
    }

    const res = await fetch(`${BASE_URL}/exams/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      showToast("Update failed. Please try again.", "error");
      return;
    }

    showToast("Exam updated successfully! ✅", "success");
    setTimeout(() => navigate("/exams"), 1500);
  };

  const isLocked = status === "LIVE" || status === "ENDED";

  return (
    <div className="create-exam-page">
      <Toast toasts={toasts} removeToast={removeToast} />
      <div className="create-exam-card">
        <h2>Edit Exam</h2>

        {isLocked && (
          <p style={{ color: "red", fontWeight: "bold" }}>
            This exam cannot be edited (Status: {status})
          </p>
        )}

        <form onSubmit={handleSubmit} className="create-exam-form">
          <label>Exam Name</label>
          <input name="examName" value={form.examName} onChange={handleChange} disabled={isLocked} />

          <label>Subject</label>
          <input name="subject" value={form.subject} onChange={handleChange} disabled={isLocked} />

          <label>Semester</label>
          <input name="semester" value={form.semester} onChange={handleChange} disabled={isLocked} />

          <label>Exam Date</label>
          <input type="date" name="examDate" min={today} value={form.examDate} onChange={handleChange} disabled={isLocked} />

          <label>Start Time</label>
          <input type="time" name="startTime" value={form.startTime} onChange={handleChange} disabled={isLocked} />

          <label>End Time</label>
          <input type="time" name="endTime" value={form.endTime} onChange={handleChange} disabled={isLocked} />

          <label>Total Marks</label>
          <input type="number" name="totalMarks" value={form.totalMarks} onChange={handleChange} disabled={isLocked} />

          <label>Duration (minutes)</label>
          <input type="number" name="duration" value={form.duration} onChange={handleChange} disabled={isLocked} />

          <label>Total Questions</label>
          <input type="number" name="totalQuestions" value={form.totalQuestions} onChange={handleChange} disabled={isLocked} />

          <label>Visibility</label>
          <select name="visibility" value={form.visibility} onChange={handleChange} disabled={isLocked}>
            <option value="private">Private (Only Me)</option>
            <option value="organization">Organization (Shared with Institution)</option>
          </select>

          <div className="proctoring-settings-section">
            <h3>🛡️ Proctoring Settings</h3>
            <div className="proctor-grid">
              <div className="proctor-field">
                <label>Enable AI Proctoring</label>
                <input 
                  type="checkbox" 
                  name="proctoring.enabled"
                  checked={form.proctoringConfig.enabled}
                  onChange={handleChange}
                  disabled={isLocked}
                />
              </div>
              <div className="proctor-field">
                <label>Full Screen Required</label>
                <input 
                  type="checkbox" 
                  name="proctoring.requireFullScreen"
                  checked={form.proctoringConfig.requireFullScreen}
                  onChange={handleChange}
                  disabled={isLocked}
                />
              </div>
              <div className="proctor-field">
                <label>Disable Tab Switching</label>
                <input 
                  type="checkbox" 
                  name="proctoring.disableTabSwitching"
                  checked={form.proctoringConfig.disableTabSwitching}
                  onChange={handleChange}
                  disabled={isLocked}
                />
              </div>
              <div className="proctor-field">
                <label>Warning Limit</label>
                <input 
                  type="number" 
                  name="proctoring.warningLimit"
                  value={form.proctoringConfig.warningLimit}
                  onChange={handleChange}
                  disabled={isLocked}
                />
              </div>
              <div className="proctor-field">
                <label>Auto-Submit Limit (0 to disable)</label>
                <input 
                  type="number" 
                  name="proctoring.autoSubmitLimit"
                  value={form.proctoringConfig.autoSubmitLimit}
                  onChange={handleChange}
                  disabled={isLocked}
                />
              </div>
            </div>
          </div>

          {!isLocked && (
            <button type="submit">Update Exam</button>
          )}
        </form>
      </div>
    </div>
  );
}

export default EditExam;