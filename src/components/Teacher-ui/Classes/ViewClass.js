import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import * as XLSX from "xlsx";
import Toast      from "../../Common/Toast";
import useToast   from "../../Common/useToast";
import PopupModal from "../../Common/PopupModal";
import { FaArrowLeft } from "react-icons/fa";
import "./ViewClass.css";
import { BASE_URL } from '../../../config';

// Import mode-specific templates
import SoloClassView from "./SoloClassView";
import OrgClassView from "./OrgClassView";

function ViewClass() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [cls, setCls] = useState(null);
  const { toasts, showToast, removeToast } = useToast();
  const [deleteModal, setDeleteModal] = useState({ open: false, targetId: null });

  // Organization-mode specific states
  const [showOrgAddModal, setShowOrgAddModal] = useState(false);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");
  const [orgStudents, setOrgStudents] = useState([]);
  const [selectedEnrollments, setSelectedEnrollments] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Solo-mode specific states
  const [fastEnrollData, setFastEnrollData] = useState({ studentId: "", name: "", password: "" });
  const [isAddingFast, setIsAddingFast] = useState(false);

  /* ================= FETCH CLASS ================= */
  const fetchClass = async () => {
    try {
      const res = await fetch(`${BASE_URL}/class/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Failed to fetch class.", "error");
        return;
      }
      setCls(data);
    } catch (err) {
      showToast("Network error fetching class", "error");
    }
  };

  useEffect(() => {
    if (token) {
        fetchClass();
    }
    // eslint-disable-next-line
  }, [id, token]);

  /* ================= SEARCH ORG STUDENTS ================= */
  const searchOrgStudents = async (q) => {
    setIsSearching(true);
    try {
      const res = await fetch(`${BASE_URL}/class/${id}/org-students?query=${q}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOrgStudents(data.students);
      }
    } catch (err) {
      showToast("Error searching students", "error");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (showOrgAddModal) {
      searchOrgStudents(orgSearchQuery);
    }
    // eslint-disable-next-line
  }, [orgSearchQuery, showOrgAddModal]);

  if (!cls) return (
    <div className="view-class-loading glass-premium">
        <div className="loader"></div>
        <p>Synchronizing class data...</p>
    </div>
  );
 
  const sortedStudents = Array.isArray(cls.students) ? [...cls.students].sort((a, b) => a.rollNo - b.rollNo) : [];
  const joinLink = `${window.location.origin}/join-class/${id}`;

  /* ================= SHARED HANDLERS ================= */
  const exportStudents = () => {
    if (sortedStudents.length === 0) {
      showToast("No students to export.", "warning");
      return;
    }
    let csv = "Roll No,Enrollment No,Student Name,Password\n";
    sortedStudents.forEach((s) => {
      csv += `${s.rollNo},${s.enrollment},${s.name},${s.password}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${cls.className}_students.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Student list exported!", "success");
  };

  const downloadTemplate = () => {
    const data = [{ "Roll No": "", "Enrollment Number": "", "Student Name": "", "Password": "" }];
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 10 }, { wch: 22 }, { wch: 30 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student_import_template.xlsx");
    showToast("Template downloaded!", "success");
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb   = XLSX.read(evt.target.result, { type: "binary" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);
        if (!rows.length) {
          showToast("The file is empty.", "warning");
          return;
        }
        const students = rows.map(r => ({
          rollNo: Number(r["Roll No"]),
          enrollment: String(r["Enrollment Number"]).trim(),
          name: String(r["Student Name"]).trim(),
          password: String(r["Password"]).trim(),
        }));
        const res  = await fetch(`${BASE_URL}/class/import-students/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ students }),
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message, "success");
          fetchClass();
        } else {
          showToast(data.message || "Import failed.", "error");
        }
      } catch (err) {
        showToast("Error reading file.", "error");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const confirmDeleteStudent = async (enrollment) => {
    try {
      const res = await fetch(`${BASE_URL}/class/${id}/student/${enrollment}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast("Student removed.", "success");
        fetchClass();
      } else {
        showToast(data.message || "Removal failed", "error");
      }
    } catch (err) {
      showToast("Error removing student", "error");
    }
  };

  const editStudent = async (student) => {
    const name = prompt("Enter Student Name", student.name);
    const rollNo = prompt("Enter Roll No", student.rollNo);
    const password = prompt("Enter Password", student.password);
    if (!name || !rollNo || !password) return;

    await fetch(`${BASE_URL}/class/${id}/student/${student._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, rollNo, password }),
    });
    fetchClass();
    showToast("Student updated!", "success");
  };

  const handleAddOrgStudents = async () => {
    if (selectedEnrollments.length === 0) return;
    try {
      const res = await fetch(`${BASE_URL}/class/${id}/add-org-students`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ studentEnrollments: selectedEnrollments }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        setShowOrgAddModal(false);
        setSelectedEnrollments([]);
        fetchClass();
      }
    } catch (err) {
      showToast("Error adding students", "error");
    }
  };

  const handleFastEnroll = async (e) => {
    e.preventDefault();
    if (!fastEnrollData.studentId || !fastEnrollData.name || !fastEnrollData.password) return;
    try {
      setIsAddingFast(true);
      const res = await fetch(`${BASE_URL}/class/join/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollNo: cls.students.length + 1,
          enrollment: fastEnrollData.studentId,
          name: fastEnrollData.name,
          password: fastEnrollData.password
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Student enrolled!", "success");
        setFastEnrollData({ studentId: "", name: "", password: "" });
        fetchClass();
      }
    } finally {
      setIsAddingFast(false);
    }
  };

  const isSolo = cls.mode === 'solo' || user?.mode === 'solo';

  return (
    <div className="vc-premium-overlay animate-fade-in">
        <Toast toasts={toasts} removeToast={removeToast} />
        <div className="vc-nav-top">
            <button className="vc-back-btn" onClick={() => window.history.back()}>
                <FaArrowLeft /> Back to Dashboard
            </button>
        </div>

        {isSolo ? (
            <SoloClassView 
                cls={cls}
                joinLink={joinLink}
                sortedStudents={sortedStudents}
                showToast={showToast}
                fastEnrollData={fastEnrollData}
                setFastEnrollData={setFastEnrollData}
                handleFastEnroll={handleFastEnroll}
                isAddingFast={isAddingFast}
                editStudent={editStudent}
                setDeleteModal={setDeleteModal}
            />
        ) : (
            <OrgClassView 
                cls={cls}
                joinLink={joinLink}
                sortedStudents={sortedStudents}
                showToast={showToast}
                exportStudents={exportStudents}
                downloadTemplate={downloadTemplate}
                handleImport={handleImport}
                setShowOrgAddModal={setShowOrgAddModal}
                showOrgAddModal={showOrgAddModal}
                orgSearchQuery={orgSearchQuery}
                setOrgSearchQuery={setOrgSearchQuery}
                orgStudents={orgStudents}
                selectedEnrollments={selectedEnrollments}
                toggleStudentSelection={(enrollment) => setSelectedEnrollments(prev => prev.includes(enrollment) ? prev.filter(e => e !== enrollment) : [...prev, enrollment])}
                handleAddOrgStudents={handleAddOrgStudents}
                isSearching={isSearching}
                editStudent={editStudent}
                setDeleteModal={setDeleteModal}
            />
        )}

        <PopupModal
            isOpen={deleteModal.open}
            type="error"
            title="Remove Student?"
            message="Are you sure you want to remove this student from the class?"
            confirmText="Yes, Remove"
            cancelText="Cancel"
            confirmColor="#dc2626"
            onConfirm={async () => {
                await confirmDeleteStudent(deleteModal.targetId);
                setDeleteModal({ open: false, targetId: null });
            }}
            onCancel={() => setDeleteModal({ open: false, targetId: null })}
        />
    </div>
  );
}

export default ViewClass;

