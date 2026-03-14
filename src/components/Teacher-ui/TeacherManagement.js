import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../config';
import Toast from '../Toast';
import useToast from '../useToast';
import PopupModal from '../PopupModal';
import { FaUserPlus, FaTrash, FaUserShield } from 'react-icons/fa';
import './TeacherManagement.css';

const TeacherManagement = () => {
  const { token } = useAuth();
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

  const fetchTeachers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/principal/teachers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setTeachers(data.teachers);
    } catch (err) {
      showToast("Failed to fetch teachers", "error");
    }
  };

  useEffect(() => {
    if (token) fetchTeachers();
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
        showToast("Teacher added successfully", "success");
        setShowAddModal(false);
        setNewTeacher({ name: '', email: '', password: '', department: '', employeeId: '' });
        fetchTeachers();
      } else {
        showToast(data.message, "error");
      }
    } catch (err) {
      showToast("Error adding teacher", "error");
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
      showToast("Error updating status", "error");
    }
  };

  return (
    <div className="teacher-mgmt-container">
      <Toast toasts={toasts} removeToast={removeToast} />
      
      <div className="mgmt-header">
        <h2>Teacher Management</h2>
        <button className="add-btn" onClick={() => setShowAddModal(true)}>
          <FaUserPlus /> Add Teacher
        </button>
      </div>

      <div className="teachers-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Employee ID</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.userId?._id}>
                <td>{t.userId?.name}</td>
                <td>{t.userId?.email}</td>
                <td>{t.department}</td>
                <td>{t.employeeId}</td>
                <td>
                  <span className={`status-badge ${t.userId?.status}`}>
                    {t.userId?.status}
                  </span>
                </td>
                <td>
                  <button 
                    className={`action-btn ${t.userId?.status === 'active' ? 'suspend' : 'activate'}`} 
                    title={t.userId?.status === 'active' ? "Suspend Account" : "Activate Account"}
                    onClick={() => handleToggleStatus(t.userId?._id)}
                  >
                    <FaUserShield /> 
                    {t.userId?.status === 'active' ? " Suspend" : " Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Teacher</h3>
            <form onSubmit={handleAddTeacher}>
              <input 
                type="text" placeholder="Full Name" required 
                value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})}
              />
              <input 
                type="email" placeholder="Email" required 
                value={newTeacher.email} onChange={e => setNewTeacher({...newTeacher, email: e.target.value})}
              />
              <input 
                type="password" placeholder="Temporary Password" required 
                value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})}
              />
              <input 
                type="text" placeholder="Department" 
                value={newTeacher.department} onChange={e => setNewTeacher({...newTeacher, department: e.target.value})}
              />
              <input 
                type="text" placeholder="Employee ID" 
                value={newTeacher.employeeId} onChange={e => setNewTeacher({...newTeacher, employeeId: e.target.value})}
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Add Teacher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;
