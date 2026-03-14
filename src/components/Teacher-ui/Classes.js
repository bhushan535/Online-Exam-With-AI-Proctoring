import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Toast      from "../Toast";
import useToast   from "../useToast";
import PopupModal from "../PopupModal";
import "./Classes.css";
import { BASE_URL } from '../../config';

function Classes() {
  const { user, token } = useAuth();
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const classesPerPage = 5;

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
    if (token) fetchClasses();
  }, [token]);

  const confirmDeleteClass = async (id) => {
    await fetch(`${BASE_URL}/class/${id}`, { 
      method: "DELETE",
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchClasses();
    showToast("Class deleted.", "info");
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
    <div className="classes-page">
      <Toast toasts={toasts} removeToast={removeToast} />
      <h2 className="classes-title">
        {user?.role === 'principal' ? 'Organization Classes' : 'My Classes'}
      </h2>

      <div className="filter-bar">
        <input type="text" placeholder="Search by class name" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={branch} onChange={(e) => setBranch(e.target.value)}>
          <option value="">All Branches</option>
          <option value="CM">CM</option>
          <option value="CE">CE</option>
          <option value="ME">ME</option>
          <option value="EE">EE</option>
          <option value="EJ">EJ</option>
        </select>
        <select value={semester} onChange={(e) => setSemester(e.target.value)}>
          <option value="">All Semesters</option>
          <option value="1st Sem">1st Sem</option>
          <option value="2nd Sem">2nd Sem</option>
          <option value="4th Sem">4th Sem</option>
          <option value="6th Sem">6th Sem</option>
        </select>
      </div>

      {currentClasses.length === 0 ? (
        <p>No classes found</p>
      ) : (
        <div className="classes-grid">
          {currentClasses.map((cls) => (
            <div className="class-card" key={cls._id}>
              <h3>{cls.className}</h3>
              <p><b>Branch:</b> {cls.branch}</p>
              <p><b>Year:</b> {cls.year}</p>
              <p><b>Semester:</b> {cls.semester}</p>

              <div className="class-actions">
                <button className="view-btn" onClick={() => navigate(`/class/${cls._id}`)}>View</button>
                <button className="edit-btn" onClick={() => navigate(`/edit-class/${cls._id}`)}>Edit</button>
                <button className="delete-btn" onClick={() => setDeleteModal({ open: true, targetId: cls._id })}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} className={currentPage === i + 1 ? "active" : ""} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
          ))}
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
        </div>
      )}

      <PopupModal
        isOpen={deleteModal.open}
        type="error"
        title="Delete Class?"
        message="Are you sure you want to delete this class? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmColor="#dc2626"
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
