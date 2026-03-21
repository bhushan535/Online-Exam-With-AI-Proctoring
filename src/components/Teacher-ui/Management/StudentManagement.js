import React, { useEffect, useState } from 'react';
import { useAuth } from "../../../context/AuthContext";
import { BASE_URL } from '../../../config';
import axios from 'axios';
import Toast from "../../Common/Toast";
import useToast from "../../Common/useToast";
import BackButton from "../../Common/BackButton";
import { FaSearch, FaUserGraduate, FaFilter, FaEdit, FaFileExcel, FaUserCircle, FaGraduationCap, FaCalendarAlt, FaTrash, FaIdCard, FaEnvelope } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import PopupModal from "../../Common/PopupModal";
import "./StudentManagement.css";

const StudentManagement = () => {
  const { token, org, refreshOrg } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");

  // Metadata for filters
  const [availableBranches, setAvailableBranches] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([]);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, studentId: null, studentName: "" });

  const fetchStudents = async () => {
    try {
      const query = new URLSearchParams({ search, branch, semester }).toString();
      const res = await fetch(`${BASE_URL}/principal/students?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
        if (data.metadata) {
          setAvailableBranches(data.metadata.branches || []);
          setAvailableSemesters(data.metadata.semesters || []);
        }
      }
    } catch (err) {
      showToast("Failed to fetch student database", "error");
    }
  };

  useEffect(() => {
    if (token) {
      fetchStudents();
    }
  }, [token, branch, semester]);

  useEffect(() => {
    if (token) {
      refreshOrg();
    }
  }, [token]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleExport = () => {
    if (students.length === 0) {
      showToast("Database is empty", "error");
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
    XLSX.writeFile(wb, `Student_Registry_${new Date().toLocaleDateString()}.xlsx`);
    showToast("Student registry exported to Excel", "success");
  };

  const handleDeleteStudent = async () => {
    try {
      const res = await fetch(`${BASE_URL}/principal/student/${deleteModal.studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        fetchStudents();
      } else {
        showToast(data.message || "Failed to delete student", "error");
      }
    } catch (err) {
      showToast("Error connecting to server", "error");
    } finally {
      setDeleteModal({ isOpen: false, studentId: null, studentName: "" });
    }
  };

  const handleSync = async () => {
    try {
      const resp = await axios.post(`${BASE_URL}/principal/cleanup-students`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.data.success) {
        showToast(resp.data.message, "success");
        fetchStudents();
      }
    } catch (err) {
      showToast("Sync failed: " + (err.response?.data?.message || err.message), "error");
    }
  };

  return (
    <div className="student-mgmt-container">
      <Toast toasts={toasts} removeToast={removeToast} />
      <BackButton to="/TeacherHome" />

      <div className="mgmt-header">
        <div className="header-info">
          <h2><FaUserGraduate /> Student Directory</h2>
          <p>Comprehensive registry of all students enrolled in the institution</p>
        </div>
        <div className="header-actions-premium">
          <button className="sync-btn-premium" onClick={handleSync} title="Synchronize roll numbers and enrollment IDs">
            <FaFilter /> Sync Records
          </button>
          <button className="export-btn-premium" onClick={handleExport}>
            <FaFileExcel /> Export Spreadsheet
          </button>
        </div>
      </div>

      <div className="search-filter-belt">
        <form className="search-bar-modern" onSubmit={handleSearch}>
          <FaSearch />
          <input
            type="text"
            placeholder="Search by Name, Roll No or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="filter-actions">
          <div className="filter-select">
            <FaFilter />
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="">All Branches</option>
              {availableBranches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="filter-select">
            <FaCalendarAlt />
            <select value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="">All Semesters</option>
              {availableSemesters.map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="students-table-wrapper">
        <table className="modern-table">
          <thead>
            <tr>
              <th><FaIdCard /> Student / Roll No</th>
              <th><FaEnvelope /> Enrollment No.</th>
              <th><FaGraduationCap /> Branch / Semester </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="5">
                  <div className="no-students">
                    <FaUserGraduate />
                    <p>No student records found matching your selection.</p>
                  </div>
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div className="user-cell">
                      <span className="user-name">{s.userId?.name}</span>
                      <span className="user-subtext">Roll: #{s.rollNo}</span>
                    </div>
                  </td>
                  <td>{s.enrollmentNo?.split('@')[0] || 'N/A'}</td>
                  <td>
                    <div className="academic-cell">
                      <span className="branch-text">{s.branch}-</span>
                      <span className="sem-text">{s.currentSemester}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill pill-${s.status || 'active'}`}>
                      {s.status || 'active'}
                    </span>
                  </td>
                  <td>
                    <div className="action-button-group">
                      <button
                        className="btn-action-icon"
                        title="Manage Profile"
                        onClick={() => showToast("Profile editing coming soon", "info")}
                      >
                        <FaEdit />
                        <span>Manage</span>
                      </button>
                      <button
                        className="btn-action-icon delete"
                        title="Purge Student Record"
                        onClick={() => setDeleteModal({
                          isOpen: true,
                          studentId: s._id,
                          studentName: s.userId?.name
                        })}
                      >
                        <FaTrash />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PopupModal
        isOpen={deleteModal.isOpen}
        type="warning"
        title="Confirm Student Purge"
        message={`Are you sure you want to delete ${deleteModal.studentName}?`}
        details={[
          { icon: "⚠️", label: "Warning", value: "This will permanently remove the student, their account, and remove them from all classes.", color: "#dc2626" }
        ]}
        confirmText="Yes, Purge Record"
        cancelText="Cancel"
        onConfirm={handleDeleteStudent}
        onCancel={() => setDeleteModal({ isOpen: false, studentId: null, studentName: "" })}
      />
    </div>
  );
};

export default StudentManagement;
