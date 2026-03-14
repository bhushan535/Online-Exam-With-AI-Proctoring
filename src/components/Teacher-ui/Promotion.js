import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../config';
import Toast from '../Toast';
import useToast from '../useToast';
import { FaUserGraduate, FaArrowRight } from 'react-icons/fa';
import './Promotion.css';

const Promotion = () => {
    const { token } = useAuth();
    const { toasts, showToast, removeToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        branch: '',
        currentSemester: '',
        newSemester: '',
        currentYear: '',
        newYear: ''
    });

    const handlePromote = async (e) => {
        e.preventDefault();
        if (!window.confirm("Are you sure you want to promote these students? This will archive their current semester data.")) return;

        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/principal/promote-students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                showToast(data.message, "success");
            } else {
                showToast(data.message, "error");
            }
        } catch (err) {
            showToast("Promotion failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="promotion-container">
            <Toast toasts={toasts} removeToast={removeToast} />
            <div className="promotion-header">
                <h2><FaUserGraduate /> Bulk Student Promotion</h2>
                <p>Move students to the next semester and archive current records.</p>
            </div>

            <form onSubmit={handlePromote} className="promotion-form">
                <div className="promotion-grid">
                    <div className="promo-section">
                        <h3>Current Status</h3>
                        <label>Department / Branch</label>
                        <select required value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})}>
                            <option value="">Select Branch</option>
                            <option value="CM">Computer Engineering</option>
                            <option value="IT">Information Technology</option>
                            <option value="CE">Civil Engineering</option>
                            <option value="ME">Mechanical Engineering</option>
                            <option value="EE">Electrical Engineering</option>
                            <option value="COMP">Computer Technology</option>
                        </select>
                        
                        <label>Semester</label>
                        <input 
                            type="text" placeholder="e.g. 5th Sem" required
                            value={formData.currentSemester} onChange={e => setFormData({...formData, currentSemester: e.target.value})}
                        />
                        
                        <label>Academic Year</label>
                        <input 
                            type="text" placeholder="e.g. 2023-24" 
                            value={formData.currentYear} onChange={e => setFormData({...formData, currentYear: e.target.value})}
                        />
                    </div>

                    <div className="promo-arrow">
                        <FaArrowRight />
                    </div>

                    <div className="promo-section">
                        <h3>New Status</h3>
                        <label>Target Semester</label>
                        <input 
                            type="text" placeholder="e.g. 6th Sem" required
                            value={formData.newSemester} onChange={e => setFormData({...formData, newSemester: e.target.value})}
                        />
                        <label>New Academic Year (Optional)</label>
                        <input 
                            type="text" placeholder="e.g. 2024-25" 
                            value={formData.newYear} onChange={e => setFormData({...formData, newYear: e.target.value})}
                        />
                    </div>
                </div>

                <button type="submit" className="promote-btn" disabled={loading}>
                    {loading ? "Processing..." : "Promote Students"}
                </button>
            </form>
        </div>
    );
};

export default Promotion;
