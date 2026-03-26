import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBook,
  FaClipboardList,
  FaPlusCircle,
  FaPenFancy,
  FaUsers,
  FaLink,
  FaUserCircle,
  FaSearch,
  FaGraduationCap
} from "react-icons/fa";
import { BASE_URL } from '../../../config';
import "./SoloTeacherDashboard.css";
import logo from "../../../logo.svg";

const SoloTeacherDashboard = ({ user, token, logout }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalStudents: 0, totalClasses: 0, totalExams: 0 });
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);

  const appLogo = logo;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Stats
        const statsRes = await fetch(`${BASE_URL}/teacher/stats`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }

        // 2. Fetch Classes for Search Discovery
        const classesRes = await fetch(`${BASE_URL}/classes`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const classesData = await classesRes.json();
        if (Array.isArray(classesData)) {
          setClasses(classesData);
        }

        // 3. Fetch Exams for Search Discovery
        const examsRes = await fetch(`${BASE_URL}/exams`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const examsData = await examsRes.json();
        if (Array.isArray(examsData)) {
          setExams(examsData);
        }

      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  // Search filtering logic (by name or subject)
  const filteredClasses = classes.filter(c =>
    c.className?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.branch?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExams = exams.filter(e =>
    e.examName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="solo-dashboard-loading">
      <div className="loader"></div>
      <p>Loading your academic data...</p>
    </div>
  );

  const newLocal = <p>Create </p>;
  return (
    <div className="solo-dashboard-wrapper animate-fade-in">
      {/* Sidebar / Navigation Rail */}
      <div className="solo-side-nav">
        <div className="nav-logo-section">
          <img src={appLogo} alt="Logo" className="solo-app-logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
          <span className="solo-app-name">e-ExamEdge</span>
        </div>

        <nav className="solo-nav-items">
          <div className="nav-item active" onClick={() => navigate("/")}>
            <FaUserCircle /> <span>Dashboard</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/Classes")}>
            <FaBook /> <span>Classes</span>
          </div>
          <div className="nav-item" onClick={() => navigate("/Exams")}>
            <FaClipboardList /> <span>Exams</span>
          </div>
        </nav>

        <button className="solo-logout-trigger" onClick={logout}>
          Logout
        </button>
      </div>

      {/* Main Content Area */}
      <main className="solo-main-content">
        <header className="solo-header-redesigned">
          <div className="greeting-container">
            <span className="greeting-label">Welcome back,</span>
            <h1 className="teacher-name-hero">{user?.name || "Educator"}</h1>
          </div>

          <div className="search-discovery-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search classes or exams by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </header>

        {/* Hero Metrics Section */}
        <section className="solo-hero-section">
          <div className="hero-stat-card primary">
            <div className="hero-stat-icon"><FaUsers /></div>
            <div className="hero-stat-info">
              <span className="hero-stat-label">Total Students Enrolled</span>
              <h2 className="hero-stat-value">{stats.totalStudents}</h2>
            </div>
          </div>

          <div className="hero-stat-group">
            <div className="mini-stat">
              <span className="mini-label">Active Classes</span>
              <span className="mini-value">{stats.totalClasses}</span>
            </div>
            <div className="mini-stat">
              <span className="mini-label">Scheduled Exams</span>
              <span className="mini-value">{stats.totalExams}</span>
            </div>
          </div>
        </section>

        {/* Search Results / Discovery Area */}
        {(searchQuery.length > 0) && (
          <section className="search-results-section animate-slide-up">
            <div className="result-group">
              <h3>Search..</h3>
              <div className="results-grid">
                {filteredClasses.map(c => (
                  <div key={`cls-${c._id}`} className="result-item" onClick={() => navigate(`/class/${c._id}`)}>
                    <FaGraduationCap className="res-icon" />
                    <div>
                      <h4>{c.className}</h4>
                      <p>{c.branch} • {c.students?.length || 0} Students</p>
                    </div>
                  </div>
                ))}
                {filteredExams.map(e => (
                  <div key={`ex-${e._id}`} className="result-item exam-res" onClick={() => navigate(`/exams`)}>
                    <FaClipboardList className="res-icon" />
                    <div>
                      <h4>{e.examName}</h4>
                      <p>{e.subject} • {e.status} {e.branch && e.branch !== 'N/A' ? `• ${e.branch}` : ''} {e.semester && e.semester !== 'N/A' ? `• Sem ${e.semester}` : ''}</p>
                    </div>
                  </div>
                ))}
                {filteredClasses.length === 0 && filteredExams.length === 0 && (
                  <p className="no-results">No matches found for "{searchQuery}"</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Quick Action Grid */}
        <section className="solo-action-grid">
          <div className="action-tile create-class" onClick={() => navigate("/CreateClass")}>
            <FaPlusCircle className="tile-icon" />
            <div className="tile-text">
              <h3>Start a New Class</h3>
              <p>Create your teaching space.</p>
            </div>
          </div>

          <div className="action-tile create-exam" onClick={() => navigate("/CreateExam")}>
            <FaPenFancy className="tile-icon" />
            <div className="tile-text">
              <h3>Create an Exam</h3>
              {/* {newLocal} */}
            </div>
          </div>

          <div className="action-tile join-link-tile" onClick={() => {
            const link = `${window.location.origin}/join-class`;
            navigator.clipboard.writeText(link);
            alert("Portal link copied to clipboard!");
          }}>
            <FaLink className="tile-icon" />
            <div className="tile-text">
              <h3>Share Join Link</h3>
              <p>Invite students to your portal instantly.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SoloTeacherDashboard;
