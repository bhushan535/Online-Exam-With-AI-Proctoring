import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Toast from "../../Common/Toast";
import useToast from "../../Common/useToast";
import PopupModal from "../../Common/PopupModal";
import ProctorLogsModal from "../Shared/ProctorLogsModal";
import { useAuth } from "../../../context/AuthContext";
import "./StudentResults.css";
import { BASE_URL } from '../../../config';

function StudentResults() {
  const { examId } = useParams();
  const navigate   = useNavigate();
  const { token }  = useAuth();

  const [exam,     setExam]     = useState(null);
  const [results,  setResults]  = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [sortMode, setSortMode] = useState("highest");
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reattemptModal, setReattemptModal] = useState({ open: false, studentId: null, studentName: "" });
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const rRes  = await fetch(`${BASE_URL}/results/exam/${examId}`);
        const rData = await rRes.json();
        if (rData.success) {
          setExam(rData.exam);
          setResults(rData.results || []);
        }

        const sRes  = await fetch(`${BASE_URL}/results/exam/${examId}/summary`);
        const sData = await sRes.json();
        if (sData.success) setSummary(sData.summary);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [examId]);

  /* Sorting */
  const sorted = [...results].sort((a, b) => {
    if (sortMode === "highest") return b.score - a.score;
    if (sortMode === "lowest")  return a.score - b.score;
    if (sortMode === "rollno")  return (Number(a.rollNo) || 999) - (Number(b.rollNo) || 999);
    return 0;
  });

  /* Grade color */
  const gradeColor = (g) => ({
    A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#ea580c", F: "#dc2626"
  }[g] || "#6b7280");

  /* Export CSV */
  const exportCSV = () => {
    if (!sorted.length) { showToast("No results to export.", "warning"); return; }
    const header = ["Roll No","Student Name","Enrollment","Score","Total Marks","%","Grade","Correct","Wrong","Skipped","Result"];
    const rows   = sorted.map(r => [
      r.rollNo, r.studentName, r.studentId, r.score, r.totalMarks,
      r.percentage, r.grade, r.correct, r.wrong, r.unattempted,
      r.percentage >= 40 ? "Pass" : "Fail"
    ]);
    const csv  = [header, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href  = url;
    link.setAttribute("download", `${exam?.examName || "exam"}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Results exported!", "success");
  };

  /* Re-attempt: delete student result + proctor logs */
  const handleReattempt = async (studentId) => {
    try {
      const res = await fetch(`${BASE_URL}/results/exam/${examId}/student/${studentId}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Remove from local state
        const updatedResults = results.filter(r => r.studentId !== studentId);
        setResults(updatedResults);

        // Recompute summary from remaining results
        if (updatedResults.length > 0) {
          const scores = updatedResults.map(r => r.score);
          const totalMarks = updatedResults[0].totalMarks;
          const passed = updatedResults.filter(r => r.percentage >= 40).length;
          setSummary({
            totalAttempted: updatedResults.length,
            avgScore: +((scores.reduce((a, b) => a + b, 0) / updatedResults.length).toFixed(2)),
            highest: Math.max(...scores),
            lowest: Math.min(...scores),
            passRate: +((passed / updatedResults.length * 100).toFixed(1)),
            totalMarks,
          });
        } else {
          setSummary({ totalAttempted: 0, avgScore: 0, highest: 0, lowest: 0, passRate: 0, totalMarks: summary?.totalMarks || 0 });
        }

        showToast(data.message || "Student can now re-attempt the exam.", "success");
      } else {
        showToast(data.message || "Failed to allow re-attempt.", "error");
      }
    } catch (err) {
      console.error("Re-attempt error:", err);
      showToast("Network error during re-attempt.", "error");
    }
  };

  if (loading) return (
    <div className="er-loading">
      <div className="er-spinner" />
      <p>Loading results...</p>
    </div>
  );

  return (
    <div className="er-page">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="er-header">
        <button className="er-back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div className="er-header-info">
          <h1 className="er-title">📊 {exam?.examName || "Exam"} — Results</h1>
          <p className="er-subtitle">
            {exam?.subject} ({exam?.subCode})&nbsp;·&nbsp;{exam?.branch}&nbsp;·&nbsp;{exam?.semester}&nbsp;·&nbsp;Total Marks: {exam?.totalMarks}
          </p>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="er-summary">
          <div className="er-stat-card"><span className="er-stat-num">{summary.totalAttempted}</span><span className="er-stat-lbl">Submitted</span></div>
          <div className="er-stat-card"><span className="er-stat-num">{summary.avgScore}<span className="er-stat-denom">/{summary.totalMarks}</span></span><span className="er-stat-lbl">Avg Score</span></div>
          <div className="er-stat-card er-stat-green"><span className="er-stat-num">{summary.highest}<span className="er-stat-denom">/{summary.totalMarks}</span></span><span className="er-stat-lbl">Highest</span></div>
          <div className="er-stat-card er-stat-red"><span className="er-stat-num">{summary.lowest}<span className="er-stat-denom">/{summary.totalMarks}</span></span><span className="er-stat-lbl">Lowest</span></div>
          <div className="er-stat-card"><span className="er-stat-num">{summary.passRate}%</span><span className="er-stat-lbl">Pass Rate</span></div>
        </div>
      )}

      {/* Controls */}
      {results.length > 0 && (
        <div className="er-controls">
          <div className="er-sort-group">
            <span className="er-sort-label">Sort:</span>
            <button className={`er-sort-btn ${sortMode === "highest" ? "er-sort-active" : ""}`} onClick={() => setSortMode("highest")}>⬇ Highest</button>
            <button className={`er-sort-btn ${sortMode === "lowest" ? "er-sort-active" : ""}`} onClick={() => setSortMode("lowest")}>⬆ Lowest</button>
            <button className={`er-sort-btn ${sortMode === "rollno" ? "er-sort-active" : ""}`} onClick={() => setSortMode("rollno")}>🔢 Roll No</button>
          </div>
          <button className="er-export-btn" onClick={exportCSV}>📥 Export CSV</button>
        </div>
      )}

      {/* Table */}
      {results.length === 0 ? (
        <div className="er-empty">
          <div className="er-empty-icon">📭</div>
          <h3>No submissions yet</h3>
          <p>Results will appear here once students complete the exam.</p>
        </div>
      ) : (
        <div className="er-table-wrap">
          <table className="er-table">
            <thead>
              <tr>
                <th>Roll No</th><th>Student Name</th><th>Enrollment</th>
                <th>Score</th><th>%</th><th>Grade</th>
                <th>Correct</th><th>Wrong</th><th>Skipped</th><th>Result</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r._id} className={r.percentage >= 40 ? "er-row-pass" : "er-row-fail"}>
                  <td className="er-rollno">{r.rollNo}</td>
                  <td className="er-name">{r.studentName}</td>
                  <td className="er-enrollment">{r.studentId}</td>
                  <td className="er-score"><strong>{r.score}/{r.totalMarks}</strong></td>
                  <td>{r.percentage}%</td>
                  <td><span className="er-grade-badge" style={{ background: gradeColor(r.grade) }}>{r.grade}</span></td>
                  <td className="er-correct">{r.correct}</td>
                  <td className="er-wrong">{r.wrong}</td>
                  <td className="er-skip">{r.unattempted}</td>
                  <td><span className={r.percentage >= 40 ? "er-pass-tag" : "er-fail-tag"}>{r.percentage >= 40 ? "Pass" : "Fail"}</span></td>
                  <td className="er-actions-cell">
                    <button 
                      className="er-view-logs-btn"
                      onClick={() => { setSelectedStudent({ id: r.studentId, name: r.studentName }); setShowLogsModal(true); }}
                    >
                      View Logs
                    </button>
                    <button 
                      className="er-reattempt-btn"
                      onClick={() => setReattemptModal({ open: true, studentId: r.studentId, studentName: r.studentName })}
                    >
                      Re-attempt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProctorLogsModal 
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        examId={examId}
        studentId={selectedStudent?.id}
        studentName={selectedStudent?.name}
      />

      <PopupModal
        isOpen={reattemptModal.open}
        type="warning"
        title="Allow Re-attempt?"
        message={`Are you sure? This will delete ${reattemptModal.studentName}'s result and proctoring logs. They can then retake the exam.`}
        confirmText="Yes, Allow Re-attempt"
        cancelText="Cancel"
        onConfirm={async () => {
          await handleReattempt(reattemptModal.studentId);
          setReattemptModal({ open: false, studentId: null, studentName: "" });
        }}
        onCancel={() => setReattemptModal({ open: false, studentId: null, studentName: "" })}
      />
    </div>
  );
}

export default StudentResults;
