import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Toast from "../../Common/Toast";
import useToast from "../../Common/useToast";
import PopupModal from "../../Common/PopupModal";
import "./AttemptExamPage.css";
import ProctoringEngine from "../../../proctoring/ProctoringEngine";
import { getStrikes } from "../../../proctoring/rules/StrikeManager";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";

function AttemptExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [isFullscreen, setIsFullscreen] = useState(document.fullscreenElement !== null);
  const [warningCount, setWarningCount] = useState(0);

  const { toasts, showToast, removeToast } = useToast();

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
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    try {
      const student = user || JSON.parse(localStorage.getItem("student") || "{}");
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
    // Only start timer if: not submitted, time is set, AND (not proctored OR is in fullscreen)
    const isGated = proctoringConfig?.enabled && !isFullscreen;
    if (submitted || timeLeft === null || isGated) return;

    if (timeLeft <= 0) {
      submitExam(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line
  }, [timeLeft, submitted, isFullscreen, proctoringConfig?.enabled]);

  const handleAutoSubmit = useCallback(() => {
    submitExam(true);
  }, [submitExam]);

  const handleProctorWarning = useCallback((event) => {
    // Sync warning count from StrikeManager (single source of truth for auto-submit)
    setWarningCount(getStrikes());
    showToast(`⚠️ Proctoring Warning: ${event?.type?.replace(/_/g, " ") || "Please focus on the exam."}`, "warning");
  }, [showToast]);

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

  /* 🖥️ FULLSCREEN ENFORCEMENT */
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      
      if (!isFull && !submittedRef.current && checked.current && proctoringConfig?.enabled) {
        // Log warning on exit only if proctoring is enabled
        showToast("⚠️ Fullscreen exited! This has been logged as a warning.", "error");
        handleProctorWarning({ type: "fullscreen_exit", severity: "medium" });
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [showToast, handleProctorWarning, proctoringConfig?.enabled, submitted]);

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        showToast("Failed to enter fullscreen. Please try again.", "error");
      });
    }
  };

  const stripPrefix = (text) => {
    if (!text) return "";
    return text.replace(/^\s*[([ ]?[A-Da-d][)\]\.]\s*/, "").trim();
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



  const handleProctorReady = useCallback(() => {
    showToast("🛡️ AI Proctoring Initialized & Active", "success", 3000);
  }, [showToast]);

  if (questions.length === 0) {
    return <div className="aep-loading-screen"><div className="aep-spinner"></div></div>;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const currentQuestion = questions[currentIndex];
  const attemptedCount = Object.keys(answers).length;
  const reviewCount = Object.values(reviewStatus).filter(Boolean).length;
  const unattemptedCount = questions.length - attemptedCount;

  return (
    <div className="aep-attempt-exam-layout">
      <Toast toasts={toasts} removeToast={removeToast} />

      {!submitted && proctoringConfig && proctoringConfig.enabled && (
        <ProctoringEngine
          examId={examId}
          studentId={user?.enrollment || JSON.parse(localStorage.getItem("student") || "{}")?.enrollment || "Unknown"}
          config={proctoringConfig}
          onAutoSubmit={handleAutoSubmit}
          onWarning={handleProctorWarning}
          onReady={handleProctorReady}
        />
      )}

      {proctoringConfig?.enabled && !isFullscreen && !submitted && (
        <div className="aep-fullscreen-gate">
          <div className="aep-gate-content">
            <div className="aep-gate-icon">🛡️</div>
            <h1>Fullscreen Required</h1>
            <p>To maintain exam integrity, you must be in fullscreen mode to view and attempt the exam.</p>
            <div className="aep-gate-warning-box">
              Exiting fullscreen or switching tabs will be logged as a violation.
            </div>
            <button className="aep-enter-fullscreen-btn" onClick={enterFullscreen}>
              Enter Fullscreen to Begin
            </button>
          </div>
        </div>
      )}

      <div className="aep-exam-header">
        <div className="aep-header-left">
          <h2 className="aep-exam-title">Online Examination</h2>
        </div>

        {proctoringConfig?.enabled ? (
          <>
            <div className="aep-proctoring-badge-center">
              <div className="aep-pulse-dot"></div>
              <span className="aep-badge-text">AI Proctoring Active</span>
              <div className="aep-badge-divider"></div>
              <span className={`aep-warning-count ${warningCount >= (proctoringConfig?.autoSubmitLimit || 5) - 1 ? 'aep-critical' : ''}`}>
                Warnings: {warningCount}/{proctoringConfig?.autoSubmitLimit || 5}
              </span>
            </div>
            <div className="aep-header-right">
              <div className={`aep-timer-badge ${timeLeft <= 120 ? 'aep-danger-pulse' : ''}`}>
                ⏱️ {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="aep-header-center">
              <div className={`aep-timer-badge ${timeLeft <= 120 ? 'aep-danger-pulse' : ''}`}>
                ⏱️ {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
              </div>
            </div>
            <div className="aep-header-right"></div>
          </>
        )}
      </div>

      <div className="aep-exam-body">
        <div className="aep-main-exam-area">
          <div className="aep-question-container">
            <div className="aep-q-header">
              <span className="aep-q-number">Question {currentIndex + 1} of {questions.length}</span>
              <div className="aep-q-actions">
                <span
                  className={`aep-review-toggle ${reviewStatus[currentQuestion._id] ? 'aep-active' : ''}`}
                  onClick={() => toggleReview(currentQuestion._id)}
                >
                  {reviewStatus[currentQuestion._id] ? '🚩 Marked' : '🏁 Mark for Review'}
                </span>
              </div>
            </div>

            <h3 className="aep-q-text">{currentQuestion.questionText}</h3>

            <div className="aep-options-grid">
              {["A", "B", "C", "D"].map((letter, i) => {
                const rawOption = currentQuestion.options[i];
                if (!rawOption) return null;
                const cleanOption = stripPrefix(rawOption);
                const isSelected = answers[currentQuestion._id] === rawOption;
                return (
                  <div
                    key={i}
                    className={`aep-option-card ${isSelected ? 'aep-selected' : ''}`}
                    onClick={() => handleSelect(currentQuestion._id, rawOption)}
                  >
                    <div className="aep-opt-letter">{letter}</div>
                    <div className="aep-opt-text">{cleanOption}</div>
                    <div className="aep-opt-radio">
                      <div className={`aep-radio-inner ${isSelected ? 'aep-active' : ''}`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="aep-side-panel">
          <div className="aep-status-summary">
            <h3>Exam Status</h3>
            <div className="aep-summary-grid">
              <div className="aep-s-box aep-alt-attempted"><b>{attemptedCount}</b> Answered</div>
              <div className="aep-s-box aep-alt-unattempted"><b>{unattemptedCount}</b> Unanswered</div>
              <div className="aep-s-box aep-alt-review"><b>{reviewCount}</b> Marked</div>
            </div>
          </div>
          <div className="aep-palette-container">
            <h3>Question Palette</h3>
            <div className="aep-palette-grid">
              {questions.map((q, index) => {
                const isAttempted = !!answers[q._id];
                const isReview = !!reviewStatus[q._id];
                const isActive = currentIndex === index;
                const classNames = ["aep-palette-btn", isAttempted ? "aep-answered" : "aep-unanswered", isReview ? "aep-review" : "", isActive ? "aep-current" : ""].filter(Boolean).join(" ");
                return (
                  <button key={q._id} onClick={() => setCurrentIndex(index)} className={classNames}>
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="aep-bottom-nav-bar">
        <div className="aep-nav-group">
          <button className="aep-nav-btn aep-prev" disabled={currentIndex === 0} onClick={prevQuestion}>← Previous</button>
          <button className="aep-nav-btn aep-clear" onClick={() => clearResponse(currentQuestion._id)} disabled={!answers[currentQuestion._id]}>Clear Response</button>
          <button className="aep-nav-btn aep-next" disabled={currentIndex === questions.length - 1} onClick={nextQuestion}>Next →</button>
        </div>
        <button className="aep-submit-exam-btn" onClick={() => setShowSubmitModal(true)}>Submit Exam</button>
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