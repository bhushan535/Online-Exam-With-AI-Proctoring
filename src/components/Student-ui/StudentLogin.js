import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentLogin.css";

function StudentLogin() {
  const [enrollment, setEnrollment] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // student jis class me joined hai, uska classId
  const classId = JSON.parse(localStorage.getItem("joinedClass"))?.classId;

 const handleLogin = async () => {
  const response = await fetch(
    "http://localhost:5000/api/student/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollment, password }),
    }
  );

  const result = await response.json();

  if (response.ok && result.success) {
    localStorage.setItem("student", JSON.stringify(result.student));
    navigate("/StudentHome");
  } else {
    alert(result.message);
  }
};


  return (
    <div className="container">
      <div className="box">
        <h2>Student Login</h2>

        <input
          className="input"
          type="text"
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

        <br />
        <button className="btn" onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
}

export default StudentLogin;
