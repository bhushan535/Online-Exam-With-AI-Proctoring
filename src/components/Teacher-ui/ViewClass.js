import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./ViewClass.css";

function ViewClass() {
  const { id } = useParams();
  const [cls, setCls] = useState(null);

  /* ================= FETCH CLASS ================= */
  const fetchClass = async () => {
    const res = await fetch(`http://localhost:5000/api/class/${id}`);
    const data = await res.json();
    setCls(data);
  };

  useEffect(() => {
    fetchClass();
  }, [id]);

  if (!cls) return <p>Loading...</p>;

  // ✅ SORT STUDENTS BY ROLL NO
  const sortedStudents = [...cls.students].sort(
    (a, b) => a.rollNo - b.rollNo
  );

  /* ================= EXPORT CSV ================= */
  const exportStudents = () => {
    if (sortedStudents.length === 0) {
      alert("No students to export");
      return;
    }

    let csv = "Roll No,Enrollment No,Student Name,Password\n";

    sortedStudents.forEach((s) => {
      csv += `${s.rollNo},${s.enrollment},${s.name},${s.password}\n`;
    });

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", `${cls.className}_students.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ================= DELETE STUDENT ================= */
  const deleteStudent = async (studentId) => {
    const confirm = window.confirm(
      "Are you sure you want to remove this student?"
    );
    if (!confirm) return;

    await fetch(
      `http://localhost:5000/api/class/${id}/student/${studentId}`,
      { method: "DELETE" }
    );

    fetchClass(); // reload
  };

  /* ================= EDIT STUDENT ================= */
  const editStudent = async (student) => {
    const name = prompt("Enter Student Name", student.name);
    const rollNo = prompt("Enter Roll No", student.rollNo);
    const password = prompt("Enter Password", student.password);

    if (!name || !rollNo || !password) {
      alert("All fields are required");
      return;
    }

    await fetch(
      `http://localhost:5000/api/class/${id}/student/${student._id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          rollNo,
          password,
        }),
      }
    );

    fetchClass(); // reload
  };

  return (
    <div className="view-class-container">
      <h2>Class Details</h2>

      <div>
        <p><b>Class Name:</b> {cls.className}</p>
        <p><b>Semester:</b> {cls.semester}</p>
        <p><b>Branch:</b> {cls.branch}</p>
        <p><b>Year:</b> {cls.year}</p>
      </div>

      <div className="class-link-box">
        <p><b>Class Join Link:</b></p>
        <input
          value={`http://localhost:3000/join-class/${id}`}
          readOnly
        />
        <button
          onClick={() =>
            navigator.clipboard.writeText(
              `http://localhost:3000/join-class/${id}`
            )
          }
        >
          Copy Link
        </button>
      </div>

      <hr />

      <div className="export-row">
        <h3>Joined Students ({sortedStudents.length})</h3>
        <button className="export-btn" onClick={exportStudents}>
          Export Student List
        </button>
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
                  <button
                    className="edit-btn"
                    onClick={() => editStudent(s)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => deleteStudent(s._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ViewClass;
