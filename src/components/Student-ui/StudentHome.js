import React from "react";
import { Link } from "react-router-dom";
import "./StudentHome.css";
import gplogo from "../Student-ui/gplogo.jpeg"; 
import { MdOutlineEditNote } from "react-icons/md";
import { HiOutlineChartBar } from "react-icons/hi";

function StudentHome() {
  return (
    <div className="student-home-container">

      <h1 className="student-title">Welcome, Student</h1>

      <div className="card-section">

        {/* Attempt Exam */}
        <Link to="/attempt-exams" className="home-card">
          <MdOutlineEditNote className="card-icon"/>
          <h3>Attempt Exam</h3>
          <p>Start your online examinations.</p>
        </Link>

        {/* Results */}
        <Link to="/StudentResults" className="home-card">
          <HiOutlineChartBar className="card-icon"/>
          <h3>Results</h3>
          <p>View marks and performance.</p>
        </Link>

      </div>

      <div className="logo-container">
        <img src={gplogo} className="college-logo" alt="logo" />
        <p className="college-text">GOV. POLYTECHNIC SAKOLI</p>
      </div>

    </div>
  );
}

export default StudentHome;
