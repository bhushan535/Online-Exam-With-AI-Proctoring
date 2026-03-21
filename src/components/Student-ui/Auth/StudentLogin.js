import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { FaUserGraduate, FaLock, FaArrowLeft, FaIdCard } from "react-icons/fa";
import "../../Teacher-ui/Auth/TeacherLogin.css"; // Corrected path

function StudentLogin() {
  const { studentLogin } = useAuth();
  const [enrollment, setEnrollment] = useState("");
  const [password,   setPassword]   = useState("");
  const [errorMsg,   setErrorMsg]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!enrollment.trim()) { setErrorMsg("Enrollment required"); return; }
    if (!password.trim())   { setErrorMsg("Password required");   return; }

    setLoading(true);
    setErrorMsg("");

    try {
      await studentLogin(enrollment, password);
      navigate("/StudentHome");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Identification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Global background handled in index.css */}
      <Link to="/" className="back-to-home"><FaArrowLeft /> Home</Link>
      
      <div className="login-glass-card animate-slide-up">
        <div className="login-header">
           <div className="login-icon-box student">
             <FaUserGraduate />
           </div>
           <h2>Student Portal</h2>
           <p>Enter your credentials to access your dashboard</p>
        </div>

        <form className="login-form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <div className="input-field-v2">
            <FaIdCard className="field-icon" />
            <input
              type="text"
              placeholder="Enrollment Number"
              value={enrollment}
              autoFocus
              onChange={(e) => { setEnrollment(e.target.value); setErrorMsg(""); }}
            />
          </div>

          <div className="input-field-v2">
            <FaLock className="field-icon" />
            <input
              type="password"
              placeholder="Secure Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
            />
          </div>

          {errorMsg && <div className="login-error-v2">{errorMsg}</div>}

          <button type="submit" className="login-submit-v2 student" disabled={loading}>
            {loading ? "Identifying..." : "Portal Access"}
          </button>
        </form>

        <div className="login-footer-links">
          <span>Need access?</span>
          <Link to="/signup">Contact your administrator</Link>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;
