import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./StudentLogin.css";

function StudentClassLogin() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [enrollment, setEnrollment] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await fetch("http://localhost:5000/api/student/class-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollment, password, classId }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("student", JSON.stringify(data.student));
      navigate("/StudentHome");
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="container">
      <div className="box">
        <h2>Class Login</h2>

        <input
          className="input"
          placeholder="Enrollment Number"
          value={enrollment}
          onChange={(e) => setEnrollment(e.target.value)}
        />

        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn" onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
}

export default StudentClassLogin;
