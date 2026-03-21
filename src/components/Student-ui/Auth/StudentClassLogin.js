import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./StudentLogin.css";

function StudentClassLogin() {
  const { classId } = useParams();
  const navigate    = useNavigate();
  const { studentLogin } = useAuth();

  const [enrollment, setEnrollment] = useState("");
  const [password,   setPassword]   = useState("");
  const [errorMsg,   setErrorMsg]   = useState("");
  const [loading,    setLoading]    = useState(false);

  const handleLogin = async () => {
    if (!enrollment.trim()) { setErrorMsg("Please enter your enrollment number."); return; }
    if (!password.trim())   { setErrorMsg("Please enter your password.");           return; }

    setLoading(true);
    setErrorMsg("");

    try {
      await studentLogin(enrollment, password);
      navigate("/StudentHome");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="box">
        <h2>Class Login</h2>

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <input
            className="input"
            placeholder="Enrollment Number"
            value={enrollment}
            autoFocus
            onChange={(e) => { setEnrollment(e.target.value); setErrorMsg(""); }}
          />

          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
          />

          {errorMsg && <p className="login-error-msg">{errorMsg}</p>}

          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StudentClassLogin;
