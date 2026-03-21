import React, { useState, useEffect } from 'react';
import { useAuth } from "../../../context/AuthContext";
import { BASE_URL } from '../../../config';
import Toast from "../../Common/Toast";
import useToast from "../../Common/useToast";
import { FaUserGraduate, FaArrowRight, FaLevelUpAlt, FaShieldAlt, FaHistory, FaCheckDouble } from 'react-icons/fa';
import BackButton from "../../Common/BackButton";
import "./Promotion.css";

const Promotion = () => {
    const { token } = useAuth();
    const { toasts, showToast, removeToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [org, setOrg] = useState(null);
    const [formData, setFormData] = useState({
        branch: '',
        currentSemester: '',
        newSemester: '',
        currentYear: '',
        newYear: ''
    });

    useEffect(() => {
        if (token) {
            fetch(`${BASE_URL}/principal/organization`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) setOrg(data.organization);
            });
        }
    }, [token]);

    const handlePromote = async (e) => {
        e.preventDefault();
        if (!window.confirm("Confirm mass student migration? This action will archive current semester records and cannot be easily undone.")) return;

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
                showToast(data.message || "Migration successful", "success");
            } else {
                showToast(data.message || "Migration protocol failed", "error");
            }
        } catch (err) {
            showToast("System connectivity error during migration", "error");
        } finally {
            setLoading(false);
        }
    };

    const branches = org?.branches || [];
    const semesters = org?.semesters || [];
    const years = org?.academicYears || [];

    return (
        <div className="promotion-container">
            <BackButton to="/TeacherHome" />
            <Toast toasts={toasts} removeToast={removeToast} />
            
            <header className="promotion-header">
                <div className="promo-badge"><FaLevelUpAlt /> Academic Lifecycle Management</div>
                <h1>Bulk Student Migration</h1>
                <p>Advance student cohorts to the next semester and initialize new academic records.</p>
            </header>

            <div className="promo-warning-banner">
                <FaShieldAlt />
                <p><strong>Safety Protocol:</strong> Ensure all final grades for the current semester are published before proceeding with migration.</p>
            </div>

            <form onSubmit={handlePromote} className="promotion-form-v2">
                <div className="migration-flow-grid">
                    <div className="migration-card source">
                        <div className="m-card-header">
                            <FaHistory />
                            <h3>Origin Cohort</h3>
                        </div>
                        <div className="m-card-body">
                            <div className="promo-input-group">
                                <label>Department / Faculty</label>
                                <select required value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})}>
                                    <option value="">Select Branch</option>
                                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            
                            <div className="promo-input-group">
                                <label>Current Semester</label>
                                <select required value={formData.currentSemester} onChange={e => setFormData({...formData, currentSemester: e.target.value})}>
                                    <option value="">Select Semester</option>
                                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            
                            <div className="promo-input-group">
                                <label>Academic Year</label>
                                <select required value={formData.currentYear} onChange={e => setFormData({...formData, currentYear: e.target.value})}>
                                    <option value="">Select Year</option>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="migration-connector">
                        <div className="conn-line"></div>
                        <div className="conn-icon"><FaArrowRight /></div>
                        <div className="conn-line"></div>
                    </div>

                    <div className="migration-card destination">
                        <div className="m-card-header">
                            <FaCheckDouble />
                            <h3>Target Cohort</h3>
                        </div>
                        <div className="m-card-body">
                            <div className="promo-input-group">
                                <label>Target Semester</label>
                                <select required value={formData.newSemester} onChange={e => setFormData({...formData, newSemester: e.target.value})}>
                                    <option value="">Select Next Semester</option>
                                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            
                            <div className="promo-input-group">
                                <label>Next Academic Year</label>
                                <select required value={formData.newYear} onChange={e => setFormData({...formData, newYear: e.target.value})}>
                                    <option value="">Select Next Year</option>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="m-info-footer">
                                <p>Archive data will be generated automatically for the origin cohort.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="promo-actions">
                    <button type="submit" className="migrate-btn" disabled={loading}>
                        {loading ? (
                            <><span className="spinner-btn"></span> Processing Migration...</>
                        ) : (
                            <><FaLevelUpAlt /> Execute Student Migration</>
                        )}
                    </button>
                    <p className="promo-disclaimer">By clicking, you acknowledge that this action will modify student records institutional-wide.</p>
                </div>
            </form>
        </div>
    );
};

export default Promotion;
