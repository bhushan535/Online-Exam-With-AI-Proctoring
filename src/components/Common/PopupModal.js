import React, { useEffect } from "react";
import "./PopupModal.css";

function PopupModal({
  isOpen,
  type = "confirm",
  title,
  message,
  details,
  confirmText = "OK",
  cancelText  = "Cancel",
  confirmColor,
  onConfirm,
  onCancel,
  showCancel = true,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape" && onCancel) onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const icons = { confirm:"❓", success:"✅", error:"❌", warning:"⚠️", info:"ℹ️" };
  const defaultColors = {
    confirm:"#3b82f6", success:"#16a34a",
    error:"#dc2626",   warning:"#d97706", info:"#3b82f6"
  };
  const btnColor = confirmColor || defaultColors[type];

  return (
    <div className="pm-overlay" onClick={onCancel}>
      <div className="pm-card" onClick={(e) => e.stopPropagation()}>
        <div className={`pm-icon-circle pm-icon-${type}`}>
          {icons[type]}
        </div>
        <h3 className="pm-title">{title}</h3>
        {message && <p className="pm-message">{message}</p>}
        {details && details.length > 0 && (
          <div className="pm-details">
            {details.map((d, i) => (
              <div key={i} className="pm-detail-row">
                <span className="pm-d-icon">{d.icon}</span>
                <span className="pm-d-label">{d.label}</span>
                <span className="pm-d-value" style={{ color: d.color || "#1f2937" }}>
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="pm-btns">
          {showCancel && onCancel && (
            <button className="pm-btn pm-btn-cancel" onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button
            className="pm-btn pm-btn-confirm"
            style={{ background: btnColor }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PopupModal;
