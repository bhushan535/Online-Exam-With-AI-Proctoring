import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash, FaBell, FaInfoCircle, FaExclamationTriangle, FaClock, FaBullhorn, FaUsers, FaCheckCircle, FaTimes, FaCalendarAlt, FaUserGraduate } from 'react-icons/fa';
import BackButton from "../../Common/BackButton";
import "./NoticeManagement.css";

const NoticeManagement = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetRoles: ['teacher', 'student'],
    priority: 'medium',
    expiresAt: ''
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await axios.get('/api/notices', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setNotices(res.data.notices);
      setLoading(false);
    } catch (err) {
      setError('Failed to sync with announcement server');
      setLoading(false);
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/notices', formData, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setShowAddForm(false);
      setFormData({
        title: '',
        content: '',
        targetRoles: ['teacher', 'student'],
        priority: 'medium',
        expiresAt: ''
      });
      fetchNotices();
    } catch (err) {
      setError(err.response?.data?.message || 'Authorization failed for this broadcast');
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm('Delete this broadcast permanently?')) return;
    try {
      await axios.delete(`/api/notices/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchNotices();
    } catch (err) {
      setError('Internal deletion error');
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <FaExclamationTriangle className="p-icon urgent" />;
      case 'high': return <FaBell className="p-icon high" />;
      case 'medium': return <FaInfoCircle className="p-icon medium" />;
      default: return <FaCheckCircle className="p-icon low" />;
    }
  };

  if (loading) return (
    <div className="nm-loading">
        <div className="nm-spinner"></div>
        <p>Accessing bulletin archives...</p>
    </div>
  );

  return (
    <div className="notice-management-container">
      <BackButton to="/TeacherHome" />
      
      <div className="nm-header">
        <div className="nm-header-left">
          <h2><FaBullhorn /> Institutional Bulletins</h2>
          <p>Deploy real-time announcements to the entire academic community.</p>
        </div>
        <button className={showAddForm ? "cancel-broadcast-btn" : "add-broadcast-btn"} onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? <><FaTimes /> Close Console</> : <><FaPlus /> Create Broadcast</>}
        </button>
      </div>

      {error && (
        <div className="nm-alert-banner">
            <FaExclamationTriangle />
            <span>{error}</span>
            <button onClick={() => setError('')}>&times;</button>
        </div>
      )}

      {showAddForm && (
        <div className="broadcast-console-card animate-pop-in">
          <div className="console-header">
            <h3>New Broadcast Transmission</h3>
            <p>Configure visibility and priority for this notice.</p>
          </div>
          <form onSubmit={handleCreateNotice}>
            <div className="form-grid-v2">
                <div className="form-group-v2 full-width">
                <label>Bulletin Title</label>
                <input 
                    type="text" 
                    placeholder="Enter a descriptive headline..."
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                />
                </div>
                <div className="form-group-v2 full-width">
                <label>Content Description</label>
                <textarea 
                    placeholder="Provide full details of the announcement..."
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    required
                />
                </div>
                <div className="form-group-v2">
                    <label>Priority Level</label>
                    <div className="select-pill-wrapper">
                        {['low', 'medium', 'high', 'urgent'].map(p => (
                            <button 
                                key={p} 
                                type="button" 
                                className={`priority-pill ${p} ${formData.priority === p ? 'active' : ''}`}
                                onClick={() => setFormData({...formData, priority: p})}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="form-group-v2">
                <label>Auto-Archive Date</label>
                <div className="input-with-icon">
                    <FaCalendarAlt />
                    <input 
                        type="date" 
                        value={formData.expiresAt}
                        onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                    />
                </div>
                </div>
                <div className="form-group-v2 full-width">
                <label>Target Audience Permissions</label>
                <div className="permission-belt">
                    <label className={`perm-chip ${formData.targetRoles.includes('teacher') ? 'active' : ''}`}>
                    <input 
                        type="checkbox" 
                        checked={formData.targetRoles.includes('teacher')}
                        onChange={(e) => {
                        const roles = e.target.checked 
                            ? [...formData.targetRoles, 'teacher']
                            : formData.targetRoles.filter(r => r !== 'teacher');
                        setFormData({...formData, targetRoles: roles});
                        }}
                    /> <FaUsers /> Faculty Members
                    </label>
                    <label className={`perm-chip ${formData.targetRoles.includes('student') ? 'active' : ''}`}>
                    <input 
                        type="checkbox" 
                        checked={formData.targetRoles.includes('student')}
                        onChange={(e) => {
                        const roles = e.target.checked 
                            ? [...formData.targetRoles, 'student']
                            : formData.targetRoles.filter(r => r !== 'student');
                        setFormData({...formData, targetRoles: roles});
                        }}
                    /> <FaUserGraduate /> Students
                    </label>
                </div>
                </div>
            </div>
            <button type="submit" className="nm-publish-btn">Deploy Broadcast</button>
          </form>
        </div>
      )}

      <div className="bulletins-grid">
        {notices.length === 0 ? (
          <div className="nm-empty-state">
            <FaBell />
            <p>No active broadcasts in the institutional pipeline.</p>
          </div>
        ) : (
          notices.map((notice) => (
            <div key={notice._id} className={`bulletin-card p-${notice.priority}`}>
              <div className="bulletin-header">
                <div className="bulletin-meta-top">
                  {getPriorityIcon(notice.priority)}
                  <span className="bulletin-timestamp"><FaClock /> {new Date(notice.createdAt).toLocaleDateString()}</span>
                </div>
                <button className="nm-delete-card-btn" onClick={() => handleDeleteNotice(notice._id)}>
                  <FaTrash />
                </button>
              </div>
              <div className="bulletin-body">
                <h3>{notice.title}</h3>
                <p>{notice.content}</p>
              </div>
              <div className="bulletin-footer">
                <div className="audience-indicator">
                    <FaUsers /> {notice.targetRoles.join(', ')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NoticeManagement;
