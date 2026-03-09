import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateClass.css";

function CreateClass() {
  const navigate = useNavigate();

  const [className, setClassName] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");

  /* 🔹 Static Data */

  const branchOptions = ["CM", "EJ", "CE", "ME", "EE"];

  const yearOptions = ["First Year", "Second Year", "Third Year"];

  const semesterOptions = {
    "First Year": ["1st Sem", "2nd Sem"],
    "Second Year": ["4th Sem"],
    "Third Year": ["6th Sem"],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      className,
      branch,
      year,
      semester,
    };

    const res = await fetch("http://localhost:5000/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to create class");
      return;
    }

    alert("Class Created Successfully");
    navigate("/Classes");
  };

  return (
    <div className="create-class-container">
      <h2>Create Class</h2>

      <form onSubmit={handleSubmit}>
        {/* Class Name */}
        <input
          placeholder="Class Name"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          required
        />

        {/* Branch Dropdown */}
        <select
          value={branch}
          onChange={(e) => {
            setBranch(e.target.value);
            setYear("");
            setSemester("");
          }}
          required
        >
          <option value="">Select Branch</option>
          {branchOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        {/* Year Dropdown */}
        {branch && (
          <select
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setSemester("");
            }}
            required
          >
            <option value="">Select Year</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        )}

        {/* Semester Dropdown */}
        {year && (
          <select
            value={semester}
            onChange={(e) => {
              setSemester(e.target.value);
            }}
            required
          >
            <option value="">Select Semester</option>
            {semesterOptions[year].map((sem) => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>
        )}

        <button type="submit">Create Class</button>
      </form>
    </div>
  );
}

export default CreateClass;
