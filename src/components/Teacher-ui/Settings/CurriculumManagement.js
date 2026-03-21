import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../../context/AuthContext";
import { getOrgSettings, saveOrgSettings } from '../../../services/orgSettingsService';
import Toast from "../../Common/Toast";
import useToast from "../../Common/useToast";
import BackButton from "../../Common/BackButton";
import { 
    FaSave, FaShieldAlt, FaBook, FaLayerGroup, FaTrash, FaUndo, FaSpinner 
} from 'react-icons/fa';
import "./OrgSettings.css"; // Reusing styles

const CurriculumManagement = () => {
    const { refreshOrg } = useAuth();
    const navigate = useNavigate();
    const { token } = useAuth();
    const { toasts, showToast, removeToast } = useToast();
    
    const [settings, setSettings] = useState({
        branches: [],
        academicYears: [],
        semesters: [],
        subjects: [],
        // We keep the full object to use the same saveOrgSettings API easily
        organizationName: '',
        institutionType: '',
        address: '',
        logo: '',
        permissions: {}
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // UI Helpers
    const [branchInput, setBranchInput] = useState('');
    const [yearInput, setYearInput] = useState('');
    const [semInput, setSemInput] = useState('');
    const [newSubject, setNewSubject] = useState({ name: '', code: '', branch: '', semester: '' });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await getOrgSettings();
                const data = res.data.organization || res.data; // Handle both direct object and nested organization object
                setSettings({
                    ...data,
                    branches: data.branches || [],
                    academicYears: data.academicYears || [],
                    semesters: data.semesters || [],
                    subjects: data.subjects || []
                });
                setLoading(false);
            } catch (err) {
                showToast('Failed to load curriculum data', 'error');
                setLoading(false);
            }
        };
        if (token) fetchSettings();
    }, [token]);

    // Tag Input Logic
    const handleTagKeyDown = (e, field, inputValue, setInputValue) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            if (!settings[field].includes(inputValue.trim())) {
                setSettings(prev => ({ ...prev, [field]: [...prev[field], inputValue.trim()] }));
            }
            setInputValue('');
        }
    };

    const removeTag = (field, index) => {
        const valueToRemove = settings[field][index];
        setSettings(prev => ({ 
            ...prev, 
            [field]: prev[field].filter((_, i) => i !== index),
            subjects: (field === 'branches' || field === 'semesters') 
                ? prev.subjects.filter(s => s[field === 'branches' ? 'branch' : 'semester'] !== valueToRemove)
                : prev.subjects
        }));
    };

    // Subject Handlers
    const handleAddSubject = () => {
        const { name, code, branch, semester } = newSubject;
        if (!name.trim() || !code.trim() || !branch || !semester) {
            showToast('All subject fields are required', 'error');
            return;
        }
        setSettings(prev => ({ ...prev, subjects: [...prev.subjects, { ...newSubject, name: name.trim(), code: code.trim() }] }));
        setNewSubject({ name: '', code: '', branch: settings.branches[0] || '', semester: settings.semesters[0] || '' });
    };

    const removeSubject = (index) => {
        setSettings(prev => ({ ...prev, subjects: prev.subjects.filter((_, i) => i !== index) }));
    };

    // Hierarchy Computation
    const curriculumMap = useMemo(() => {
        const map = {};
        settings.branches.forEach(b => {
            map[b] = {};
            settings.semesters.forEach(s => {
                map[b][s] = [];
            });
        });
        settings.subjects.forEach(sub => {
            if (map[sub.branch] && map[sub.branch][sub.semester] !== undefined) {
                map[sub.branch][sub.semester].push(sub);
            }
        });
        return map;
    }, [settings.branches, settings.semesters, settings.subjects]);

    // Save Handler
    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            // Send only curriculum-related fields to maintain a minimal, safe payload
            const payload = {
                branches: settings.branches,
                academicYears: settings.academicYears,
                semesters: settings.semesters,
                subjects: settings.subjects
            };
            await saveOrgSettings(payload);
            await refreshOrg();
            showToast('Curriculum updated successfully!', 'success');
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
            const data = res.data.organization || res.data;
            setSettings({
                ...data,
                branches: data.branches || [],
                academicYears: data.academicYears || [],
                semesters: data.semesters || [],
                subjects: data.subjects || []
            });
            showToast('Changes discarded', 'info');
        } catch {
            showToast('Failed to reload', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loader-container">
                <FaSpinner className="spinner" />
                <p>Loading academic structure...</p>
            </div>
        );
    }

    return (
        <div className="org-settings-container">
            <Toast toasts={toasts} removeToast={removeToast} />
            <BackButton to="/TeacherHome" />
            
            <div className="settings-header">
                <h2>Curriculum Management</h2>
                <p>Configure departmental branches, semesters, and subjects</p>
            </div>
            
            <form onSubmit={handleSave} className="settings-form">
                <div className="settings-grid">
                    {/* SECTION 1: Academic Framework */}
                    <div className="form-section structure-section">
                        <h3><FaShieldAlt /> Academic Framework</h3>
                        <div className="structure-editor">
                            <div className="structure-group">
                                <label>Departmental Branches</label>
                                <div className="tag-input-v2">
                                    <input 
                                        type="text" value={branchInput}
                                        placeholder="Add Branch (e.g. CM) + Enter" 
                                        onChange={(e) => setBranchInput(e.target.value)}
                                        onKeyDown={(e) => handleTagKeyDown(e, 'branches', branchInput, setBranchInput)}
                                    />
                                    <div className="tag-cloud">
                                        {settings.branches.map((b, i) => (
                                            <span key={b} className="tag">
                                                {b} <button type="button" className="tag-del-btn" onClick={() => removeTag('branches', i)}>&times;</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="structure-group">
                                <label>Academic Years</label>
                                <div className="tag-input-v2">
                                    <input 
                                        type="text" value={yearInput}
                                        placeholder="Add Year (e.g. FY) + Enter" 
                                        onChange={(e) => setYearInput(e.target.value)}
                                        onKeyDown={(e) => handleTagKeyDown(e, 'academicYears', yearInput, setYearInput)}
                                    />
                                    <div className="tag-cloud">
                                        {settings.academicYears.map((y, i) => (
                                            <span key={y} className="tag">
                                                {y} <button type="button" className="tag-del-btn" onClick={() => removeTag('academicYears', i)}>&times;</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="structure-group">
                                <label>Semester Sequence</label>
                                <div className="tag-input-v2">
                                    <input 
                                        type="text" value={semInput}
                                        placeholder="Add Semester (e.g. 1) + Enter" 
                                        onChange={(e) => setSemInput(e.target.value)}
                                        onKeyDown={(e) => handleTagKeyDown(e, 'semesters', semInput, setSemInput)}
                                    />
                                    <div className="tag-cloud">
                                        {settings.semesters.map((s, i) => (
                                            <span key={s} className="tag">
                                                {s} <button type="button" className="tag-del-btn" onClick={() => removeTag('semesters', i)}>&times;</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Subjects & Curriculum */}
                    <div className="form-section subjects-section">
                        <h3><FaBook /> Institutional Subjects & Curriculum</h3>
                        <div className="subject-form-inline">
                            <input 
                                type="text" placeholder="Subject Name" 
                                value={newSubject.name}
                                onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                            />
                            <input 
                                type="text" placeholder="Code" 
                                value={newSubject.code}
                                onChange={e => setNewSubject({...newSubject, code: e.target.value})}
                            />
                            <select 
                                value={newSubject.branch}
                                onChange={e => setNewSubject({...newSubject, branch: e.target.value})}
                            >
                                <option value="">Branch</option>
                                {settings.branches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                            <select 
                                value={newSubject.semester}
                                onChange={e => setNewSubject({...newSubject, semester: e.target.value})}
                            >
                                <option value="">Sem</option>
                                {settings.semesters.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button type="button" className="add-sub-btn" onClick={handleAddSubject}>Add Subject</button>
                        </div>

                        <div className="subjects-list">
                            {settings.subjects.length > 0 ? (
                                <table className="mgmt-table">
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th>Code</th>
                                            <th>Branch</th>
                                            <th>Sem</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {settings.subjects.map((s, idx) => (
                                            <tr key={idx}>
                                                <td>{s.name}</td>
                                                <td><code>{s.code}</code></td>
                                                <td>{s.branch}</td>
                                                <td>{s.semester}</td>
                                                <td>
                                                    <button type="button" className="del-btn-mini" onClick={() => removeSubject(idx)}>
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="no-data-hint">No subjects defined. Add tags first.</p>
                            )}
                        </div>
                    </div>

                    {/* SECTION 3: Hierarchy Map */}
                    <div className="form-section hierarchy-section">
                        <h3><FaLayerGroup /> Curriculum Hierarchy Map</h3>
                        <div className="hierarchy-container">
                            {settings.branches.length > 0 ? (
                                settings.branches.map(branch => (
                                    <div key={branch} className="hierarchy-card branch-card">
                                        <div className="hierarchy-header branch-header">{branch}</div>
                                        <div className="hierarchy-body">
                                            {settings.semesters.map(sem => {
                                                const subjectsInSem = curriculumMap[branch]?.[sem] || [];
                                                return (
                                                    <div key={sem} className="sem-box">
                                                        <div className="sem-header">Semester {sem}</div>
                                                        <div className="subject-tags">
                                                            {subjectsInSem.map(sub => (
                                                                <span key={sub.code} className="sub-node">
                                                                    {sub.name} <code className="mini-code">{sub.code}</code>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            ) : <p className="no-data-hint">Define branches to view hierarchy.</p>}
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={saving}>
                        {saving ? <FaSpinner className="spinner" /> : <FaSave />} {saving ? 'Saving...' : 'Save Curriculum'}
                    </button>
                    <button type="button" className="discard-btn" onClick={handleDiscard} disabled={saving}>
                        <FaUndo /> Discard Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CurriculumManagement;
