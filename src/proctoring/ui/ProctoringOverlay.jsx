import React, { useEffect, useState, useRef } from "react";
import ViolationFlash from "./ViolationFlash";

export default function ProctoringOverlay({ videoRef, warningCount, maxStrikes, lastViolation, proctoringStatus = "initializing" }) {
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupSeverity, setPopupSeverity] = useState(null);
  const [countdown, setCountdown] = useState(8);
  const countdownIntervalRef = useRef(null);
  const [flashSeverity, setFlashSeverity] = useState(null);

  // Sync the small video element with the main invisible videoRef
  const mirrorVideoRef = useRef(null);

  useEffect(() => {
    const syncVideo = () => {
      if (mirrorVideoRef.current && videoRef.current && videoRef.current.srcObject) {
         if (mirrorVideoRef.current.srcObject !== videoRef.current.srcObject) {
           mirrorVideoRef.current.srcObject = videoRef.current.srcObject;
         }
      }
    };

    const syncInterval = setInterval(syncVideo, 500);
    syncVideo();

    return () => clearInterval(syncInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!lastViolation) return;

    setFlashSeverity(lastViolation.severity);
    setTimeout(() => setFlashSeverity(null), 100);

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
      {/* CSS for animations */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes scanLine {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
          .pulse-dot {
            animation: pulse 1.5s infinite;
          }
          .proctor-scan-line {
            position: absolute;
            width: 100%;
            height: 2px;
            background: rgba(255, 255, 255, 0.4);
            box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
            animation: scanLine 3s ease-in-out infinite;
            pointer-events: none;
            z-index: 10;
          }
        `}
      </style>

      {/* Self-View Camera Circle — bottom-left, above the bottom nav bar */}
      <div style={{
        position: "fixed",
        bottom: "80px",     /* Above the bottom nav bar (which is ~60px) */
        left: "20px",
        zIndex: 9999,
        backgroundColor: "#FFFFFF",
        borderRadius: "50%",
        border: "3px solid #171717",
        width: "90px",
        height: "90px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        boxShadow: "5px 5px 0px #171717",
        overflow: "hidden",
      }}>
        <div className="proctor-scan-line" />
        <video 
          ref={mirrorVideoRef}
          autoPlay 
          playsInline 
          muted 
          style={{ 
            width: "100%", 
            height: "100%", 
            backgroundColor: "#000000",
            objectFit: "cover",
            transform: "scaleX(-1)" 
          }} 
        />
        <div style={{
          position: "absolute",
          bottom: "3px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#171717",
          padding: "1px 8px",
          borderRadius: "6px",
          border: "1px solid white",
          whiteSpace: "nowrap"
        }}>
           <span style={{ 
            fontSize: "6px", 
            fontWeight: "900", 
            color: proctoringStatus === "active" ? "#4ade80" : "#FFE66D", 
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            {proctoringStatus === "active" ? "AI: ACTIVE" : "INITIALIZING..."}
          </span>
        </div>
      </div>

      {/* Violation Flash Banner (renders below header) */}
      <ViolationFlash severity={flashSeverity} />

      {/* Notification Card (center) */}
      {showPopup && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10002,
          backgroundColor: popupSeverity === "high" ? "#FFACAC" : "#FFE66D",
          color: "#000000",
          border: "4px solid #000000",
          borderRadius: "24px",
          padding: "32px 40px",
          boxShadow: "10px 10px 0px #000000",
          textAlign: "center",
          fontFamily: "'Outfit', sans-serif",
          pointerEvents: "none",
          minWidth: "350px",
          maxWidth: "90vw"
        }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>
            {popupSeverity === "high" ? "🚫" : "⚠️"}
          </div>
          <h2 style={{ 
            margin: "0 0 12px 0", 
            fontSize: "24px", 
            fontWeight: "900",
            textTransform: "uppercase" 
          }}>
            {popupSeverity === "high" ? "Critical Violation" : "Suspicious Activity"}
          </h2>
          {popupSeverity === "medium" ? (
             <p style={{ margin: 0, fontWeight: "700", fontSize: "16px" }}>{popupMessage}</p>
          ) : (
             <p style={{ margin: 0, fontWeight: "700", fontSize: "16px" }}>
               Serious violation recorded. Exam will auto-submit in {countdown}s...
             </p>
          )}
        </div>
      )}
    </>
  );
}
