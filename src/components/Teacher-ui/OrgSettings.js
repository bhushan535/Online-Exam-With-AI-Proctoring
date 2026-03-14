import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../config';
import Toast from '../Toast';
import useToast from '../useToast';
import './OrgSettings.css';

const OrgSettings = () => {
    const { token } = useAuth();
    const { toasts, showToast, removeToast } = useToast();
    const [org, setOrg] = useState({
        name: '',
        type: '',
        address: '',
        logo: '',
        settings: {
            allowTeacherStudentAdd: true,
            requirePrincipalApproval: false,
            examSharingEnabled: true
        }
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

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setOrg({ ...org, logo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${BASE_URL}/principal/organization`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(org)
            });
            const data = await res.json();
            if (data.success) {
                showToast("Organization updated", "success");
            }
        } catch (err) {
            showToast("Update failed", "error");
        }
    };

    return (
        <div className="org-settings-container">
            <Toast toasts={toasts} removeToast={removeToast} />
            <h2>Organization Settings</h2>
            
            <form onSubmit={handleUpdate} className="settings-form">
                <div className="form-section branding-section">
                    <h3>Institutional Branding</h3>
                    <div className="logo-upload-wrapper">
                        {org.logo ? (
                            <img src={org.logo} alt="Org Logo" className="logo-preview" />
                        ) : (
                            <div className="logo-placeholder">No Logo</div>
                        )}
                        <div className="file-input-group">
                            <label htmlFor="logo-upload" className="custom-file-upload">
                                Change Logo
                            </label>
                            <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} />
                            <p className="file-hint">Recommended: Square format, max 2MB</p>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Basic Information</h3>
                    <input 
                        type="text" placeholder="Organization Name" 
                        value={org.name} onChange={e => setOrg({...org, name: e.target.value})}
                    />
                    <select value={org.type} onChange={e => setOrg({...org, type: e.target.value})}>
                        <option value="school">School</option>
                        <option value="college">College</option>
                        <option value="university">University</option>
                        <option value="coaching">Coaching</option>
                    </select>
                    <textarea 
                        placeholder="Address" 
                        value={org.address} onChange={e => setOrg({...org, address: e.target.value})}
                    />
                </div>

                <div className="form-section">
                    <h3>Permissions</h3>
                    <div className="checkbox-group">
                        <label>
                            <input 
                                type="checkbox" 
                                checked={org.settings?.allowTeacherStudentAdd} 
                                onChange={e => setOrg({...org, settings: {...org.settings, allowTeacherStudentAdd: e.target.checked}})}
                            />
                            Allow Teachers to add Students
                        </label>
                        <label>
                            <input 
                                type="checkbox" 
                                checked={org.settings?.requirePrincipalApproval} 
                                onChange={e => setOrg({...org, settings: {...org.settings, requirePrincipalApproval: e.target.checked}})}
                            />
                            Require Principal approval for Exams
                        </label>
                        <label>
                            <input 
                                type="checkbox" 
                                checked={org.settings?.examSharingEnabled} 
                                onChange={e => setOrg({...org, settings: {...org.settings, examSharingEnabled: e.target.checked}})}
                            />
                            Enable Exam Sharing within Organization
                        </label>
                    </div>
                </div>

                <button type="submit" className="save-btn">Save Changes</button>
            </form>
        </div>
    );
};

export default OrgSettings;
