import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./JoinClass.css";
import { BASE_URL } from '../../../config';

function JoinClass() {
  const { classId } = useParams();
  const navigate    = useNavigate();

  const [classInfo,  setClassInfo]  = useState(null);
  const [rollNo,     setRollNo]     = useState("");
  const [enrollment, setEnrollment] = useState("");
  const [name,       setName]       = useState("");
  const [password,   setPassword]   = useState("");
  const [errorMsg,   setErrorMsg]   = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading,    setLoading]    = useState(false);

  // Fetch class metadata to show at top of form
  useEffect(() => {
    fetch(`${BASE_URL}/join-class-info/${classId}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !data.success) {
          setErrorMsg(data.message || "Unable to join this class right now.");
          return;
        }
        setClassInfo(data);
      })
      .catch(() => {
        setErrorMsg("Failed to connect to the server.");
      });
  }, [classId]);

  const handleJoin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!rollNo.trim())     { setErrorMsg("Please enter your Roll No.");       return; }
    if (!enrollment.trim()) { setErrorMsg("Please enter your Enrollment No."); return; }
    if (!name.trim())       { setErrorMsg("Please enter your full name.");      return; }
    if (!password.trim())   { setErrorMsg("Please create a password.");         return; }

    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/class/join/${classId}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rollNo: Number(rollNo), enrollment, name, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Failed to join class. Please try again.");
        return;
      }

      setSuccessMsg("✅ Joined successfully! You can now login with your enrollment and password.");
      setTimeout(() => navigate("/StudentLogin"), 3000);

    } catch (err) {
      setErrorMsg("Connection error. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jc-page">
      <div className="jc-card">

        <div className="jc-header">
          <div className="jc-logo">🎓</div>
          <h1 className="jc-college">{classInfo?.organizationName || "Institution Name"}</h1>
          <h2 className="jc-title">Join Class</h2>
        </div>

        {errorMsg && !classInfo && (
          <div className="jc-error-box">
             <p>{errorMsg}</p>
             <button onClick={() => navigate("/StudentLogin")} className="jc-btn-outline">Go to Login</button>
          </div>
        )}

        {successMsg ? (
          <div className="jc-success">{successMsg}</div>
        ) : classInfo && (
          <>
            <div className="jc-class-banner">
              <strong>{classInfo.className}</strong>
              &nbsp;·&nbsp; {classInfo.semester}
              &nbsp;·&nbsp; {classInfo.branch}
              {classInfo.mode === 'solo' && (
                <div className="jc-capacity">
                  {classInfo.currentStudents} / {classInfo.maxStudents} Students Joined
                </div>
              )}
            </div>
            <form onSubmit={handleJoin} className="jc-form">

              <input
                className="jc-input"
                type="number"
                placeholder="Roll No."
                value={rollNo}
                autoFocus
                onChange={(e) => { setRollNo(e.target.value); setErrorMsg(""); }}
              />

              <input
                className="jc-input"
                placeholder="Enrollment Number"
                value={enrollment}
                onChange={(e) => { setEnrollment(e.target.value); setErrorMsg(""); }}
              />

              <input
                className="jc-input"
                placeholder="Full Name"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrorMsg(""); }}
              />

              <input
                className="jc-input"
                type="password"
                placeholder="Create Password (you'll use this to login)"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
              />

              {errorMsg && <p className="jc-error">{errorMsg}</p>}

              <button type="submit" className="jc-btn" disabled={loading}>
                {loading ? "Joining..." : "Join Class"}
              </button>

            </form>

            <p className="jc-already">
              Already joined?{" "}
              <span onClick={() => navigate("/StudentLogin")}>Login Here →</span>
            </p>
          </>
        )}

      </div>
    </div>
  );
}

export default JoinClass;
