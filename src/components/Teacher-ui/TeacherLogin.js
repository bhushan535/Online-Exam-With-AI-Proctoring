import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherLogin.css";

function TeacherLogin() {
  const navigate = useNavigate();
  const [UserName, setUserName] = useState("");   // ✅ UserName
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/teacher/login",
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
        // ✅ teacher save
        localStorage.setItem("teacher", JSON.stringify(data.teacher));
        navigate("/TeacherHome");
      } else {
        setError(data.message || "Invalid UserName or Password");
      }
    } catch (err) {
      setError("Server not responding");
    }
  };

  return (
    <div className="container">
      <div className="box">
        <center><h2>Teacher Login</h2></center>

        <input
          className="input"
          type="text"
          placeholder="Enter Text"
          value={UserName}
          onChange={(e) => setUserName(e.target.value)}
        />

        <input
          className="input"
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
