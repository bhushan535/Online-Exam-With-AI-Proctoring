import React from "react";
import { 
    FaUsers, FaLink, FaCopy, FaPlusCircle, 
    FaEdit, FaTrash, FaLayerGroup 
} from "react-icons/fa";

const SoloClassView = ({
    cls,
    joinLink,
    sortedStudents,
    showToast,
    fastEnrollData,
    setFastEnrollData,
    handleFastEnroll,
    isAddingFast,
    editStudent,
    setDeleteModal
}) => {
    return (
        <div className="vc-premium-container solo-mode-view">
            {/* Left column: Streamlined Class Metadata */}
            <div className="vc-metadata-section glass-premium">
                <div className="vc-header-visual">
                    <div className="vc-brand-badge">Independent Teaching Space</div>
                    <h1>{cls.className}</h1>
                    <p className="vc-subtitle">{cls.branch}</p>
                </div>

                <div className="vc-info-grid simplified">
                    <div className="vc-info-item">
                        <label><FaLayerGroup /> Topic</label>
                        <span>{cls.branch}</span>
                    </div>
                    <div className="vc-info-item">
                        <label><FaUsers /> Capacity</label>
                        <span>{cls.maxStudents || 100}</span>
                    </div>
                </div>
            </div>

            {/* Right column: Quick Enrollment & Roster */}
            <div className="vc-roster-section glass-premium">
                <div className="vc-fast-enroll glass-inner animate-slide-up">
                    <h4><FaPlusCircle /> Quick Enroll</h4>
                    <form onSubmit={handleFastEnroll} className="fast-enroll-grid">
                        <input 
                            type="text" 
                            placeholder="Student ID" 
                            value={fastEnrollData.studentId}
                            onChange={(e) => setFastEnrollData({...fastEnrollData, studentId: e.target.value})}
                        />
                        <input 
                            type="text" 
                            placeholder="Full Name" 
                            value={fastEnrollData.name}
                            onChange={(e) => setFastEnrollData({...fastEnrollData, name: e.target.value})}
                        />
                        <input 
                            type="text" 
                            placeholder="Password" 
                            value={fastEnrollData.password}
                            onChange={(e) => setFastEnrollData({...fastEnrollData, password: e.target.value})}
                        />
                        <button type="submit" disabled={isAddingFast}>
                            {isAddingFast ? "..." : "Enroll"}
                        </button>
                    </form>
                </div>

                <div className="vc-roster-header">
                    <div>
                        <h3><FaUsers /> Students</h3>
                        <p>{sortedStudents.length} Students Total</p>
                    </div>
                </div>

                <div className="vc-table-container custom-scrollbar">
                    {sortedStudents.length === 0 ? (
                        <div className="vc-empty-roster">
                            <div className="empty-icon"><FaUsers /></div>
                            <p>Your class is empty.</p>
                            <span className="hint">Invite students with the link or add them manually above.</span>
                        </div>
                    ) : (
                        <table className="vc-roster-table solo-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Password</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedStudents.map((s) => (
                                    <tr key={s._id}>
                                        <td className="enroll-txt">{s.enrollment}</td>
                                        <td className="name-txt">{s.name}</td>
                                        <td className="pass-txt"><code>{s.password}</code></td>
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
        </div>
    );
};

export default SoloClassView;
