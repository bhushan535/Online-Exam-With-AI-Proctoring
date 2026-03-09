import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Classes.css";

function Classes() {
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");

  // 🔥 PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const classesPerPage = 5;

  const navigate = useNavigate();

  const fetchClasses = async () => {
    const res = await fetch("http://localhost:5000/api/classes");
    const data = await res.json();
    setClasses(data);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // ❌ DELETE CLASS
  const deleteClass = async (id) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this class?"
    );
    if (!confirm) return;

    await fetch(`http://localhost:5000/api/class/${id}`, {
      method: "DELETE",
    });

    fetchClasses();
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
  const currentClasses = filteredClasses.slice(
    indexOfFirst,
    indexOfLast
  );

  const totalPages = Math.ceil(
    filteredClasses.length / classesPerPage
  );

  // reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, branch, semester]);

  return (
    <div className="classes-page">
      <h2 className="classes-title">All Classes</h2>

      {/* 🔍 SEARCH & FILTER BAR */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by class name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={branch} onChange={(e) => setBranch(e.target.value)}>
          <option value="">All Branches</option>
          <option value="CM">CM</option>
          <option value="CE">CE</option>
          <option value="ME">ME</option>
          <option value="EE">EE</option>
          <option value="EJ">EJ</option>
        </select>

        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        >
          <option value="">All Semesters</option>
          <option value="1st Sem">1st Sem</option>
          <option value="2nd Sem">2nd Sem</option>
          <option value="4th Sem">4th Sem</option>
          <option value="6th Sem">6th Sem</option>
        </select>
      </div>

      {/* 🔳 CLASS GRID */}
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
                <button
                  className="view-btn"
                  onClick={() => navigate(`/class/${cls._id}`)}
                >
                  View
                </button>

                <button
                  className="edit-btn"
                  onClick={() => navigate(`/edit-class/${cls._id}`)}
                >
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={() => deleteClass(cls._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🔢 PAGINATION UI */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={currentPage === i + 1 ? "active" : ""}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Classes;
