import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./TeacherHome.css";
import { BASE_URL } from "../../config";
import axios from "axios";

// Icons
import {
  FaBook,
  FaClipboardList,
  FaPlusCircle,
  FaPenFancy,
  FaSignOutAlt,
  FaUsers,
  FaUserGraduate,
  FaCog,
  FaChartBar,
  FaChartLine,
  FaBell
} from "react-icons/fa";

function TeacherHome() {
  const navigate = useNavigate();
  const { user, org, token, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    if (token) {
      axios.get('/api/notices')
        .then(res => setNotices(res.data.notices))
        .catch(err => console.error("Notice error:", err));
    }
  }, [token]);

  useEffect(() => {
    if (user?.role === 'principal' && token) {
      fetch(`${BASE_URL}/principal/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.stats);
      })
      .catch(err => console.error("Stats error:", err));
    }
  }, [user, token]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="teacher-home-container">
      {/* Header with Logout and Branding */}
      <div className="top-bar">
        <div className="branding-header">
           {org?.logo ? (
             <img src={org.logo} alt="Org Logo" className="header-logo" />
           ) : (
             <div className="header-logo-placeholder">{org?.name?.charAt(0) || 'O'}</div>
           )}
           <div className="branding-info">
              <h1 className="welcome-text">
                {org?.name || (user?.role === 'principal' ? 'Organization Dashboard' : 'Teacher Dashboard')}
              </h1>
              <p className="user-welcome">Welcome back, {user?.name || "User"}</p>
           </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

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

      {/* Stats for Principal */}
      {user?.role === 'principal' && stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <FaUsers className="stat-icon" />
            <div className="stat-info">
              <h4>Teachers</h4>
              <p>{stats.totalTeachers}</p>
            </div>
          </div>
          <div className="stat-card">
            <FaUserGraduate className="stat-icon" />
            <div className="stat-info">
              <h4>Students</h4>
              <p>{stats.totalStudents}</p>
            </div>
          </div>
          <div className="stat-card">
            <FaBook className="stat-icon" />
            <div className="stat-info">
              <h4>Classes</h4>
              <p>{stats.totalClasses}</p>
            </div>
          </div>
          <div className="stat-card">
            <FaClipboardList className="stat-icon" />
            <div className="stat-info">
              <h4>Exams</h4>
              <p>{stats.totalExams}</p>
            </div>
          </div>
        </div>
      )}

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

        {user?.role === 'principal' && (
          <>
            <div className="card" onClick={() => navigate("/TeacherManagement")}>
              <FaUsers className="card-icon" />
              <h3>Teachers</h3>
              <p>Manage faculty members</p>
            </div>
            <div className="card" onClick={() => navigate("/StudentManagement")}>
              <FaUserGraduate className="card-icon" />
              <h3>Students</h3>
              <p>Institutional student directory</p>
            </div>
            <div className="card" onClick={() => navigate("/Analytics")}>
              <FaChartLine className="card-icon" />
              <h3>Analytics</h3>
              <p>Visual performance insights</p>
            </div>
            <div className="card" onClick={() => navigate("/Notices")}>
              <FaBell className="card-icon" />
              <h3>Notices</h3>
              <p>Institutional announcements</p>
            </div>
            <div className="card" onClick={() => navigate("/Promotion")}>
              <FaUserGraduate className="card-icon" />
              <h3>Promotion</h3>
              <p>Bulk student promotion</p>
            </div>
            <div className="card" onClick={() => navigate("/OrgSettings")}>
              <FaCog className="card-icon" />
              <h3>Settings</h3>
              <p>Organization profile</p>
            </div>
          </>
        )}

        {user?.role === 'teacher' && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

export default TeacherHome;
