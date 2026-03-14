import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../config';
import Toast from '../Toast';
import useToast from '../useToast';
import { FaSearch, FaUserGraduate, FaFilter, FaEdit, FaFileExcel } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import './StudentManagement.css';

const StudentManagement = () => {
  const { token } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");

  const fetchStudents = async () => {
    try {
      const query = new URLSearchParams({ search, branch, semester }).toString();
      const res = await fetch(`${BASE_URL}/principal/students?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setStudents(data.students);
    } catch (err) {
      showToast("Failed to fetch students", "error");
    }
  };

  useEffect(() => {
    if (token) fetchStudents();
  }, [token, branch, semester]); // Re-fetch on filter change

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleExport = () => {
    if (students.length === 0) {
      showToast("No data to export", "error");
      return;
    }

    const exportData = students.map(s => ({
      'Roll No': s.rollNo,
      'Name': s.userId?.name || 'N/A',
      'Email': s.userId?.email || 'N/A',
      'Branch': s.branch,
      'Current Semester': s.currentSemester,
      'Current Year': s.currentYear,
      'Status': s.status
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `Student_Directory_${new Date().toLocaleDateString()}.xlsx`);
    showToast("Excel directory downloaded", "success");
  };

  return (
    <div className="student-mgmt-container">
      <Toast toasts={toasts} removeToast={removeToast} />
      
      <div className="mgmt-header">
        <div className="title-row">
            <h2><FaUserGraduate /> Student Directory</h2>
            <button className="export-btn" onClick={handleExport}>
                <FaFileExcel /> Download Excel
            </button>
        </div>
        <div className="header-actions">
           <form className="search-bar" onSubmit={handleSearch}>
              <FaSearch />
              <input 
                type="text" 
                placeholder="Search Name or Roll No..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit">Search</button>
           </form>
        </div>
      </div>

      <div className="filters-row">
        <div className="filter-group">
          <FaFilter />
          <select value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
          </select>
        </div>
        <div className="filter-group">
          <select value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
          </select>
        </div>
      </div>

      <div className="students-list">
        <table>
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Name</th>
              <th>Branch</th>
              <th>Semester</th>
              <th>Year</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan="7" className="no-data">No students found.</td></tr>
            ) : (
              students.map((s) => (
                <tr key={s._id}>
                  <td>{s.rollNo}</td>
                  <td>{s.userId?.name}</td>
                  <td>{s.branch}</td>
                  <td>{s.currentSemester}</td>
                  <td>{s.currentYear}</td>
                  <td><span className={`status-badge ${s.status}`}>{s.status}</span></td>
                  <td>
                    <button className="action-btn edit" title="Edit Profile">
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentManagement;
