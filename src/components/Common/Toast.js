import React from "react";
import "./Toast.css";

function Toast({ toasts, removeToast }) {
  return (
    <div className="toast-wrapper">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">
            {t.type === "success" && "✅"}
            {t.type === "error"   && "❌"}
            {t.type === "warning" && "⚠️"}
            {t.type === "info"    && "ℹ️"}
          </span>
          <span className="toast-msg">{t.message}</span>
          <button className="toast-x" onClick={() => removeToast(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

export default Toast;
