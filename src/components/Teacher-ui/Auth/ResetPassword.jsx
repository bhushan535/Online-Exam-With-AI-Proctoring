import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaLock, FaArrowLeft, FaShieldAlt } from "react-icons/fa";
import { BASE_URL } from "../../../config";
import "./TeacherLogin.css";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${BASE_URL}/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(data.message || "Failed to reset password.");
      }
    } catch (err) {
      setError("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <Link to="/login" className="back-to-home"><FaArrowLeft /> Back to Login</Link>

      <div className="login-glass-card animate-slide-up">
        <div className="login-header">
          <div className="login-icon-box">
            <FaShieldAlt />
          </div>
          <h2>Update Password</h2>
          <p>Set a new password for your account</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-field-v2">
            <FaLock className="field-icon" />
            <input
              type="password"
              placeholder="New access key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-field-v2">
            <FaLock className="field-icon" />
            <input
              type="password"
              placeholder="Confirm new access key"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {message && <div className="login-success-v2">{message}</div>}
          {error && <div className="login-error-v2">{error}</div>}

          <button type="submit" className="login-submit-v2" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <div className="login-footer-links">
          <span>Go back to</span>
          <Link to="/login">Authentication</Link>
        </div>
      </div>

      <style jsx>{`
        .login-success-v2 {
          background: rgba(34, 197, 94, 0.1);
          color: #4ade80;
          padding: 0.8rem 1rem;
          border-radius: 12px;
          font-size: 0.85rem;
          text-align: center;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }
        [data-theme='light'] .login-success-v2 {
          background: #f0fdf4;
          color: #166534;
          border: 2px solid #166534;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

export default ResetPassword;
