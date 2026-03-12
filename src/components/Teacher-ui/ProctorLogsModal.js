import React, { useEffect, useState } from "react";
import "./ProctorLogsModal.css";

function ProctorLogsModal({ isOpen, onClose, examId, studentId, studentName }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && examId && studentId) {
      setLoading(true);
      setError(null);
      fetch(`${process.env.REACT_APP_API_URL}/api/violations/${examId}/${studentId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setLogs(data);
          } else {
            setLogs([]);
          }
        })
        .catch(err => {
          console.error("Error fetching proctor logs:", err);
          setError("Failed to load logs");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, examId, studentId]);

  if (!isOpen) return null;

  return (
    <div className="plm-overlay">
      <div className="plm-modal">
        <div className="plm-header">
          <h2>Proctoring Logs: {studentName} ({studentId})</h2>
          <button className="plm-close" onClick={onClose}>&times;</button>
        </div>
        <div className="plm-content">
          {loading && <p>Loading logs...</p>}
          {error && <p className="plm-error">{error}</p>}
          {!loading && !error && logs.length === 0 && (
            <p className="plm-empty">No proctoring violations recorded. Clean exam! 🎉</p>
          )}
          {!loading && !error && logs.length > 0 && (
            <div className="plm-logs-list">
              {logs.map(log => (
                <div key={log._id} className={`plm-log-item severity-${log.severity}`}>
                  <div className="plm-log-main">
                    <span className="plm-log-type">{log.type.toUpperCase()}</span>
                    <span className="plm-log-time">{new Date(log.timestamp).toLocaleString()}</span>
                    <span className="plm-log-severity">{log.severity.toUpperCase()}</span>
                  </div>
                  {log.meta && Object.keys(log.meta).length > 0 && (
                    <div className="plm-log-meta">
                      {Object.entries(log.meta)
                        .filter(([_, v]) => v !== null)
                        .map(([k, v]) => (
                        <span key={k}><b>{k}:</b> {v} </span>
                      ))}
                    </div>
                  )}
                  {log.snapshot && (
                    <img src={log.snapshot} alt="Violation Snapshot" className="plm-snapshot" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProctorLogsModal;
