import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash, FaBell, FaInfoCircle, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import './NoticeManagement.css';

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
      const res = await axios.get('/api/notices');
      setNotices(res.data.notices);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch notices');
      setLoading(false);
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/notices', formData);
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
      setError(err.response?.data?.message || 'Failed to create notice');
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await axios.delete(`/api/notices/${id}`);
      fetchNotices();
    } catch (err) {
      setError('Failed to delete notice');
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <FaExclamationTriangle className="p-urgent" />;
      case 'high': return <FaBell className="p-high" />;
      case 'medium': return <FaInfoCircle className="p-medium" />;
      default: return <FaInfoCircle className="p-low" />;
    }
  };

  if (loading) return <div className="notice-loading">Loading notices...</div>;

  return (
    <div className="notice-management-container">
      <div className="nm-header">
        <div className="nm-header-left">
          <h1>Institutional Announcements</h1>
          <p>Broadcast updates to teachers and students system-wide.</p>
        </div>
        <button className="add-notice-btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : <><FaPlus /> New Notice</>}
        </button>
      </div>

      {error && <div className="nm-error-banner">{error}</div>}

      {showAddForm && (
        <div className="notice-form-card animate-slide-down">
          <h3>Create New Announcement</h3>
          <form onSubmit={handleCreateNotice}>
            <div className="form-group">
              <label>Notice Title</label>
              <input 
                type="text" 
                placeholder="e.g., Annual Sports Day Guidelines"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Content</label>
              <textarea 
                placeholder="Write your announcement here..."
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Priority</label>
                <select 
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="form-group">
                <label>Expires On (Optional)</label>
                <input 
                  type="date" 
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Target Audience</label>
              <div className="checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={formData.targetRoles.includes('teacher')}
                    onChange={(e) => {
                      const roles = e.target.checked 
                        ? [...formData.targetRoles, 'teacher']
                        : formData.targetRoles.filter(r => r !== 'teacher');
                      setFormData({...formData, targetRoles: roles});
                    }}
                  /> Teachers
                </label>
                <label>
                  <input 
                    type="checkbox" 
                    checked={formData.targetRoles.includes('student')}
                    onChange={(e) => {
                      const roles = e.target.checked 
                        ? [...formData.targetRoles, 'student']
                        : formData.targetRoles.filter(r => r !== 'student');
                      setFormData({...formData, targetRoles: roles});
                    }}
                  /> Students
                </label>
              </div>
            </div>
            <button type="submit" className="submit-notice-btn">Post Announcement</button>
          </form>
        </div>
      )}

      <div className="notices-list">
        {notices.length === 0 ? (
          <div className="empty-notices">
            <FaBell className="empty-icon" />
            <p>No active announcements found.</p>
          </div>
        ) : (
          notices.map((notice) => (
            <div key={notice._id} className={`notice-card priority-${notice.priority}`}>
              <div className="notice-card-header">
                <div className="n-title-wrap">
                  {getPriorityIcon(notice.priority)}
                  <h3>{notice.title}</h3>
                </div>
                <button className="delete-n-btn" onClick={() => handleDeleteNotice(notice._id)}>
                  <FaTrash />
                </button>
              </div>
              <div className="notice-card-body">
                <p>{notice.content}</p>
              </div>
              <div className="notice-card-footer">
                <span className="n-audience">
                  Target: {notice.targetRoles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}
                </span>
                <span className="n-date">
                  <FaClock /> {new Date(notice.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NoticeManagement;
