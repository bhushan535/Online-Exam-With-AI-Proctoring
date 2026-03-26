import React, { useEffect, useState } from "react";

// Violation banner that slides down from top, BELOW the header
// Props: { severity: "medium"|"high"|null }
// pointer-events: none
// z-index: 999 (below header at 1000)
export default function ViolationFlash({ severity }) {
  const [flashClass, setFlashClass] = useState("");

  useEffect(() => {
    if (!severity) return;

    if (severity === "medium") {
      setFlashClass("flash-medium");
      const timer = setTimeout(() => setFlashClass(""), 2000);
      return () => clearTimeout(timer);
    } else if (severity === "high") {
      setFlashClass("flash-high");
      const timer = setTimeout(() => setFlashClass(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [severity]);

  if (!flashClass) return null;

  const isHigh = flashClass === "flash-high";

  return (
    <div
      style={{
        position: "fixed",
        top: "70px",       // Below the 70px header
        left: 0,
        width: "100%",
        height: "44px",
        zIndex: 999,       // Below header (1000) so it doesn't cover AI notch or timer
        pointerEvents: "none",
        backgroundColor: isHigh ? "#dc2626" : "#f59e0b",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.3s ease-in-out",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        animation: "slideDownBanner 0.3s ease-out",
      }}
    >
      <style>{`
        @keyframes slideDownBanner {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <span style={{ fontWeight: "800", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {isHigh ? "⚠️ Critical Warning: Prohibited Activity Detected" : "⚠️ Suspicious Activity Detected: Please stay focused"}
      </span>
    </div>
  );
}
