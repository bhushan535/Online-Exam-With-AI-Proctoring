import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./StudentHome.css";
import { FaUserGraduate, FaHistory, FaPenNib, FaFileAlt, FaSignOutAlt, FaBell } from "react-icons/fa";
import { BASE_URL } from "../../../config";
import axios from "axios";

function StudentHome() {
  const navigate = useNavigate();
  const { user, org, token, logout, updateUser } = useAuth();
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
      axios.get(`${BASE_URL}/student/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        const data = res.data;
        if (data.success) {
          setProfile(data.student);
          setHistory(data.student.academicHistory || []);
          
          // Sync classId in localStorage/Context if it changed via promotion
          if (data.currentClassId && data.currentClassId !== user?.classId) {
            updateUser({ classId: data.currentClassId });
          }
        }
      })
      .catch(err => console.error("History fetch error:", err));
    }
  }, [token, user?.classId, updateUser]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="student-home-container">
      {/* Institutional Branding Header */}
      <div className="student-topbar">
        <div className="sh-brand-box">
          {org?.logo ? (
            <img src={org.logo} alt="College Logo" className="org-nav-logo" />
          ) : (
            <div className="org-nav-placeholder">{(org?.organizationName || org?.name || 'O').charAt(0)}</div>
          )}
          <div className="sh-brand-text">
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
              <div className="sh-feed-header">
                <h3><FaBell className="notif-icon" /> Announcements</h3>
              </div>
              <div className="notices-scroll">
                {notices.map((n) => (
                  <div key={n._id} className={`sh-feed-item sh-priority-${n.priority}`}>
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
            <div className="sh-home-card" onClick={() => navigate("/attempt-exams")}>
              <FaPenNib className="sh-card-icon" />
              <h3>Attempt Exam</h3>
              <p>Start your online examinations.</p>
            </div>

            <div className="sh-home-card" onClick={() => navigate("/StudentResults")}>
              <FaFileAlt className="sh-card-icon" />
              <h3>My Results</h3>
              <p>View your marks and performance.</p>
            </div>
          </div>
        </div>

        <div className="history-sidebar">
          <div className="sh-sidebar-header">
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
                    <span className="h-sem">Semester {h.semester}</span>
                    <span className="h-year">{h.year && h.year !== 'Unknown' ? h.year : 'Academic Session'}</span>
                  </div>
                  
                  {/* Performance Snapshot */}
                  {h.examResults && h.examResults.length > 0 && (
                    <div className="h-results-mini">
                      {h.examResults.slice(0, 2).map((res, idx) => (
                        <div key={idx} className="h-res-line">
                          <span className="h-res-name">{res.subject || res.examName}</span>
                          <span className="h-res-score">{res.score}/{res.totalMarks}</span>
                        </div>
                      ))}
                      {h.examResults.length > 2 && <div className="h-more">+{h.examResults.length - 2} more subjects...</div>}
                    </div>
                  )}

                  <div className="h-meta">
                    <span className="h-date">Completed: {new Date(h.completedAt).toLocaleDateString()}</span>
                    <span className="h-view">View Marks →</span>
                  </div>
                </div>
              ))
            )}
            
            <div className="history-item current active">
              <div className="h-main">
                <span className="h-sem" style={{ background: '#10b981' }}>Current Semester</span>
                <span className="h-year">{profile?.currentYear && profile.currentYear !== 'Unknown' ? profile.currentYear : '2024-25'} (Semester {profile?.currentSemester || "N/A"})</span>
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
