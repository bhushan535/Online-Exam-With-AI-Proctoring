import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ExamStartCountdown.css";

function ExamStartCountdown() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    // Fix B9: Use setTimeout instead of setInterval for exact flow control
    if (seconds <= 0) {
      navigate(`/attempt-exam/${examId}`);
      return;
    }

    const timer = setTimeout(() => {
      setSeconds(s => s - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds, navigate, examId]);

  return (
    <div className="esc-countdown-page">
      <div className="esc-countdown-card">
        <h2>Get Ready...</h2>
        <p className="esc-countdown-sub">Your exam is about to begin</p>
        
        <div className="esc-countdown-circle-container">
          <svg className="esc-countdown-svg" viewBox="0 0 100 100">
            <circle className="esc-bg-circle" cx="50" cy="50" r="45"></circle>
            <circle 
              className="esc-progress-circle" 
              cx="50" cy="50" r="45"
              style={{ 
                strokeDashoffset: (283 - (283 * (seconds / 5))),
                transition: "stroke-dashoffset 1s linear"
              }}
            ></circle>
          </svg>
          <div className="esc-countdown-number">{seconds}</div>
        </div>
        
        <div className="esc-warning-box">
          ⚠️ Please do not refresh, close, or navigate away from this page. 
          The exam will start automatically.
        </div>
      </div>
    </div>
  );
}

export default ExamStartCountdown;