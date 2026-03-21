import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import "./StudentResult.css";

function StudentResult() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Support both context-based user and legacy student object
  const student = user || JSON.parse(localStorage.getItem("student") || "{}");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const urlParams = new URLSearchParams(window.location.search);
  const [filterSem, setFilterSem] = useState(urlParams.get("semester") || "");
  const [filterYear, setFilterYear] = useState(urlParams.get("year") || "");

  useEffect(() => {
    // Determine enrollment from the student object (either from context or localStorage)
    const enrollment = student.enrollment; 

    if (!enrollment) {
      navigate("/StudentHome");
      return;
    }
    
    axios.get(`/api/results/student/${enrollment}`)
      .then(res => {
        if (res.data.success) setResults(res.data.results);
        else setError("Could not load results.");
      })
      .catch(() => setError("Connection error."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [student]);

  const filteredResults = results.filter(r => {
    const semMatch = filterSem === "" || r.semester === filterSem;
    const yearMatch = filterYear === "" || r.year === filterYear;
    return semMatch && yearMatch;
  });

  const uniqueSemesters = [...new Set(results.map(r => r.semester).filter(Boolean))];
  const uniqueYears = [...new Set(results.map(r => r.year).filter(Boolean))];

  /* Summary stats */
  const totalExams   = filteredResults.length;
  const avgPct       = totalExams ? Math.round(filteredResults.reduce((s, r) => s + r.percentage, 0) / totalExams) : 0;
  const gradeRank    = { A: 5, B: 4, C: 3, D: 2, F: 1 };
  const bestGrade    = totalExams ? filteredResults.reduce((b, r) => ((gradeRank[r.grade] || 0) > (gradeRank[b] || 0) ? r.grade : b), "F") : "—";
  const totalCorrect = filteredResults.reduce((s, r) => s + (r.correct || 0), 0);

  /* Helpers */
  const gradeColor = (g) => ({ A: "#16a34a", B: "#2563eb", C: "#d97706", D: "#ea580c", F: "#dc2626" }[g] || "#6b7280");
  const barColor   = (pct) => pct >= 75 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444";
  const fmtDate    = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";

  if (loading) return (
    <div className="sr-center"><div className="sr-spinner" /><p>Loading results...</p></div>
  );
  if (error) return (
    <div className="sr-center">
      <p className="sr-error-msg">{error}</p>
      <button className="sr-go-btn" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  return (
    <div className="sr-page">

      {/* Header */}
      <div className="sr-header">
        <button className="sr-back" onClick={() => navigate("/StudentHome")}>← Back</button>
        <div className="sr-header-text">
          <h1 className="sr-title">📊 My Exam Results</h1>
          <p className="sr-student-name">{student.name}</p>
        </div>
      </div>

      {/* Semester/Year Filter Bar */}
      {(uniqueSemesters.length > 0 || uniqueYears.length > 0) && (
        <div className="sr-filter-bar">
          <div className="sr-filter-group">
            <label>Semester:</label>
            <select value={filterSem} onChange={(e) => setFilterSem(e.target.value)}>
              <option value="">All Semesters</option>
              {uniqueSemesters.map(sem => <option key={sem} value={sem}>{sem}</option>)}
            </select>
          </div>
          <div className="sr-filter-group">
            <label>Year:</label>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
              <option value="">All Years</option>
              {uniqueYears.map(yr => <option key={yr} value={yr}>{yr}</option>)}
            </select>
          </div>
          {(filterSem || filterYear) && (
            <button className="sr-reset-btn" onClick={() => { setFilterSem(""); setFilterYear(""); }}>Reset</button>
          )}
        </div>
      )}

      {/* Summary row */}
      {totalExams > 0 && (
        <div className="sr-summary">
          <div className="sr-stat"><span className="sr-stat-val">{totalExams}</span><span className="sr-stat-lbl">Exams Attempted</span></div>
          <div className="sr-stat"><span className="sr-stat-val">{avgPct}%</span><span className="sr-stat-lbl">Average Score</span></div>
          <div className="sr-stat"><span className="sr-stat-val" style={{ color: gradeColor(bestGrade) }}>{bestGrade}</span><span className="sr-stat-lbl">Best Grade</span></div>
          <div className="sr-stat"><span className="sr-stat-val">{totalCorrect}</span><span className="sr-stat-lbl">Total Correct</span></div>
        </div>
      )}

      {/* Results list */}
      {filteredResults.length === 0 ? (
        <div className="sr-empty">
          <div className="sr-empty-icon">📭</div>
          <h3>No results found</h3>
          <p>{(filterSem || filterYear) ? "Try changing your filters." : "Attempt an exam first. Your results will appear here."}</p>
          {(filterSem || filterYear) ? (
             <button className="sr-go-btn" onClick={() => { setFilterSem(""); setFilterYear(""); }}>Clear Filters</button>
          ) : (
             <button className="sr-go-btn" onClick={() => navigate("/attempt-exams")}>Go Attempt Exam →</button>
          )}
        </div>
      ) : (
        <div className="sr-list">
          {filteredResults.map((r) => (
            <div className="sr-card" key={r._id}>

              {/* Card top */}
              <div className="sr-card-top">
                <div className="sr-card-left">
                  <h3 className="sr-exam-name">{r.examName}</h3>
                  <span className="sr-subject">{r.subject}{r.subCode ? ` (${r.subCode})` : ""}</span>
                  <span className="sr-date">📅 {fmtDate(r.submittedAt)}</span>
                </div>
                <div className="sr-grade-circle" style={{ background: gradeColor(r.grade) }}>{r.grade}</div>
              </div>

              {/* Score + % */}
              <div className="sr-score-row">
                <span className="sr-score">{r.score} / {r.totalMarks}</span>
                <span className="sr-pct">{r.percentage}%</span>
              </div>

              {/* Progress bar */}
              <div className="sr-bar-bg">
                <div className="sr-bar-fill" style={{ width: `${r.percentage}%`, background: barColor(r.percentage) }} />
              </div>

              {/* Counts */}
              <div className="sr-counts">
                <span className="sr-cnt sr-cnt-correct">✅ Correct: <strong>{r.correct}</strong></span>
                <span className="sr-cnt sr-cnt-wrong">❌ Wrong: <strong>{r.wrong}</strong></span>
                <span className="sr-cnt sr-cnt-skip">➖ Skipped: <strong>{r.unattempted}</strong></span>
              </div>

              {/* Pass/Fail */}
              <div className="sr-result-tag-wrap">
                <span className="sr-result-tag" style={{
                  background: r.percentage >= 40 ? "#f0fdf4" : "#fff5f5",
                  color: r.percentage >= 40 ? "#16a34a" : "#dc2626",
                  border: `1.5px solid ${r.percentage >= 40 ? "#86efac" : "#fca5a5"}`
                }}>
                  {r.percentage >= 40 ? "✔ Pass" : "✘ Fail"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentResult;
