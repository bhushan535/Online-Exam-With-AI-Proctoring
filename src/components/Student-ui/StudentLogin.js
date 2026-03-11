import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentLogin.css";

function StudentLogin() {
  const [enrollment, setEnrollment] = useState("");
  const [password,   setPassword]   = useState("");
  const [errorMsg,   setErrorMsg]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!enrollment.trim()) { setErrorMsg("Please enter your enrollment number."); return; }
    if (!password.trim())   { setErrorMsg("Please enter your password.");           return; }

    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/student/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ enrollment, password }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        localStorage.setItem("student", JSON.stringify(result.student));
        navigate("/StudentHome");
      } else {
        setErrorMsg(result.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setErrorMsg("Connection error. Please check your internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="box">
        <h2>Student Login</h2>

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <input
            className="input"
            type="text"
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

export default StudentLogin;
