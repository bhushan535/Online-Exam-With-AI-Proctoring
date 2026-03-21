import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import Toast from "../../Common/Toast";
import useToast from "../../Common/useToast";
import PopupModal from "../../Common/PopupModal";
import BackButton from "../../Common/BackButton";
import { FaSearch, FaFilter, FaEye, FaEdit, FaTrash, FaPlus, FaChalkboardTeacher, FaCopy } from "react-icons/fa";
import "./Classes.css";
import { BASE_URL } from '../../../config';

function Classes() {
  const { user, token, teacherProfile, org, refreshOrg } = useAuth();
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const classesPerPage = 6;

  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();
  const [deleteModal, setDeleteModal] = useState({ open: false, targetId: null });

  const fetchClasses = async () => {
    try {
      const res = await fetch(`${BASE_URL}/classes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setClasses(data);
      } else {
        setClasses([]);
      }
    } catch (err) {
      console.error("Fetch classes error:", err);
      setClasses([]);
    }
  };

  useEffect(() => {
    if (token) {
      fetchClasses();
      refreshOrg();
    }
  }, [token]);

  const confirmDeleteClass = async (id) => {
    await fetch(`${BASE_URL}/class/${id}`, {
      method: "DELETE",
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchClasses();
    showToast("Class deleted successfully", "info");
  };

  const handleClone = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/class/${id}/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast("Class structure cloned!", "success");
        fetchClasses();
      } else {
        showToast(data.message || "Cloning failed", "error");
      }
    } catch (err) {
      showToast("Clone error", "error");
    }
  };

  /* 🔍 FILTER LOGIC */
  const filteredClasses = classes.filter((cls) => {
    return (
      cls.className.toLowerCase().includes(search.toLowerCase()) &&
      (branch === "" || cls.branch === branch) &&
      (semester === "" || cls.semester === semester)
    );
  });

  /* 🔢 PAGINATION LOGIC */
  const indexOfLast = currentPage * classesPerPage;
  const indexOfFirst = indexOfLast - classesPerPage;
  const currentClasses = filteredClasses.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredClasses.length / classesPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, branch, semester]);

  return (
    <div className="classes-container">
      <Toast toasts={toasts} removeToast={removeToast} />
      <BackButton to="/TeacherHome" />

      <div className="page-header">
        <div className="header-text">
          <h2><FaChalkboardTeacher /> {user?.role === 'principal' ? 'Organization Classes' : 'My Academic Classes'}</h2>
          <p>Management portal for institutional class structures and List</p>
        </div>
        {user?.role === 'teacher' && (
          <button className="create-class-header-btn" onClick={() => navigate("/CreateClass")}>
            <FaPlus /> Create New Class
          </button>
        )}
      </div>

      <div className="filter-section">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          <div className="select-wrapper">
            <FaFilter className="filter-icon" />
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value=""> All Branches</option>
              {org?.branches?.map((b) => (<option key={b} value={b}>{b}</option>))}
            </select>
          </div>
          <div className="select-wrapper">
            <select value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="">All Semesters</option>
              {org?.semesters?.map((sem) => (<option key={sem} value={sem}>{sem}</option>))}
            </select>
          </div>
        </div>
      </div>

      {currentClasses.length === 0 ? (
        <div className="empty-state">
          <p>No classes match your current filters</p>
        </div>
      ) : (
        <div className="classes-grid">
          {currentClasses.map((cls) => (
            <div className="class-card-modern" key={cls._id}>
              <div className="card-badge">{cls.branch}</div>
              <h3>{cls.className}</h3>
              <div className="card-details">
                <p><span>Semester:</span> {cls.semester}</p>
              </div>

              <div className="card-actions-modern">
                <button className="action-btn view" title="View Details" onClick={() => navigate(`/class/${cls._id}`)}>
                  <FaEye /> View
                </button>
                <button className="action-btn edit" title="Edit Class" onClick={() => navigate(`/edit-class/${cls._id}`)}>
                  <FaEdit /> Edit
                </button>

                {user?.role === 'teacher' && user?.mode === 'organization' && (
                  <button
                    className={`action-btn clone ${teacherProfile?.department !== cls.branch ? 'locked' : ''}`}
                    title={teacherProfile?.department !== cls.branch ? "Cannnot clone other branch class" : "Clone Class Structure"}
                    onClick={() => teacherProfile?.department === cls.branch && handleClone(cls._id)}
                    disabled={teacherProfile?.department !== cls.branch}
                  >
                    <FaCopy /> {teacherProfile?.department !== cls.branch ? 'Restricted' : 'Clone'}
                  </button>
                )}

                <button className="action-btn delete" title="Remove" onClick={() => setDeleteModal({ open: true, targetId: cls._id })}>
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination-modern">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
          <div className="page-numbers">
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} className={currentPage === i + 1 ? "active" : ""} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
            ))}
          </div>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
        </div>
      )}

      <PopupModal
        isOpen={deleteModal.open}
        type="error"
        title="Permanently Delete Class?"
        message="This will remove the class and all associated student links. This action cannot be reversed."
        confirmText="Confirm Deletion"
        cancelText="Keep Class"
        onConfirm={async () => {
          await confirmDeleteClass(deleteModal.targetId);
          setDeleteModal({ open: false, targetId: null });
        }}
        onCancel={() => setDeleteModal({ open: false, targetId: null })}
      />
    </div>
  );
}

export default Classes;
