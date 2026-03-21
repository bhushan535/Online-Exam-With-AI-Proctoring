import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ExamResults.css";
import { BASE_URL } from '../../../config';

function ExamResults() {
  const { examId } = useParams();
  const navigate   = useNavigate();

  const [results,  setResults]  = useState([]);
  const [exam,     setExam]     = useState(null);
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [sortMode, setSortMode] = useState("highest");

  useEffect(() => {
    const load = async () => {
      try {
        const eRes  = await fetch(`${BASE_URL}/exams`);
        const exams = await eRes.json();
        const found = Array.isArray(exams) ? exams.find(e => e._id === examId) : null;
        setExam(found || null);

        const rRes  = await fetch(`${BASE_URL}/results/exam/${examId}`);
        const rData = await rRes.json();
        if (rData.success) setResults(rData.results);

        const sRes  = await fetch(`${BASE_URL}/results/exam/${examId}/summary`);
        const sData = await sRes.json();
        if (sData.success) setSummary(sData.summary);
      } catch (err) {
        console.error("ExamResults load error:", err);
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
    const header = ["Roll No","Student Name","Enrollment","Score","Total Marks","%","Grade","Correct","Wrong","Skipped"];
    const rows   = sorted.map(r => [
      r.rollNo, r.studentName, r.studentId,
      r.score, r.totalMarks, r.percentage, r.grade,
      r.correct, r.wrong, r.unattempted
    ]);
    const csv  = [header, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${exam?.examName || "exam"}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="er-loading">
      <div className="er-spinner" />
      <p>Loading results...</p>
    </div>
  );

  return (
    <div className="er-page">

      {/* Header */}
      <div className="er-header">
        <button className="er-back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div className="er-header-info">
          <h1 className="er-title">📊 {exam?.examName || "Exam"} — Results</h1>
          <p className="er-subtitle">
            {exam?.subject} ({exam?.subCode})&nbsp;·&nbsp;
            {exam?.branch}&nbsp;·&nbsp;{exam?.semester}&nbsp;·&nbsp;
            Total Marks: {exam?.totalMarks}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="er-summary">
          <div className="er-stat-card">
            <span className="er-stat-num">{summary.totalAttempted}</span>
            <span className="er-stat-lbl">Submitted</span>
          </div>
          <div className="er-stat-card">
            <span className="er-stat-num">{summary.avgScore}<span className="er-stat-denom">/{summary.totalMarks}</span></span>
            <span className="er-stat-lbl">Avg Score</span>
          </div>
          <div className="er-stat-card er-stat-green">
            <span className="er-stat-num">{summary.highest}<span className="er-stat-denom">/{summary.totalMarks}</span></span>
            <span className="er-stat-lbl">Highest</span>
          </div>
          <div className="er-stat-card er-stat-red">
            <span className="er-stat-num">{summary.lowest}<span className="er-stat-denom">/{summary.totalMarks}</span></span>
            <span className="er-stat-lbl">Lowest</span>
          </div>
          <div className="er-stat-card">
            <span className="er-stat-num">{summary.passRate}%</span>
            <span className="er-stat-lbl">Pass Rate</span>
          </div>
        </div>
      )}

      {/* Controls */}
      {results.length > 0 && (
        <div className="er-controls">
          <div className="er-sort-group">
            <span className="er-sort-label">Sort:</span>
            <button className={`er-sort-btn ${sortMode === "highest" ? "er-sort-active" : ""}`} onClick={() => setSortMode("highest")}>⬇ Highest First</button>
            <button className={`er-sort-btn ${sortMode === "lowest" ? "er-sort-active" : ""}`} onClick={() => setSortMode("lowest")}>⬆ Lowest First</button>
            <button className={`er-sort-btn ${sortMode === "rollno" ? "er-sort-active" : ""}`} onClick={() => setSortMode("rollno")}>🔢 Roll No.</button>
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
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Enrollment</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Correct</th>
                <th>Wrong</th>
                <th>Skipped</th>
                <th>Result</th>
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
                  <td>
                    <span className="er-grade-badge" style={{ background: gradeColor(r.grade) }}>{r.grade}</span>
                  </td>
                  <td className="er-correct">{r.correct}</td>
                  <td className="er-wrong">{r.wrong}</td>
                  <td className="er-skip">{r.unattempted}</td>
                  <td>
                    <span className={r.percentage >= 40 ? "er-pass-tag" : "er-fail-tag"}>
                      {r.percentage >= 40 ? "Pass" : "Fail"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ExamResults;
