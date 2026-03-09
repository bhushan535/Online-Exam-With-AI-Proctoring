import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./CreateExam.css";

function EditExam() {
  const { id } = useParams();
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    examName: "",
    subject: "",
    semester: "",
    examDate: "",
    startTime: "",
    endTime: "",
    totalMarks: "",
    duration: "",
    totalQuestions: "",
  });

  const [status, setStatus] = useState("");

  /* ================= FETCH EXAM ================= */
  useEffect(() => {
    fetch(`http://localhost:5000/api/exams`)
      .then((res) => res.json())
      .then((data) => {
        const exam = data.find((e) => e._id === id);

        if (!exam) {
          alert("Exam not found");
          navigate("/exams");
          return;
        }

        // 🔥 STATUS CALCULATION
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
        });
      });
  }, [id, navigate]);

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.startTime >= form.endTime) {
      alert("End time must be after start time");
      return;
    }

    const res = await fetch(`http://localhost:5000/api/exams/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      alert("Update failed");
      return;
    }

    alert("Exam Updated Successfully");
    navigate("/exams");
  };

  /* 🔒 LOCK IF LIVE OR ENDED */
  const isLocked = status === "LIVE" || status === "ENDED";

  return (
    <div className="create-exam-page">
      <div className="create-exam-card">
        <h2>Edit Exam</h2>

        {isLocked && (
          <p style={{ color: "red", fontWeight: "bold" }}>
            This exam cannot be edited (Status: {status})
          </p>
        )}

        <form onSubmit={handleSubmit} className="create-exam-form">

          <label>Exam Name</label>
          <input
            name="examName"
            value={form.examName}
            onChange={handleChange}
            disabled={isLocked}
          />

          <label>Subject</label>
          <input
            name="subject"
            value={form.subject}
            onChange={handleChange}
            disabled={isLocked}
          />

          <label>Semester</label>
          <input
            name="semester"
            value={form.semester}
            onChange={handleChange}
            disabled={isLocked}
          />

          <label>Exam Date</label>
          <input
            type="date"
            name="examDate"
            min={today}
            value={form.examDate}
            onChange={handleChange}
            disabled={isLocked}
          />

          <label>Start Time</label>
          <input
            type="time"
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
            disabled={isLocked}
          />

          <label>End Time</label>
          <input
            type="time"
            name="endTime"
            value={form.endTime}
            onChange={handleChange}
            disabled={isLocked}
          />

          <label>Total Marks</label>
          <input
            type="number"
            name="totalMarks"
            value={form.totalMarks}
            onChange={handleChange}
            disabled={isLocked}
          />

          <label>Duration (minutes)</label>
          <input
            type="number"
            name="duration"
            value={form.duration}
            onChange={handleChange}
            disabled={isLocked}
          />

          <label>Total Questions</label>
          <input
            type="number"
            name="totalQuestions"
            value={form.totalQuestions}
            onChange={handleChange}
            disabled={isLocked}
          />

          {!isLocked && (
            <button type="submit">Update Exam</button>
          )}
        </form>
      </div>
    </div>
  );
}

export default EditExam;