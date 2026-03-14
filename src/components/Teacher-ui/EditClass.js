import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Toast    from "../Toast";
import useToast from "../useToast";
import "./EditClass.css";
import { BASE_URL } from '../../config';

function EditClass() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();

  const [className, setClassName] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");

  /* 🔹 DROPDOWN DATA */
  const branchOptions = ["CM", "EJ", "CE", "ME", "EE"];
  const yearOptions = ["First Year", "Second Year", "Third Year"];
  const semesterOptions = {
    "First Year": ["1st Sem", "2nd Sem"],
    "Second Year": ["3rd Sem", "4th Sem"],
    "Third Year": ["5th Sem", "6th Sem"],
  };

  /* ================= FETCH CLASS ================= */
  useEffect(() => {
    fetch(`${BASE_URL}/class/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setClassName(data.className);
        setBranch(data.branch);
        setYear(data.year);
        setSemester(data.semester);
      })
      .catch(() => showToast("Failed to load class data.", "error"));
    // eslint-disable-next-line
  }, [id]);

  /* ================= UPDATE ================= */
  const handleUpdate = async (e) => {
    e.preventDefault();

    const res = await fetch(`${BASE_URL}/classes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ className, branch, year, semester }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Update failed", "error");
      return;
    }

    showToast("Class updated successfully! ✅", "success");
    setTimeout(() => navigate("/Classes"), 1500);
  };

  return (
    <div className="edit-class-page">
      <Toast toasts={toasts} removeToast={removeToast} />
      <h2>Edit Class</h2>

      <form className="edit-class-form" onSubmit={handleUpdate}>
        <label>Class Name</label>
        <input value={className} onChange={(e) => setClassName(e.target.value)} required />

        <label>Branch</label>
        <select
          value={branch}
          onChange={(e) => { setBranch(e.target.value); setYear(""); setSemester(""); }}
          required
        >
          <option value="">Select Branch</option>
          {branchOptions.map((b) => (<option key={b} value={b}>{b}</option>))}
        </select>

        {branch && (
          <>
            <label>Year</label>
            <select value={year} onChange={(e) => { setYear(e.target.value); setSemester(""); }} required>
              <option value="">Select Year</option>
              {yearOptions.map((y) => (<option key={y} value={y}>{y}</option>))}
            </select>
          </>
        )}

        {year && (
          <>
            <label>Semester</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} required>
              <option value="">Select Semester</option>
              {semesterOptions[year].map((sem) => (<option key={sem} value={sem}>{sem}</option>))}
            </select>
          </>
        )}

        <button type="submit">Update Class</button>
      </form>
    </div>
  );
}

export default EditClass;
