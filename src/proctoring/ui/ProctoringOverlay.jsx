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
    const syncVideo = () => {
      if (mirrorVideoRef.current && videoRef.current && videoRef.current.srcObject) {
         if (mirrorVideoRef.current.srcObject !== videoRef.current.srcObject) {
           mirrorVideoRef.current.srcObject = videoRef.current.srcObject;
         }
      }
    };

    // Check every 500ms until synced
    const syncInterval = setInterval(syncVideo, 500);
    
    // Also try immediately
    syncVideo();

    return () => clearInterval(syncInterval);
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
          .scan-line {
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

      {/* 1. Header Banner */}
      <div style={{
        position: "fixed",
        top: "12px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#FFFFFF",
        color: "#000000",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "20px",
        padding: "10px 24px",
        borderRadius: "40px",
        border: "3px solid #000000",
        boxShadow: "6px 6px 0px #000000",
        fontFamily: "'Outfit', sans-serif",
        fontSize: "14px",
        fontWeight: "800",
        pointerEvents: "none",
        minWidth: "320px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="pulse-dot" style={{ 
            width: "12px", 
            height: "12px", 
            backgroundColor: "#FF3B3B", 
            borderRadius: "50%",
            border: "2px solid black" 
          }} />
          <span style={{ letterSpacing: "0.5px", textTransform: "uppercase" }}>AI Proctoring Active</span>
        </div>
        <div style={{ 
          height: "20px", 
          width: "2px", 
          backgroundColor: "#000000",
          opacity: 0.2
        }} />
        <div style={{ 
          color: warningCount >= maxStrikes - 1 ? "#FF3B3B" : "#000000",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          <span style={{ fontSize: "16px" }}>⚠️</span>
          <span>Warnings: {warningCount}/{maxStrikes}</span>
        </div>
      </div>

      {/* 2. Self-View Circle (lower right) */}
      <div style={{
        position: "fixed",
        bottom: "34px",
        right: "34px",
        zIndex: 9999,
        backgroundColor: "#FFFFFF",
        borderRadius: "50%",
        border: "4px solid #171717",
        width: "110px",
        height: "110px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        boxShadow: "8px 8px 0px #171717",
        overflow: "hidden",
        transform: "rotate(-2deg)" 
      }}>
        <div className="scan-line" />
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
          bottom: "4px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#171717",
          padding: "2px 10px",
          borderRadius: "8px",
          border: "1px solid white",
          whiteSpace: "nowrap"
        }}>
           <span style={{ 
            fontSize: "7px", 
            fontWeight: "900", 
            color: "#FFFFFF", 
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}>
            AI: ACTIVE
          </span>
        </div>
      </div>

      {/* 3. Violation Flash */}
      <ViolationFlash severity={flashSeverity} />

      {/* 4. Notification Card (center) */}
      {showPopup && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10000,
          backgroundColor: popupSeverity === "high" ? "#FFACAC" : "#FFE66D",
          color: "#000000",
          border: "4px solid #000000",
          borderRadius: "24px",
          padding: "32px 40px",
          boxShadow: "10px 10px 0px #000000",
          textAlign: "center",
          fontFamily: "'Outfit', sans-serif",
          pointerEvents: "none",
          minWidth: "350px"
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
