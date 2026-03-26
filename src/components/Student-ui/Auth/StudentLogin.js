import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { FaUserGraduate, FaLock, FaArrowLeft, FaIdCard } from "react-icons/fa";
import ThemeToggle from "../../Common/ThemeToggle";
import "../StudentLogin.css"; // Use the component-specific CSS

function StudentLogin() {
  const { studentLogin } = useAuth();
  const [enrollment, setEnrollment] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!enrollment.trim()) { setErrorMsg("Enrollment required"); return; }
    if (!password.trim()) { setErrorMsg("Password required"); return; }

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
    <div className="sl-container">
      <ThemeToggle />
      <Link to="/" className="sl-back-to-home">
        <FaArrowLeft /> Home
      </Link>

      <div className="sl-box">
        <div className="sl-header">
          <div className="sl-icon-box">
            <FaUserGraduate />
          </div>
          <h2>Student Login</h2>
          <p>Enter your credentials to access your dashboard</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <div className="input-container">
            <FaIdCard className="field-icon" />
            <input
              className="sl-input"
              type="text"
              placeholder="Enrollment Number"
              value={enrollment}
              autoFocus
              onChange={(e) => { setEnrollment(e.target.value); setErrorMsg(""); }}
            />
          </div>

          <div className="input-container">
            <FaLock className="field-icon" />
            <input
              className="sl-input"
              type="password"
              placeholder="Secure Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
            />
          </div>

          {errorMsg && <div className="sl-login-error-msg">{errorMsg}</div>}

          <button type="submit" className="sl-btn" disabled={loading}>
            {loading ? "Identifying..." : "Portal Access"}
          </button>
        </form>

        <div className="sl-hypertext">
          <span>Need access? </span>
          <Link to="#">Contact your Teacher</Link>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;
