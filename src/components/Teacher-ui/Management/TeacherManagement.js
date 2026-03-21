import React, { useEffect, useState } from 'react';
import { useAuth } from "../../../context/AuthContext";
import { BASE_URL } from '../../../config';
import Toast from "../../Common/Toast";
import useToast from "../../Common/useToast";
import PopupModal from "../../Common/PopupModal";
import BackButton from "../../Common/BackButton";
import { FaUserPlus, FaUserShield, FaUsers, FaBuilding, FaIdCard, FaEnvelope, FaTimes, FaTrash, FaKey, FaLock } from 'react-icons/fa';
import "./TeacherManagement.css";

const TeacherManagement = () => {
  const { token, org, refreshOrg } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const [teachers, setTeachers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    employeeId: ''
  });
  const [branches, setBranches] = useState([]);

  const fetchTeachers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/principal/teachers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setTeachers(data.teachers);
    } catch (err) {
      showToast("Failed to retrieve faculty data", "error");
    }
  };

  useEffect(() => {
    if (token) {
        fetchTeachers();
        refreshOrg(); // Ensure branches are up to date
    }
  }, [token]);

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/principal/teacher/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTeacher)
      });
      const data = await res.json();
      if (data.success) {
        showToast("New faculty member registered", "success");
        setShowAddModal(false);
        setNewTeacher({ name: '', email: '', password: '', department: '', employeeId: '' });
        fetchTeachers();
      } else {
        showToast(data.message, "error");
      }
    } catch (err) {
      showToast("Registration failed", "error");
    }
  };

  const handleToggleStatus = async (teacherId) => {
    try {
      const res = await fetch(`${BASE_URL}/principal/teacher/toggle-status/${teacherId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        fetchTeachers();
      } else {
        showToast(data.message, "error");
      }
    } catch (err) {
      showToast("Status update failed", "error");
    }
  };

  const handleResetPassword = async (teacherId, teacherName) => {
    const newPassword = window.prompt(`Enter new password for ${teacherName}:`);
    if (!newPassword) return;

    try {
      const res = await fetch(`${BASE_URL}/principal/teacher/reset-password/${teacherId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Password reset successfully", "success");
        fetchTeachers();
      } else {
        showToast(data.message, "error");
      }
    } catch (err) {
      showToast("Password reset failed", "error");
    }
  };

  const handleDeleteTeacher = async (teacherId, teacherName) => {
    if (!window.confirm(`Are you absolutely sure you want to delete ${teacherName}? This action is irreversible and will delete their entire profile and account.`)) {
        return;
    }

    try {
      const res = await fetch(`${BASE_URL}/principal/teacher/${teacherId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Faculty member purged from system", "success");
        fetchTeachers();
      } else {
        showToast(data.message || "Server rejected deletion protocol", "error");
      }
    } catch (err) {
      console.error("Deletion Error:", err);
      showToast("Network protocol failure (Check console)", "error");
    }
  };

  return (
    <div className="teacher-mgmt-container">
      <BackButton to="/TeacherHome" />
      <Toast toasts={toasts} removeToast={removeToast} />
      
      <div className="mgmt-header">
        <div className="header-text">
            <h2><FaUsers /> Faculty Management</h2>
            <p>Administer teacher credentials and departmental assignments</p>
        </div>
        <button className="add-btn-primary" onClick={() => setShowAddModal(true)}>
          <FaUserPlus /> Onboard New Teacher
        </button>
      </div>

      <div className="teachers-table-wrapper">
        <table className="modern-table">
          <thead>
            <tr>
              <th><FaIdCard /> Name / Employee ID</th>
              <th><FaEnvelope /> Contact Info</th>
              <th><FaBuilding /> Department</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.userId?._id}>
                <td>
                    <div className="user-cell">
                        <span className="user-name">{t.userId?.name}</span>
                        <span className="user-subtext">ID: {t.employeeId || 'N/A'}</span>
                    </div>
                </td>
                <td>{t.userId?.email}</td>
                <td>{t.department || <span className="unassigned">General</span>}</td>
                <td>
                  <span className={`status-pill pill-${t.userId?.status}`}>
                    {t.userId?.status}
                  </span>
                </td>
                <td>
                  <div className="action-button-group">
                    <button 
                      className={`btn-action-icon ${t.userId?.status === 'active' ? 'suspend' : 'activate'}`} 
                      title={t.userId?.status === 'active' ? "Suspend Account" : "Restore Account"}
                      onClick={() => handleToggleStatus(t.userId?._id)}
                    >
                      <FaUserShield /> 
                      <span>{t.userId?.status === 'active' ? " Suspend" : " Activate"}</span>
                    </button>
                    <button 
                      className="btn-action-icon reset" 
                      title="Reset Password"
                      onClick={() => handleResetPassword(t.userId?._id, t.userId?.name)}
                    >
                      <FaLock /> 
                      <span> Reset</span>
                    </button>
                    <button 
                      className="btn-action-icon delete" 
                      title="Delete Faculty Member"
                      onClick={() => handleDeleteTeacher(t.userId?._id, t.userId?.name)}
                    >
                      <FaTrash />
                      <span> Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modern-modal-overlay">
          <div className="modern-modal-card">
            <div className="modal-top">
                <h3>Add New Faculty Member</h3>
                <button className="close-x" onClick={() => setShowAddModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleAddTeacher} className="modern-form">
               <div className="form-grid">
                  <div className="input-group-v2">
                    <label>Full Name</label>
                    <input 
                        type="text" placeholder="e.g. Dr. John Doe" required 
                        value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})}
                    />
                  </div>
                  <div className="input-group-v2">
                    <label>Professional Email</label>
                    <input 
                        type="email" placeholder="email@institution.edu" required 
                        value={newTeacher.email} onChange={e => setNewTeacher({...newTeacher, email: e.target.value})}
                    />
                  </div>
                  <div className="input-group-v2">
                    <label>Access Password</label>
                    <input 
                        type="password" placeholder="••••••••" required 
                        value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})}
                    />
                  </div>
                  <div className="input-group-v2">
                    <label>Department</label>
                    <select 
                        required
                        value={newTeacher.department} 
                        onChange={e => setNewTeacher({...newTeacher, department: e.target.value})}
                    >
                        <option value="">Select Branch</option>
                        {org?.branches?.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                  </div>
                  <div className="input-group-v2">
                    <label>Employee ID</label>
                    <input 
                        type="text" placeholder="EMP-XXXX" 
                        value={newTeacher.employeeId} onChange={e => setNewTeacher({...newTeacher, employeeId: e.target.value})}
                    />
                  </div>
               </div>
               
               <div className="modal-footer-btns">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary-submit">Register Teacher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;
