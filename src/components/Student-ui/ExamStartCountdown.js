import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ExamStartCountdown.css";

function ExamStartCountdown() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s - 1);
    }, 1000);

    if (seconds === 0) {
      clearInterval(timer);
      navigate(`/attempt-exam/${examId}`);
    }

    return () => clearInterval(timer);
  }, [seconds, navigate, examId]);

  return (
    <div className="countdown-page">
      <h2>Exam is starting in</h2>
      <div className="countdown-circle">{seconds}</div>
      <p>Please do not refresh or navigate away</p>
    </div>
  );
}

export default ExamStartCountdown;