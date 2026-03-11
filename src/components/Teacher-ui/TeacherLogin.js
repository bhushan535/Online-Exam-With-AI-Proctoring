import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherLogin.css";

function TeacherLogin() {
  const navigate = useNavigate();
  const [UserName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/teacher/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ UserName, password }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("teacher", JSON.stringify(data.teacher));
        navigate("/TeacherHome");
      } else {
        setError(data.message || "Invalid UserName or Password");
      }
    } catch (err) {
      setError("Server not responding");
    }
  };

  /* Enter key triggers login */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="container">
      <div className="box">
        <center><h2>Teacher Login</h2></center>

        <input
          className="input"
          type="text"
          placeholder="Enter Username"
          value={UserName}
          onChange={(e) => setUserName(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <input
          className="input"
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <br />
        <button className="btn" onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
}

export default TeacherLogin;
