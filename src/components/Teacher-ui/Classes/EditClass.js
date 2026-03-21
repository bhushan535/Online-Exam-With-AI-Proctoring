import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Toast    from "../../Common/Toast";
import useToast from "../../Common/useToast";
import BackButton from "../../Common/BackButton";
import { useAuth } from "../../../context/AuthContext";
import { BASE_URL } from '../../../config';
import "./EditClass.css";

function EditClass() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, org } = useAuth();
  const { toasts, showToast, removeToast } = useToast();

  const [className, setClassName] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [loading, setLoading] = useState(true);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const classRes = await fetch(`${BASE_URL}/class/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const classData = await classRes.json();
        
        if (classData) {
            setClassName(classData.className);
            setBranch(classData.branch);
            setYear(classData.year);
            setSemester(classData.semester);
        }
      } catch (err) {
        showToast("Synchronization failed", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token, showToast]);

  /* ================= UPDATE ================= */
  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${BASE_URL}/class/${id}`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ className, branch, semester, year }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Update failed", "error");
        return;
      }

      showToast("Class updated successfully! ✅", "success");
      setTimeout(() => navigate("/Classes"), 1500);
    } catch (err) {
      showToast("Network error during update", "error");
    }
  };

  const branches = org?.branches || [];
  const years = org?.academicYears || [];
  const semesters = org?.semesters || [];

  return (
    <div className="edit-class-overlay">
      <Toast toasts={toasts} removeToast={removeToast} />
      <div className="ec-nav">
        <BackButton to="/Classes" />
      </div>

      <div className="ec-container glass-premium">
        <h2>Edit Class Blueprint</h2>
        <p className="ec-subtitle">Update parameters for this academic session</p>

        <form className="edit-class-form" onSubmit={handleUpdate}>
          <div className="ec-input-group">
            <label>Class Identifier</label>
            <input 
                value={className} 
                onChange={(e) => setClassName(e.target.value)} 
                required 
                placeholder="e.g. CS-4A ML"
            />
          </div>

          <div className="ec-grid">
            <div className="ec-input-group">
              <label>Branch / Domain</label>
              <select value={branch} onChange={(e) => setBranch(e.target.value)} required>
                <option value="">Select Branch</option>
                {branches.map((b) => (<option key={b} value={b}>{b}</option>))}
                {!branches.length && <option value={branch}>{branch}</option>}
              </select>
            </div>
            <div className="ec-input-group">
              <label>Academic Year</label>
              <select value={year} onChange={(e) => setYear(e.target.value)} required>
                <option value="">Select Year</option>
                {years.map((y) => (<option key={y} value={y}>{y}</option>))}
                {!years.length && <option value={year}>{year}</option>}
              </select>
            </div>
          </div>

          <div className="ec-input-group">
            <label>Semester</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} required>
              <option value="">Select Semester</option>
              {semesters.map((sem) => (<option key={sem} value={sem}>{sem}</option>))}
              {!semesters.length && <option value={semester}>{semester}</option>}
            </select>
          </div>

          <button type="submit" className="ec-save-btn" disabled={loading}>
            {loading ? "Syncing..." : "Commit Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditClass;
