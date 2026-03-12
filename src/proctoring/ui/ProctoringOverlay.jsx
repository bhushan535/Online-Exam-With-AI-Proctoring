import React, { useEffect, useState, useRef } from "react";
import ViolationFlash from "./ViolationFlash";

export default function ProctoringOverlay({ videoRef, warningCount, maxStrikes, lastViolation }) {
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupSeverity, setPopupSeverity] = useState(null);
  const [countdown, setCountdown] = useState(8);
  const countdownIntervalRef = useRef(null);
  const [flashSeverity, setFlashSeverity] = useState(null);

  // Sync the small video element with the main invisible videoRef
  const mirrorVideoRef = useRef(null);

  useEffect(() => {
    if (mirrorVideoRef.current && videoRef.current && videoRef.current.srcObject) {
      mirrorVideoRef.current.srcObject = videoRef.current.srcObject;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!lastViolation) return;

    setFlashSeverity(lastViolation.severity);
    setTimeout(() => setFlashSeverity(null), 100); // Reset immediately so next triggers

    if (lastViolation.severity === "medium") {
      setPopupSeverity("medium");
      setPopupMessage("⚠️ Suspicious activity detected. Stay focused.");
      setShowPopup(true);
      
      setTimeout(() => {
        setShowPopup(false);
      }, 4000);
      
    } else if (lastViolation.severity === "high") {
      setPopupSeverity("high");
      setCountdown(8);
      setShowPopup(true);
      
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [lastViolation]);

  return (
    <>
      {/* CSS for pulsing animation */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
          }
          .pulse-dot {
            animation: pulse 1.5s infinite;
          }
        `}
      </style>

      {/* 1. Warning Banner (top) */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "white",
        zIndex: 9999,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 24px",
        fontFamily: "sans-serif",
        fontSize: "14px",
        fontWeight: "bold",
        pointerEvents: "none"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="pulse-dot" style={{ width: "10px", height: "10px", backgroundColor: "#ef4444", borderRadius: "50%" }} />
          <span>AI Proctoring Active</span>
        </div>
        <div style={{ color: warningCount >= maxStrikes - 1 ? "#ef4444" : "#facc15" }}>
          ⚠️ Warnings: {warningCount}/{maxStrikes}
        </div>
      </div>

      {/* 2. Live Self-View (bottom-right) */}
      <div style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        backgroundColor: "white",
        borderRadius: "8px",
        border: "2px solid #ef4444",
        padding: "4px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      }}>
        <video 
          ref={mirrorVideoRef}
          autoPlay 
          playsInline 
          muted 
          style={{ 
            width: "80px", 
            height: "60px", 
            borderRadius: "4px", 
            backgroundColor: "black",
            objectFit: "cover",
            transform: "scaleX(-1)" // Mirror effect
          }} 
        />
        <span style={{ 
          fontSize: "9px", 
          fontWeight: "900", 
          color: "#ef4444", 
          marginTop: "4px",
          letterSpacing: "0.5px"
        }}>
          YOU ARE BEING WATCHED
        </span>
      </div>

      {/* 3. Violation Flash */}
      <ViolationFlash severity={flashSeverity} />

      {/* 4. Warning Popup (center) */}
      {showPopup && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10000,
          backgroundColor: popupSeverity === "high" ? "#fee2e2" : "#fef9c3",
          color: popupSeverity === "high" ? "#991b1b" : "#854d0e",
          border: `2px solid ${popupSeverity === "high" ? "#ef4444" : "#eab308"}`,
          borderRadius: "8px",
          padding: "24px 32px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          textAlign: "center",
          fontFamily: "sans-serif",
          pointerEvents: "none",
          minWidth: "300px"
        }}>
          <h2 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>
            {popupSeverity === "high" ? "🚫 Serious Violation" : "⚠️ Warning"}
          </h2>
          {popupSeverity === "medium" ? (
             <p style={{ margin: 0, fontWeight: "500" }}>{popupMessage}</p>
          ) : (
             <p style={{ margin: 0, fontWeight: "500" }}>
               🚫 Serious violation recorded. Exam submitting in {countdown}s...
             </p>
          )}
        </div>
      )}
    </>
  );
}
