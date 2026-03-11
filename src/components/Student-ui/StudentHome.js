import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./StudentHome.css";
import gplogo from "../Student-ui/gplogo.jpeg";
import { MdOutlineEditNote } from "react-icons/md";
import { HiOutlineChartBar, HiOutlineLogout } from "react-icons/hi";

function StudentHome() {
  const navigate = useNavigate();

  // Read student from localStorage
  const student   = JSON.parse(localStorage.getItem("student") || "{}");
  const fullName  = student?.name || "Student";
  const firstName = fullName.split(" ")[0];

  const handleLogout = () => {
    localStorage.removeItem("student");
    navigate("/StudentLogin");
  };

  return (
    <div className="student-home-container">

      {/* Top bar with name + logout */}
      <div className="student-topbar">
        <div className="student-greeting-info">
          <span className="student-hello">👋 Welcome back,</span>
          <span className="student-realname">{firstName}!</span>
          <span className="student-enrollment">({student?.enrollment})</span>
        </div>
        <button className="student-logout-btn" onClick={handleLogout}>
          <HiOutlineLogout />
          Logout
        </button>
      </div>

      {/* Main title */}
      <h1 className="student-title">What would you like to do?</h1>

      {/* Cards */}
      <div className="card-section">
        <Link to="/attempt-exams" className="home-card">
          <MdOutlineEditNote className="card-icon" />
          <h3>Attempt Exam</h3>
          <p>Start your online examinations.</p>
        </Link>

        <Link to="/StudentResults" className="home-card">
          <HiOutlineChartBar className="card-icon" />
          <h3>My Results</h3>
          <p>View your marks and performance.</p>
        </Link>
      </div>

      {/* College logo */}
      <div className="logo-container">
        <img src={gplogo} className="college-logo" alt="logo" />
        <p className="college-text">GOV. POLYTECHNIC SAKOLI</p>
      </div>

    </div>
  );
}

export default StudentHome;
