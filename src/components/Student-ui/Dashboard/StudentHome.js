import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./StudentHome.css";
import { FaUserGraduate, FaHistory, FaPenNib, FaFileAlt, FaSignOutAlt, FaBell } from "react-icons/fa";
import { BASE_URL } from "../../../config";
import axios from "axios";

function StudentHome() {
  const navigate = useNavigate();
  const { user, org, token, logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    if (token) {
      axios.get('/api/notices')
        .then(res => setNotices(res.data.notices))
        .catch(err => console.error("Notice error:", err));
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetch(`${BASE_URL}/student/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile(data.student);
          setHistory(data.student.academicHistory || []);
        }
      })
      .catch(err => console.error("History fetch error:", err));
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="student-home-container">
      {/* Institutional Branding Header */}
      <div className="student-topbar">
        <div className="brand-box">
          {org?.logo ? (
            <img src={org.logo} alt="College Logo" className="org-nav-logo" />
          ) : (
            <div className="org-nav-placeholder">{(org?.organizationName || org?.name || 'O').charAt(0)}</div>
          )}
          <div className="brand-text">
            <span className="org-name-nav">{org?.organizationName || org?.name || "Institution Dashboard"}</span>
            <div className="student-greeting-info">
              <span className="student-hello">👋 Welcome,</span>
              <span className="student-realname">{user?.name}</span>
            </div>
          </div>
        </div>
        <button className="student-logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

      <div className="dashboard-layout">
        <div className="main-content">
          <h1 className="student-title">What would you like to do?</h1>
          
          {/* Latest Notices Feed */}
          {notices.length > 0 && (
            <div className="notices-feed-horizontal">
              <div className="feed-header">
                <h3><FaBell className="notif-icon" /> Announcements</h3>
              </div>
              <div className="notices-scroll">
                {notices.map((n) => (
                  <div key={n._id} className={`feed-item priority-${n.priority}`}>
                    <div className="item-dot" />
                    <div className="item-content">
                      <h4>{n.title}</h4>
                      <p>{n.content.substring(0, 100)}{n.content.length > 100 ? '...' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card-section">
            <div className="home-card" onClick={() => navigate("/attempt-exams")}>
              <FaPenNib className="card-icon" />
              <h3>Attempt Exam</h3>
              <p>Start your online examinations.</p>
            </div>

            <div className="home-card" onClick={() => navigate("/StudentResults")}>
              <FaFileAlt className="card-icon" />
              <h3>My Results</h3>
              <p>View your marks and performance.</p>
            </div>
          </div>
        </div>

        <div className="history-sidebar">
          <div className="sidebar-header">
            <h3><FaHistory /> Academic History</h3>
            <span className="history-badge">Complete</span>
          </div>
          
          <div className="history-list">
            {history.length === 0 ? (
              <div className="no-history-box">
                <FaUserGraduate className="empty-icon" />
                <p>Starting your journey! No past semesters yet.</p>
              </div>
            ) : (
              history.slice().reverse().map((h, i) => (
                <div key={i} className="history-item" onClick={() => navigate(`/StudentResults?semester=${h.semester}&year=${h.year}`)}>
                  <div className="h-main">
                    <span className="h-sem">{h.semester}</span>
                    <span className="h-year">{h.year}</span>
                  </div>
                  <div className="h-meta">
                    <span className="h-date">{new Date(h.completedAt).toLocaleDateString()}</span>
                    <span className="h-view">View Marks →</span>
                  </div>
                </div>
              ))
            )}
            
            <div className="history-item current active">
              <div className="h-main">
                <span className="h-sem">Current: {profile?.currentSemester || "N/A"}</span>
                <span className="h-year">{profile?.currentYear || "N/A"}</span>
              </div>
              <div className="h-status">In Progress</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default StudentHome;
