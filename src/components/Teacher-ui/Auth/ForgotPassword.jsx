import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaEnvelope, FaArrowLeft, FaShieldAlt, FaUserTie, FaUser } from "react-icons/fa";
import { BASE_URL } from "../../../config";
import "./TeacherLogin.css";

function ForgotPassword() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get('role') || 'teacher';

  const [email, setEmail] = useState("");
  const [mode, setMode] = useState(role === 'principal' ? 'organization' : "organization");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Timer effect for cooldown
  React.useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mode, role }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message);
        setCooldown(60);
      } else {
        if (response.status === 429) {
          setError(data.message || "Too many requests. Please wait.");
          if (data.message.includes("wait")) {
            const match = data.message.match(/(\d+)s/);
            if (match) setCooldown(parseInt(match[1]));
            else setCooldown(60);
          } else {
            setCooldown(60);
          }
        } else {
          setError(data.message || "Requested account not found or invalid.");
        }
      }
    } catch (err) {
      setError("Failed to connect to server. Please check your network.");
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
          <h2>{role === 'principal' ? 'Admin Recovery' : 'Reset Access'}</h2>
          <p>{role === 'principal' ? 'Recover your organization account' : 'Provide your email to receive a secure reset link'}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {role !== 'principal' && (
            <div className="mode-selection-mini">
              <label className={`mode-option ${mode === 'organization' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="mode"
                  value="organization"
                  checked={mode === 'organization'}
                  onChange={() => setMode('organization')}
                />
                <FaUserTie /> Organization
              </label>
              <label className={`mode-option ${mode === 'solo' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="mode"
                  value="solo"
                  checked={mode === 'solo'}
                  onChange={() => setMode('solo')}
                />
                <FaUser /> Private
              </label>
            </div>
          )}

          <div className="input-field-v2">
            <FaEnvelope className="field-icon" />
            <input
              type="email"
              placeholder={role === 'principal' ? "Admin Email" : "Institutional Email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {message && <div className="login-success-v2">{message}</div>}
          {error && <div className="login-error-v2">{error}</div>}

          <button
            type="submit"
            className="login-submit-v2"
            disabled={loading || cooldown > 0}
            style={{ opacity: (loading || cooldown > 0) ? 0.7 : 1 }}
          >
            {loading ? "Sending link..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Send Reset Link"}
          </button>
        </form>

        <div className="login-footer-links">
          <span>Remembered password?</span>
          <Link to="/login">Login</Link>
        </div>
      </div>

      <style jsx>{`
        .mode-selection-mini {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        .mode-option {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.8rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.3s;
        }
        .mode-option input {
          display: none;
        }
        .mode-option.active {
          background: rgba(99, 102, 241, 0.2);
          border-color: #6366f1;
          color: #6366f1;
        }
        .login-success-v2 {
          background: rgba(34, 197, 94, 0.1);
          color: #4ade80;
          padding: 0.8rem 1rem;
          border-radius: 12px;
          font-size: 0.85rem;
          text-align: center;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }
        [data-theme='light'] .mode-option {
          background: #ffffff;
          border-color: #000000;
          color: #000000;
          box-shadow: 2px 2px 0px #000000;
        }
        [data-theme='light'] .mode-option.active {
          background: #000000;
          color: #ffffff;
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

export default ForgotPassword;
