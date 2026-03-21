import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../../config";
import {
  FaBook,
  FaClipboardList,
  FaPlusCircle,
  FaPenFancy,
  FaUsers,
  FaUserGraduate,
  FaCog,
  FaChartLine,
  FaBell,
  FaLayerGroup
} from "react-icons/fa";

const OrgTeacherDashboard = ({ user, org, token }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    if (token) {
      axios.get('/api/notices', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => setNotices(res.data.notices))
        .catch(err => console.error("Notice error:", err));
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      const endpoint = user?.role === 'principal' ? '/principal/stats' : '/teacher/stats';
      fetch(`${BASE_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.stats);
      })
      .catch(err => console.error("Stats error:", err));
    }
  }, [user, token]);

  return (
    <>
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

      {/* Stats Grid */}
      {stats && (
        <div className="stats-grid">
          {user?.role === 'principal' ? (
            <>
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
            </>
          ) : null}
        </div>
      )}

      {/* Cards Container */}
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
            <div className="card curriculum-card" onClick={() => navigate("/CurriculumManagement")}>
              <FaLayerGroup className="card-icon" />
              <h3>Curriculum</h3>
              <p>Manage academic structure</p>
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
    </>
  );
};

export default OrgTeacherDashboard;
