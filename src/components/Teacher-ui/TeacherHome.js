import React from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherHome.css";

// Icons
import {
  FaBook,
  FaClipboardList,
  FaPlusCircle,
  FaPenFancy,
} from "react-icons/fa";

function TeacherHome() {
  const navigate = useNavigate();

  return (
    <div className="student-home-container">
      {/* Header */}
      <h1 className="welcome-text">Welcome Teacher</h1>

      {/* Cards */}
      <div className="cards-container">
        <div className="card" onClick={() => navigate("/Classes")}>
          <FaBook className="card-icon" />
          <h3>Classes</h3>
          <p>View & manage classes</p>
        </div>

        <div className="card" onClick={() => navigate("/Exams")}>
          <FaClipboardList className="card-icon" />
          <h3>Exams</h3>
          <p>View & manage exams</p>
        </div>

        <div className="card" onClick={() => navigate("/CreateClass")}>
          <FaPlusCircle className="card-icon" />
          <h3>Create Class</h3>
          <p>Create a new class</p>
        </div>

        <div className="card" onClick={() => navigate("/CreateExam")}>
          <FaPenFancy className="card-icon" />
          <h3>Create Exam</h3>
          <p>Create a new exam</p>
        </div>
      </div>

      {/* College Logo */}
      <div className="college-logo-section">
        <div className="college-logo-wrapper">
          <img
            src="/images/gplogo.jpeg"
            alt="College Logo"
            className="college-logo"
          />
          <h3 className="college-name">GOVT. SAKOLI</h3>
        </div>
      </div>
    </div>
  );
}

export default TeacherHome;
