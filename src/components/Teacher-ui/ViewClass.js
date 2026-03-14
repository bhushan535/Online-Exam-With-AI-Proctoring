import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as XLSX from "xlsx";
import Toast      from "../Toast";
import useToast   from "../useToast";
import PopupModal from "../PopupModal";
import { FaSchool, FaSearch, FaCheckSquare, FaSquare } from "react-icons/fa";
import "./ViewClass.css";
import { BASE_URL } from '../../config';

function ViewClass() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [cls, setCls] = useState(null);
  const { toasts, showToast, removeToast } = useToast();
  const [deleteModal, setDeleteModal] = useState({ open: false, targetId: null });

  // Organization Student Search
  const [showOrgAddModal, setShowOrgAddModal] = useState(false);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");
  const [orgStudents, setOrgStudents] = useState([]);
  const [selectedEnrollments, setSelectedEnrollments] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  /* ================= FETCH CLASS ================= */
  const fetchClass = async () => {
    const res = await fetch(`${BASE_URL}/class/${id}`);
    const data = await res.json();
    setCls(data);
  };

  useEffect(() => {
    fetchClass();
    // eslint-disable-next-line
  }, [id]);

  if (!cls) return <p>Loading...</p>;

  const sortedStudents = [...cls.students].sort((a, b) => a.rollNo - b.rollNo);

  /* ================= JOIN LINK (dynamic) ================= */
  const joinLink = `${window.location.origin}/join-class/${id}`;

  /* ================= EXPORT CSV ================= */
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

  /* ================= DOWNLOAD TEMPLATE ================= */
  const downloadTemplate = () => {
    const data = [
      { "Roll No": "", "Enrollment Number": "", "Student Name": "", "Password": "" }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 10 }, { wch: 22 }, { wch: 30 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student_import_template.xlsx");
    showToast("Template downloaded!", "success");
  };

  /* ================= IMPORT STUDENTS ================= */
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

        // Validate required columns
        const required = ["Roll No", "Enrollment Number", "Student Name", "Password"];
        const missing  = required.filter(k => !Object.keys(rows[0]).includes(k));
        if (missing.length) {
          showToast(`Missing columns: ${missing.join(", ")}. Please use the template.`, "error");
          return;
        }

        const students = rows.map(r => ({
          rollNo:     Number(r["Roll No"]),
          enrollment: String(r["Enrollment Number"]).trim(),
          name:       String(r["Student Name"]).trim(),
          password:   String(r["Password"]).trim(),
        }));

        const res  = await fetch(`${BASE_URL}/class/import-students/${id}`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ students }),
        });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, "success");
          fetchClass(); // re-fetch class to update student list
        } else {
          showToast(data.message || "Import failed.", "error");
        }
      } catch (err) {
        showToast("Error reading file. Use the downloaded template format.", "error");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // reset so same file can be re-imported
  };

  /* ================= DELETE STUDENT ================= */
  const confirmDeleteStudent = async (studentId) => {
    await fetch(`${BASE_URL}/class/${id}/student/${studentId}`, { method: "DELETE" });
    fetchClass();
    showToast("Student removed.", "info");
  };

  /* ================= EDIT STUDENT ================= */
  const editStudent = async (student) => {
    const name = prompt("Enter Student Name", student.name);
    const rollNo = prompt("Enter Roll No", student.rollNo);
    const password = prompt("Enter Password", student.password);

    if (!name || !rollNo || !password) {
      showToast("All fields are required.", "warning");
      return;
    }

    await fetch(`${BASE_URL}/class/${id}/student/${student._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, rollNo, password }),
    });

    fetchClass();
    showToast("Student updated!", "success");
  };

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
  }, [orgSearchQuery, showOrgAddModal]);

  const toggleStudentSelection = (enrollment) => {
    setSelectedEnrollments(prev => 
      prev.includes(enrollment) 
        ? prev.filter(e => e !== enrollment) 
        : [...prev, enrollment]
    );
  };

  const handleAddOrgStudents = async () => {
    if (selectedEnrollments.length === 0) return;
    try {
      const res = await fetch(`${BASE_URL}/class/${id}/add-org-students`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ studentEnrollments: selectedEnrollments }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        setShowOrgAddModal(false);
        setSelectedEnrollments([]);
        setOrgSearchQuery("");
        fetchClass();
      } else {
        showToast(data.message, "error");
      }
    } catch (err) {
      showToast("Error adding students", "error");
    }
  };

  return (
    <div className="view-class-container">
      <Toast toasts={toasts} removeToast={removeToast} />
      <h2>Class Details</h2>

      <div>
        <p><b>Class Name:</b> {cls.className}</p>
        <p><b>Semester:</b> {cls.semester}</p>
        <p><b>Branch:</b> {cls.branch}</p>
        <p><b>Year:</b> {cls.year}</p>
      </div>

      <div className="class-link-box">
        <p><b>Class Join Link:</b></p>
        <input value={joinLink} readOnly />
        <button onClick={() => {
          navigator.clipboard.writeText(joinLink);
          showToast("Link copied to clipboard!", "success");
        }}>
          Copy Link
        </button>
      </div>

      <hr />

      <div className="export-row">
        <h3>Joined Students ({sortedStudents.length})</h3>
        <div className="action-btns-row">
          {user?.mode === 'organization' && (
            <button className="org-add-btn" onClick={() => setShowOrgAddModal(true)}>
              <FaSchool /> Add From Organization
            </button>
          )}
          <button className="export-btn" onClick={exportStudents}>📥 Export List</button>
          <button className="template-btn" onClick={downloadTemplate}>📄 Download Template</button>
          <label className="import-btn">
            📤 Import Students
            <input
              type="file"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={handleImport}
            />
          </label>
        </div>
      </div>

      {sortedStudents.length === 0 ? (
        <p className="no-students">No students joined yet</p>
      ) : (
        <table className="students-table">
          <thead>
            <tr>
              <th>Roll No.</th>
              <th>Enrollment No.</th>
              <th>Student Name</th>
              <th>Password</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((s) => (
              <tr key={s._id}>
                <td className="roll">{s.rollNo}</td>
                <td>{s.enrollment}</td>
                <td>{s.name}</td>
                <td>{s.password}</td>
                <td>
                  <button className="edit-btn" onClick={() => editStudent(s)}>Edit</button>
                  <button className="delete-btn" onClick={() => setDeleteModal({ open: true, targetId: s._id })}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Delete Student Confirmation */}
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
      {/* Add From Organization Modal */}
      {showOrgAddModal && (
        <div className="modal-overlay">
          <div className="modal-content org-search-modal">
            <div className="modal-header">
              <h3><FaSchool /> Add Students from Institution</h3>
              <button className="close-btn" onClick={() => setShowOrgAddModal(false)}>&times;</button>
            </div>
            
            <div className="org-search-bar">
              <FaSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Search by Name or Enrollment..." 
                value={orgSearchQuery}
                onChange={(e) => setOrgSearchQuery(e.target.value)}
              />
            </div>

            <div className="org-students-list">
              {isSearching ? (
                <div className="search-loading">Searching pool...</div>
              ) : orgStudents.length === 0 ? (
                <div className="no-results">No students found or already in class.</div>
              ) : (
                orgStudents.map(student => (
                  <div 
                    key={student.enrollmentNo} 
                    className={`org-student-item ${selectedEnrollments.includes(student.enrollmentNo) ? 'selected' : ''}`}
                    onClick={() => toggleStudentSelection(student.enrollmentNo)}
                  >
                    <div className="selection-box">
                      {selectedEnrollments.includes(student.enrollmentNo) ? <FaCheckSquare /> : <FaSquare />}
                    </div>
                    <div className="student-info">
                      <span className="name">{student.userId?.name}</span>
                      <span className="enrollment">{student.enrollmentNo}</span>
                      <span className="branch">{student.branch}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="modal-footer">
              <span className="selected-count">{selectedEnrollments.length} selected</span>
              <div className="btn-group">
                <button className="cancel-btn" onClick={() => setShowOrgAddModal(false)}>Cancel</button>
                <button 
                  className="add-btn-final" 
                  disabled={selectedEnrollments.length === 0}
                  onClick={handleAddOrgStudents}
                >
                  Add to Class
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewClass;
