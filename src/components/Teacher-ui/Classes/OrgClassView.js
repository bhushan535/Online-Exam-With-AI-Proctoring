import React from "react";
import {
    FaSchool, FaUsers, FaArrowLeft, FaLink, FaCopy,
    FaFileExport, FaFileAlt, FaFileUpload, FaEdit, FaTrash,
    FaSearch, FaCheckSquare, FaSquare, FaGraduationCap, FaLayerGroup
} from "react-icons/fa";

const OrgClassView = ({
    cls,
    joinLink,
    sortedStudents,
    showToast,
    exportStudents,
    downloadTemplate,
    handleImport,
    setShowOrgAddModal,
    showOrgAddModal,
    orgSearchQuery,
    setOrgSearchQuery,
    orgStudents,
    selectedEnrollments,
    toggleStudentSelection,
    handleAddOrgStudents,
    isSearching,
    editStudent,
    setDeleteModal
}) => {
    return (
        <div className="vc-premium-container org-mode-view">
            {/* Left column: Class Metadata */}
            <div className="vc-metadata-section glass-premium">
                <div className="vc-header-visual">
                    <div className="vc-brand-badge">Class Profile</div>
                    <h1>{cls.className}</h1>
                    <p className="vc-subtitle">Active Academic Classes</p>
                </div>

                <div className="vc-info-grid">
                    <div className="vc-info-item">
                        <label><FaLayerGroup /> Branch</label>
                        <span>{cls.branch}</span>
                    </div>
                    <div className="vc-info-item">
                        <label><FaGraduationCap /> Semester</label>
                        <span>{cls.semester}</span>
                    </div>
                </div>

                <div className="vc-link-card">
                    <div className="link-header">
                        <FaLink /> <span>Student Join Link</span>
                    </div>
                    <div className="link-input-group">
                        <input value={joinLink} readOnly />
                        <button onClick={() => {
                            navigator.clipboard.writeText(joinLink);
                            showToast("Link copied!", "success");
                        }}><FaCopy /></button>
                    </div>
                </div>

                <div className="vc-actions-panel">
                    <button className="vc-panel-btn org" onClick={() => setShowOrgAddModal(true)}>
                        <FaSchool /> Add From Institution
                    </button>
                    <div className="vc-action-row-split">
                        <button className="vc-panel-btn export" onClick={exportStudents}>
                            <FaFileExport /> Export
                        </button>
                        <button className="vc-panel-btn template" onClick={downloadTemplate}>
                            <FaFileAlt /> Template
                        </button>
                    </div>
                    <label className="vc-panel-btn import">
                        <FaFileUpload /> Import Students
                        <input type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleImport} />
                    </label>
                </div>
            </div>

            {/* Right column: Students Table */}
            <div className="vc-roster-section glass-premium">
                <div className="vc-roster-header">
                    <div>
                        <h3><FaUsers /> Student List</h3>
                        <p>{sortedStudents.length} Students Total</p>
                    </div>
                </div>

                <div className="vc-table-container custom-scrollbar">
                    {sortedStudents.length === 0 ? (
                        <div className="vc-empty-roster">
                            <div className="empty-icon"><FaUsers /></div>
                            <p>No students enrolled yet.</p>
                            <span className="hint">Share the join link or import students to get started.</span>
                        </div>
                    ) : (
                        <table className="vc-roster-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '60px' }}>Roll</th>
                                    <th>Enrollment</th>
                                    <th>Name</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedStudents.map((s) => (
                                    <tr key={s._id}>
                                        <td><span className="roll-pill">{s.rollNo}</span></td>
                                        <td className="enroll-txt">{s.enrollment}</td>
                                        <td className="name-txt">{s.name}</td>
                                        <td className="action-td">
                                            <button className="mini-action-btn edit" onClick={() => editStudent(s)}><FaEdit /></button>
                                            <button className="mini-action-btn delete" onClick={() => setDeleteModal({ open: true, targetId: s.enrollment })}><FaTrash /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add From Organization Modal */}
            {showOrgAddModal && (
                <div className="vc-modal-overlay animate-fade-in">
                    <div className="vc-modal-content glass-premium">
                        <div className="modal-header">
                            <h3><FaSchool /> Institutional Pool</h3>
                            <p>Select students to synchronize with this class</p>
                        </div>

                        <div className="vc-modal-search">
                            <FaSearch />
                            <input
                                type="text"
                                placeholder="Search name or enrollment..."
                                value={orgSearchQuery}
                                onChange={(e) => setOrgSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="vc-modal-list custom-scrollbar">
                            {isSearching ? (
                                <div className="vc-loading-state">Synchronizing pool...</div>
                            ) : orgStudents.length === 0 ? (
                                <div className="vc-empty-state">No eligible students found in the pool.</div>
                            ) : (
                                orgStudents.map(student => (
                                    <div
                                        key={student.enrollmentNo}
                                        className={`vc-student-item ${selectedEnrollments.includes(student.enrollmentNo) ? 'selected' : ''}`}
                                        onClick={() => toggleStudentSelection(student.enrollmentNo)}
                                    >
                                        <div className="vc-check-box">
                                            {selectedEnrollments.includes(student.enrollmentNo) ? <FaCheckSquare /> : <FaSquare />}
                                        </div>
                                        <div className="vc-student-info">
                                            <span className="name">{student.userId?.name}</span>
                                            <span className="sub">{student.enrollmentNo} • {student.branch}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="vc-modal-footer">
                            <span className="vc-selected-tag">{selectedEnrollments.length} Selected</span>
                            <div className="vc-modal-btns">
                                <button className="vc-btn-ghost" onClick={() => setShowOrgAddModal(false)}>Cancel</button>
                                <button
                                    className="vc-btn-primary"
                                    disabled={selectedEnrollments.length === 0}
                                    onClick={handleAddOrgStudents}
                                >
                                    Sync to Class
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrgClassView;
