import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Toast from "../../Common/Toast";
import useToast from "../../Common/useToast";
import PopupModal from "../../Common/PopupModal";
import "./AttemptExamPage.css";
import ProctoringEngine from "../../../proctoring/ProctoringEngine";
import axios from "axios";
import { BASE_URL } from '../../../config';

function AttemptExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const checked = useRef(false);
  const submittedRef = useRef(false); // prevents double-submit race condition

  const [questions, setQuestions] = useState([]);
  const [proctoringConfig, setProctoringConfig] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [reviewStatus, setReviewStatus] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const { toasts, showToast, removeToast } = useToast();

  /* 🔐 Instruction Check */
  useEffect(() => {
    if (checked.current) return;
    const accepted = localStorage.getItem("instructionAccepted");
    if (accepted !== examId) {
      navigate("/attempt-exams");
    }
    checked.current = true;
  }, [examId, navigate]);

  /* 📥 Fetch Exam + Questions */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const examRes = await axios.get(`/api/exams/${examId}`);
        const exam = examRes.data;

        if (!exam || exam.success === false) {
          showToast("Exam not found. Redirecting...", "error");
          setTimeout(() => navigate("/attempt-exams"), 1500);
          return;
        }

        setProctoringConfig(exam.proctoringConfig);
        setTimeLeft(exam.duration * 60);

        const res = await axios.get(`/api/questions/${examId}`);
        setQuestions(res.data);
      } catch (err) {
        console.error("Fetch exam details error:", err);
        showToast("Failed to load exam. Please try again.", "error");
        setTimeout(() => navigate("/attempt-exams"), 1500);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, [examId]);

  /* ⏳ TIMER */
  useEffect(() => {
    if (submitted || timeLeft === null) return;
    if (timeLeft <= 0) {
      submitExam(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line
  }, [timeLeft, submitted]);

  /* 🚫 PREVENT REFRESH */
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!submittedRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const stripPrefix = (text) => {
    if (!text) return "";
    return text.replace(/^\s*[\(\[]?[A-Da-d][\)\]\.]\s*/, "").trim();
  };

  const handleSelect = (qid, option) => {
    setAnswers(prev => ({ ...prev, [qid]: option }));
  };

  const clearResponse = (qid) => {
    setAnswers(prev => {
      const newA = { ...prev };
      delete newA[qid];
      return newA;
    });
  };

  const toggleReview = (qid) => {
    setReviewStatus(prev => ({ ...prev, [qid]: !prev[qid] }));
  };

  const prevQuestion = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };
  const nextQuestion = () => { if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1); };

  /* 🔇 STOP ALL MEDIA — camera + mic off after submit */
  const stopAllMedia = () => {
    const videos = document.querySelectorAll("video");
    videos.forEach(video => {
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
    });
    // Signal AudioDetector to cleanup
    window.dispatchEvent(new CustomEvent("proctor:stop"));
  };

  /* ✅ SUBMIT EXAM */
  const submitExam = useCallback(async (auto = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);

    localStorage.removeItem("instructionAccepted");
    stopAllMedia();

    try {
      const student = JSON.parse(localStorage.getItem("student")) || {};
      const res = await axios.post("/api/exams/submit", {
        examId,
        answers,
        studentId: student.enrollment || "Unknown"
      });

      const result = res.data;
      const score = result.score ?? "?";
      const total = result.total ?? questions.length;

      if (auto) {
        showToast(`⏰ Time up! Auto-submitted. Score: ${score}/${total}`, "warning", 5000);
      } else {
        showToast(`🎉 Submitted! Score: ${score}/${total}`, "success", 4000);
      }
    } catch (err) {
      console.error("Submit error:", err);
      showToast(auto ? "⏰ Time is up! Exam auto-submitted." : "🎉 Exam submitted successfully!", auto ? "warning" : "success", 5000);
    }

    setTimeout(() => navigate("/StudentResults"), 2500);
    // eslint-disable-next-line
  }, [answers, examId, questions.length, navigate]);

  if (questions.length === 0) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const currentQuestion = questions[currentIndex];
  const attemptedCount = Object.keys(answers).length;
  const reviewCount = Object.values(reviewStatus).filter(Boolean).length;
  const unattemptedCount = questions.length - attemptedCount;

  return (
    <div className="attempt-exam-layout">
      <Toast toasts={toasts} removeToast={removeToast} />

      {!submitted && proctoringConfig && proctoringConfig.enabled && (
        <ProctoringEngine
          examId={examId}
          studentId={JSON.parse(localStorage.getItem("student"))?.enrollment || "Unknown"}
          config={proctoringConfig}
          onAutoSubmit={() => submitExam(true)}
          onWarning={(event) => showToast("⚠️ Proctoring Warning: Please focus on the exam.", "warning")}
        />
      )}

      <div className="main-exam-area">
        <div className="exam-header">
          <h2 className="exam-title">Online Examination</h2>
          <div className={`timer-badge ${timeLeft <= 120 ? 'danger-pulse' : ''}`}>
            ⏱️ {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </div>
        </div>

        <div className="question-container">
          <div className="q-header">
            <span className="q-number">Question {currentIndex + 1} of {questions.length}</span>
            <div className="q-actions">
              <span
                className={`review-toggle ${reviewStatus[currentQuestion._id] ? 'active' : ''}`}
                onClick={() => toggleReview(currentQuestion._id)}
              >
                {reviewStatus[currentQuestion._id] ? '🚩 Marked' : '🏁 Mark for Review'}
              </span>
            </div>
          </div>

          <h3 className="q-text">{currentQuestion.questionText}</h3>

          <div className="options-grid">
            {["A", "B", "C", "D"].map((letter, i) => {
              const rawOption = currentQuestion.options[i];
              if (!rawOption) return null;
              const cleanOption = stripPrefix(rawOption);
              const isSelected = answers[currentQuestion._id] === rawOption;
              return (
                <div
                  key={i}
                  className={`option-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(currentQuestion._id, rawOption)}
                >
                  <div className="opt-letter">{letter}</div>
                  <div className="opt-text">{cleanOption}</div>
                  <div className="opt-radio">
                    <div className={`radio-inner ${isSelected ? 'active' : ''}`}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bottom-nav-bar">
          <div className="nav-group">
            <button className="nav-btn prev" disabled={currentIndex === 0} onClick={prevQuestion}>← Previous</button>
            <button className="nav-btn clear" onClick={() => clearResponse(currentQuestion._id)} disabled={!answers[currentQuestion._id]}>Clear Response</button>
            <button className="nav-btn next" disabled={currentIndex === questions.length - 1} onClick={nextQuestion}>Next →</button>
          </div>
          <button className="submit-exam-btn" onClick={() => setShowSubmitModal(true)}>Submit Exam</button>
        </div>
      </div>

      <div className="side-panel">
        <div className="status-summary">
          <h3>Exam Status</h3>
          <div className="summary-grid">
            <div className="s-box alt-attempted"><b>{attemptedCount}</b> Answered</div>
            <div className="s-box alt-unattempted"><b>{unattemptedCount}</b> Unanswered</div>
            <div className="s-box alt-review"><b>{reviewCount}</b> Marked</div>
          </div>
        </div>
        <div className="palette-container">
          <h3>Question Palette</h3>
          <div className="palette-grid">
            {questions.map((q, index) => {
              const isAttempted = !!answers[q._id];
              const isReview = !!reviewStatus[q._id];
              const isActive = currentIndex === index;
              const classNames = ["palette-btn", isAttempted ? "answered" : "unanswered", isReview ? "review" : "", isActive ? "current" : ""].filter(Boolean).join(" ");
              return (
                <button key={q._id} onClick={() => setCurrentIndex(index)} className={classNames}>
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <PopupModal
        isOpen={showSubmitModal}
        type="warning"
        title="Submit Exam?"
        message="Once submitted, you cannot change your answers."
        details={[
          { icon: "✅", label: "Answered", value: `${attemptedCount} questions`, color: "#16a34a" },
          { icon: "❌", label: "Not Answered", value: `${unattemptedCount} questions`, color: "#dc2626" },
        ]}
        confirmText="Yes, Submit"
        cancelText="Go Back"
        confirmColor="#16a34a"
        onConfirm={() => { setShowSubmitModal(false); submitExam(false); }}
        onCancel={() => setShowSubmitModal(false)}
      />
    </div>
  );
}

export default AttemptExamPage;