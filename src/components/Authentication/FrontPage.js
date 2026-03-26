import React from "react";
import { Link } from "react-router-dom";
import { FaUserGraduate, FaChalkboardTeacher, FaUniversity, FaArrowRight } from 'react-icons/fa';
import "./FrontPage.css";
import logo from "../../logo.svg";

function FrontPage() {
    return (
        <div className="front-wrapper">

            <header className="main-nav">
                <div className="nav-logo">
                    <img src={logo} alt="SecureExam Logo" className="shield-logo" style={{ width: '85px', height: '85px', objectFit: 'contain' }} />
                    <span>e-ExamEdge</span>
                </div>
                <div className="nav-links">
                    <Link to="/signup" className="nav-btn primary">Sign Up</Link>
                </div>
            </header>

            <main className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">Next-Gen Academic Evaluation</div>
                    <h1 className="hero-title">
                        Advanced Examination <br />
                        <span>With AI Proctoring</span>
                    </h1>
                    <p className="hero-subtitle">
                        A sophisticated, secure, and seamless platform for modern educational institutions to conduct high-integrity digital exams.
                    </p>
                </div>

                <div className="role-selection-grid">
                    <Link to="/StudentLogin" className="role-card glass-card">
                        <div className="card-icon student"><FaUserGraduate /></div>
                        <h3>Student Login</h3>
                        <p>Access your scheduled Exam and view Results.</p>
                        <div className="card-footer">Give Exam<FaArrowRight /></div>
                    </Link>

                    <Link to="/login?role=teacher" className="role-card glass-card">
                        <div className="card-icon teacher"><FaChalkboardTeacher /></div>
                        <h3>Teacher login</h3>
                        <p>Manage courses, Manage Students, design Exams, and monitor student progress.</p>
                        <div className="card-footer">Create Exam<FaArrowRight /></div>
                    </Link>

                    <Link to="/login?role=principal" className="role-card glass-card">
                        <div className="card-icon org"><FaUniversity /></div>
                        <h3>Organization Login</h3>
                        <p>Configure organizational protocols, manage faculty, and overview institution analytics.</p>
                        <div className="card-footer">Manage Organization <FaArrowRight /></div>
                    </Link>
                </div>

                <div className="front-footer-cta">
                    <p>New to the e-ExamEdge?</p>
                    <Link to="/signup" className="cta-link">
                        Register your account here <FaArrowRight />
                    </Link>
                </div>
            </main>
        </div>
    );
}

export default FrontPage;
