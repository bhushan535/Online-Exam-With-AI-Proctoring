import React, { useState } from "react";
import { useParams } from "react-router-dom";

function JoinClass() {
  const { classId } = useParams();

  const [rollNo, setRollNo] = useState("");       // ✅ NEW
  const [enrollment, setEnrollment] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleJoin = async (e) => {
    e.preventDefault();

    console.log(
      "JOIN DATA:",
      rollNo,
      enrollment,
      name,
      password,
      classId
    );

    const res = await fetch(
      `http://localhost:5000/api/class/join/${classId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollNo: Number(rollNo),   // ✅ SEND ROLL NO.
          enrollment,
          name,
          password,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to join class");
      return;
    }

    if (data.success) {
      // ✅ store joined class info
      localStorage.setItem(
        "joinedClass",
        JSON.stringify({ classId })
      );

      alert("Joined class successfully");
    }
  };

  return (
    <div>
      <h2>Join Class</h2>

      <form onSubmit={handleJoin}>
        {/* 🔥 ROLL NO */}
        <input
          type="number"
          placeholder="Roll No."
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
          required
        />

        <input
          placeholder="Enrollment Number"
          value={enrollment}
          onChange={(e) => setEnrollment(e.target.value)}
          required
        />

        <input
          placeholder="Student Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Join Class</button>
      </form>
    </div>
  );
}

export default JoinClass;
