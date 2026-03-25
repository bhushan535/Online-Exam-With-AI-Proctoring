import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ExamInstructions.css";
import Toast from "../../Common/Toast";
import useToast from "../../Common/useToast";
import axios from "axios";
import { BASE_URL } from '../../../config';

function ExamInstructions() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [agree, setAgree] = useState(false);
  const [exam, setExam] = useState(null);
  const [enteredCode, setEnteredCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    axios.get(`/api/exams/${examId}`)
      .then((res) => {
        setExam(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch exam error:", err);
        setLoading(false);
      });
  }, [examId]);

  const startExam = async () => {
    if (!exam) return;
    if (!enteredCode.trim()) {
      setCodeError("Please enter the exam code given by your teacher.");
      return;
    }

    setIsVerifying(true);
    setCodeError("");

    try {
      const student = JSON.parse(localStorage.getItem("student")) || {};
      const res = await axios.post("/api/exams/verify-code", {
        examId,
        code: enteredCode.trim(),
        studentId: student.enrollment
      });
      const data = res.data;

      if (!data.success) {
        setCodeError(data.message || "Invalid code. Please check and try again.");
        showToast(data.message || "Invalid code.", "error");
        return;
      }

      localStorage.setItem("instructionAccepted", examId);
      
      // If AI Proctoring is disabled, bypass camera check and go to countdown
      if (exam?.proctoringConfig?.enabled === false) {
        navigate(`/exam-countdown/${examId}`);
      } else {
        navigate(`/camera-check/${examId}`);
      }
    } catch (err) {
      console.error("Verification error:", err);
      const msg = err.response?.data?.message || "Server error. Please try again.";
      setCodeError(msg);
      showToast(msg, "error");
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="ei-instruction-page ei-loading-state">
        <div className="ei-spinner"></div>
        <p>Loading instructions...</p>
      </div>
    );
  }

  return (
    <div className="ei-instruction-page">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="ei-instruction-card">
        <div className="ei-header-gradient">
          <h2>Examination Instructions</h2>
          {exam && (
            <div className="ei-exam-meta">
              <span>{exam.examName}</span>
              <span className="ei-dot">•</span>
              <span>{exam.subject}</span>
              <span className="ei-dot">•</span>
              <span>{exam.duration} mins</span>
            </div>
          )}
        </div>

        <div className="ei-instruction-body">
          <div className="ei-rules-section">
            <h3>📝 Please read carefully before starting</h3>
            <ul className="ei-instruction-list">
              <li>The total duration of the examination is fixed and will not be extended.</li>
              <li>Once the examination starts, it cannot be paused or restarted.</li>
              <li>Do not refresh or close the browser during the exam.</li>
              <li>Each question carries equal marks unless specified.</li>
              <li>Only one option is correct for each question.</li>
              <li>The exam will automatically submit when time expires.</li>
              <li>Any malpractice may result in disqualification.</li>
              {exam?.proctoringConfig?.enabled ? (
                <li className="ei-proctoring-rule"><b>AI Proctoring Active:</b> Ensure you are in a well-lit room and facing the camera at all times. Avoid tab-switching.</li>
              ) : (
                <li><b>Open Browser Mode:</b> AI Proctoring is disabled for this assessment.</li>
              )}
              <li>Ensure a stable internet connection before starting.</li>
            </ul>
          </div>

          <div className="ei-action-section">
            <div className="ei-code-input-group">
              <label>Exam Access Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={enteredCode}
                onChange={(e) => {
                  setEnteredCode(e.target.value);
                  setCodeError("");
                }}
                className={codeError ? "ei-input-error" : ""}
                maxLength={10}
              />
              {codeError && <p className="ei-code-error-text">⚠️ {codeError}</p>}
            </div>

            <div className="ei-agree-box">
              <label className="ei-checkbox-container">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <span className="ei-checkmark"></span>
                <span className="ei-agree-text">
                  I have read and understood all instructions and agree to follow them.
                </span>
              </label>
            </div>

            <button
              className={`ei-start-btn ${(!agree || !enteredCode.trim() || isVerifying) ? "ei-disabled" : ""}`}
              disabled={!agree || !enteredCode.trim() || isVerifying}
              onClick={startExam}
            >
              {isVerifying ? "Verifying..." : "Start Examination"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamInstructions;
