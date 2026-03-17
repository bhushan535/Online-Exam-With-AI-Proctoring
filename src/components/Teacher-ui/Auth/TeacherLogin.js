import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { FaEnvelope, FaLock, FaArrowLeft, FaShieldAlt } from "react-icons/fa";
import "./TeacherLogin.css";

function TeacherLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const queryParams = new URLSearchParams(location.search);
  const roleParam = queryParams.get('role');

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Credentials required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(email, password, roleParam);
      navigate("/TeacherHome");
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-bg-overlay"></div>
      <Link to="/" className="back-to-home"><FaArrowLeft /> Home</Link>
      
      <div className="login-glass-card animate-slide-up">
        <div className="login-header">
           <div className="login-icon-box">
             <FaShieldAlt />
           </div>
           <h2>{roleParam === 'principal' ? 'Organization Login' : 'Faculty Access'}</h2>
           <p>Enter your credentials to access the console</p>
        </div>

        <div className="login-form">
          <div className="input-field-v2">
            <FaEnvelope className="field-icon" />
            <input
              type="email"
              placeholder="Institutional Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              autoFocus
            />
          </div>

          <div className="input-field-v2">
            <FaLock className="field-icon" />
            <input
              type="password"
              placeholder="Access Key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {error && <div className="login-error-v2">{error}</div>}

          <button className="login-submit-v2" onClick={handleLogin} disabled={loading}>
            {loading ? "Verifying..." : "Secure Login"}
          </button>
        </div>

        <div className="login-footer-links">
          <span>Out of network?</span>
          <Link to="/signup">Register institution</Link>
        </div>
      </div>
    </div>
  );
}

export default TeacherLogin;
