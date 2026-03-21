import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../../context/AuthContext";
import { getOrgSettings, saveOrgSettings } from '../../../services/orgSettingsService';
import Toast from "../../Common/Toast";
import useToast from "../../Common/useToast";
import BackButton from "../../Common/BackButton";
import { 
    FaSave, FaImage, FaShieldAlt, FaInfoCircle, 
    FaUndo, FaSpinner 
} from 'react-icons/fa';
import "./OrgSettings.css";

const OrgSettings = () => {
    const navigate = useNavigate();
    const { token, refreshOrg } = useAuth();
    const { toasts, showToast, removeToast } = useToast();
    
    const [settings, setSettings] = useState({
        principalName: '',
        organizationName: '',
        institutionType: 'School',
        address: '',
        logo: '',
        permissions: {
            allowTeacherStudentImport: false,
            principalApprovalLoop: false,
            internalExamSharing: false
        }
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logoPreview, setLogoPreview] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await getOrgSettings();
                const data = res.data;
                setSettings({
                    ...data,
                    permissions: data.permissions || {
                        allowTeacherStudentImport: false,
                        principalApprovalLoop: false,
                        internalExamSharing: false
                    }
                });
                setLogoPreview(data.logo || '');
                setLoading(false);
            } catch (err) {
                showToast('Failed to load settings', 'error');
                setLoading(false);
            }
        };
        if (token) fetchSettings();
    }, [token]);

    // Logo Handlers
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            showToast('Only JPG, PNG, WebP allowed', 'error');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            showToast('Logo must be under 2MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;
            setLogoPreview(base64String);
            setSettings(prev => ({ ...prev, logo: base64String }));
        };
        reader.readAsDataURL(file);
    };

    // Save Handler
    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!settings.organizationName?.trim() || settings.organizationName?.length < 2) {
            showToast('Organization name is required', 'error');
            return;
        }
        
        setSaving(true);
        try {
            // Send only fields managed by this component to avoid overwriting curriculum data
            const payload = {
                principalName: settings.principalName,
                organizationName: settings.organizationName,
                institutionType: settings.institutionType,
                address: settings.address,
                logo: settings.logo,
                permissions: settings.permissions
            };

            const res = await saveOrgSettings(payload);
            showToast('Profile updated successfully!', 'success');
            await refreshOrg(); // Refresh global header context
            setTimeout(() => navigate('/TeacherHome'), 1500);
        } catch (err) {
            showToast('Save failed. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = async () => {
        setLoading(true);
        try {
            const res = await getOrgSettings();
            const data = res.data;
            setSettings({
                ...data,
                permissions: data.permissions || {
                    allowTeacherStudentImport: false,
                    principalApprovalLoop: false,
                    internalExamSharing: false
                }
            });
            setLogoPreview(data.logo || '');
            showToast('Settings reloaded', 'info');
        } catch {
            showToast('Failed to reload', 'error');
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (key) => {
        setSettings(prev => ({
            ...prev,
            permissions: { ...prev?.permissions, [key]: !prev?.permissions?.[key] }
        }));
    };

    if (loading) {
        return (
            <div className="loader-container">
                <FaSpinner className="spinner" />
                <p>Loading institutional profile...</p>
            </div>
        );
    }

    return (
        <div className="org-settings-container">
            <Toast toasts={toasts} removeToast={removeToast} />
            <BackButton to="/TeacherHome" />
            
            <div className="settings-header">
                <h2>Organization Settings</h2>
                <p>Manage your institution's profile and functional configuration</p>
            </div>
            
            <form onSubmit={handleSave} className="settings-form">
                <div className="settings-grid">
                    {/* SECTION 1: Institutional Branding */}
                    <div className="form-section branding-section">
                        <h3><FaImage /> Institutional Branding</h3>
                        <div className="logo-upload-wrapper">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Org Logo" className="logo-preview" />
                            ) : (
                                <div className="logo-placeholder">No Logo</div>
                            )}
                            <div className="file-input-group">
                                <label htmlFor="logo-upload" className="custom-file-upload">
                                    Change institutional Logo
                                </label>
                                <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} />
                                <p className="file-hint">JPG, PNG, WebP (Max 2MB)</p>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Basic Information */}
                    <div className="form-section info-section">
                        <h3><FaInfoCircle /> Basic Information</h3>
                        <div className="input-group">
                            <label>Principal Name</label>
                            <input 
                                type="text" placeholder="e.g. Dr. John Carter" 
                                value={settings.principalName} 
                                onChange={e => setSettings({...settings, principalName: e.target.value})}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Organization Name</label>
                            <input 
                                type="text" placeholder="Full legal name" 
                                value={settings.organizationName} 
                                onChange={e => setSettings({...settings, organizationName: e.target.value})}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Institution Type</label>
                            <select value={settings.institutionType} onChange={e => setSettings({...settings, institutionType: e.target.value})}>
                                <option value="School">School</option>
                                <option value="College">College</option>
                                <option value="University">University</option>
                                <option value="Institute">Institute</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Official Address</label>
                            <textarea 
                                placeholder="Full address" 
                                value={settings.address} 
                                onChange={e => setSettings({...settings, address: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* SECTION 3: Permissions */}
                    <div className="form-section permissions-section">
                        <h3><FaShieldAlt /> Functional Permissions</h3>
                        <div className="checkbox-grid">
                            <label className="toggle-label">
                                <div className="toggle-text">
                                    <span>Allow Teacher Student Import</span>
                                    <p>Teachers can add/import students directly</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={settings?.permissions?.allowTeacherStudentImport || false} 
                                    onChange={() => togglePermission('allowTeacherStudentImport')}
                                />
                                <span className="slider"></span>
                            </label>
                            <label className="toggle-label">
                                <div className="toggle-text">
                                    <span>Principal Approval Loop</span>
                                    <p>Exams require your approval to publish</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={settings?.permissions?.principalApprovalLoop || false} 
                                    onChange={() => togglePermission('principalApprovalLoop')}
                                />
                                <span className="slider"></span>
                            </label>
                            <label className="toggle-label">
                                <div className="toggle-text">
                                    <span>Internal Exam Sharing</span>
                                    <p>Teachers can clone shared exams</p>
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={settings?.permissions?.internalExamSharing || false} 
                                    onChange={() => togglePermission('internalExamSharing')}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={saving}>
                        {saving ? <FaSpinner className="spinner" /> : <FaSave />} {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                    <button type="button" className="discard-btn" onClick={handleDiscard} disabled={saving}>
                        <FaUndo /> Discard Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OrgSettings;
