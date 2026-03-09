import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./StudentResults.css";

function StudentResults() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/results/exam/${examId}`)
      .then((res) => res.json())
      .then((data) => {
        setExam(data.exam);
        setResults(data.results || []);
      })
      .catch((err) => console.log(err));
  }, [examId]);

  /* ======================
     EXPORT TO EXCEL (CSV)
  ====================== */
  const exportResults = () => {
    if (!results || results.length === 0) {
      alert("No results to export");
      return;
    }

    let csv =
      "Roll No,Enrollment No,Student Name,Marks,Percentage,Result\n";

    results.forEach((r, index) => {
      csv +=
        `${r.rollNo || index + 1},` +
        `${r.enrollment},` +
        `${r.name},` +
        `${r.marks},` +
        `${r.percentage},` +
        `${r.result}\n`;
    });

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute(
      "download",
      `${exam.examName}_results.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!exam) return <p>Loading results...</p>;

  return (
    <div className="teacher-results-page">

      {/* 🔹 EXAM DETAILS */}
      <div className="exam-details">
        <h2>Exam Results</h2>
        <p><b>Exam Name:</b> {exam.examName}</p>
        <p>
          <b>Subject:</b> {exam.subject} ({exam.subCode})
        </p>
        <p><b>Branch:</b> {exam.branch}</p>
        <p><b>Semester:</b> {exam.semester}</p>
        <p><b>Total Marks:</b> {exam.totalMarks}</p>
      </div>

      <hr />

      {/* 🔹 HEADER + EXPORT */}
      <div className="result-header">
        <h3>Student Results ({results.length})</h3>
        <button className="export-btn" onClick={exportResults}>
          Download Result (Excel)
        </button>
      </div>

      {/* 🔹 RESULT TABLE */}
      {results.length === 0 ? (
        <p>No student has submitted the exam yet</p>
      ) : (
        <table className="results-table">
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Enrollment No</th>
              <th>Student Name</th>
              <th>Marks</th>
              <th>Percentage</th>
              <th>Result</th>
            </tr>
          </thead>

          <tbody>
            {results.map((r, index) => (
              <tr key={index}>
                <td>{r.rollNo || index + 1}</td>
                <td>{r.enrollment}</td>
                <td>{r.name}</td>
                <td>{r.marks}</td>
                <td>{r.percentage}%</td>
                <td
                  className={
                    r.result === "Pass" ? "pass" : "fail"
                  }
                >
                  {r.result}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StudentResults;
