import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./TeacherLogin.css";

function TeacherLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Get role from query param
  const queryParams = new URLSearchParams(location.search);
  const roleParam = queryParams.get('role'); // 'teacher' or 'principal'

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate("/TeacherHome");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid Email or Password");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="container">
      <div className="box">
        <center><h2>{roleParam === 'principal' ? 'Organization Login' : 'Teacher Login'}</h2></center>

        <input
          className="input"
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        <input
          className="input"
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {error && <p style={{ color: "red", fontSize: '14px' }}>{error}</p>}

        <br />
        <button className="btn" onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={{ marginTop: '15px', fontSize: '14px', textAlign: 'center' }}>
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
      </div>
    </div>
  );
}

export default TeacherLogin;
