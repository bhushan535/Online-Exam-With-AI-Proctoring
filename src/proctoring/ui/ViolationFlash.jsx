import React, { useEffect, useState } from "react";

// Full screen colored overlay that appears briefly on violation
// Props: { severity: "medium"|"high"|null }
// Triggers CSS animation when severity changes
// pointer-events: none
// z-index: 9998
export default function ViolationFlash({ severity }) {
  const [flashClass, setFlashClass] = useState("");

  useEffect(() => {
    if (!severity) return;

    if (severity === "medium") {
      setFlashClass("flash-medium");
      const timer = setTimeout(() => setFlashClass(""), 400); // 400ms CSS animation
      return () => clearTimeout(timer);
    } else if (severity === "high") {
      setFlashClass("flash-high");
      const timer = setTimeout(() => setFlashClass(""), 600); // 600ms CSS animation
      return () => clearTimeout(timer);
    }
  }, [severity]);

  if (!flashClass) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9998,
        pointerEvents: "none",
        backgroundColor: flashClass === "flash-medium" ? "rgba(255, 255, 0, 0.3)" : "rgba(255, 0, 0, 0.4)",
        transition: "background-color 0.1s ease-out",
        opacity: 1, // You could add actual keyframes in a real app
      }}
    />
  );
}
