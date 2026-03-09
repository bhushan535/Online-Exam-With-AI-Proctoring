import React from "react";
import { Link } from "react-router-dom";
import "./FrontPage.css";
import gplogo from "./gplogo.jpeg"

function FrontPage() {
    return (
        <div className="front-container">
            <div className="front-box">
            <img src={gplogo} alt="college logo" className="college-logo" />

            <h1 className="college-name">Government Polytechnic, Sakoli</h1>

            <h2 className="project-title">Online Examination</h2>

            <div className="button-group">
                <Link to="/StudentLogin" className="btn student-btn">
                    Student Login
                </Link>

                <Link to="/TeacherLogin" className="btn teacher-btn">
                    Teacher Login
                </Link>
            </div>
            </div>
        </div>
    );
}

export default FrontPage;
