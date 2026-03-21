import React, { useEffect, useState } from "react";
import "./ProctorLogsModal.css";
import { BASE_URL } from '../../../config';

function ProctorLogsModal({ isOpen, onClose, examId, studentId, studentName }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && examId && studentId) {
      setLoading(true);
      setError(null);
      fetch(`${BASE_URL}/violations/${examId}/${studentId}`)
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
                    <span className="plm-log-type">{log.type.replace(/_/g, " ").toUpperCase()}</span>
                    <span className="plm-log-severity">{log.severity.toUpperCase()}</span>
                  </div>
                  <div className="plm-log-time">
                    📅 {new Date(log.timestamp).toLocaleDateString()} 
                    &nbsp;&nbsp; 🕒 {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  {log.meta && Object.keys(log.meta).length > 0 && (
                    <div className="plm-log-meta">
                      {Object.entries(log.meta)
                        .filter(([_, v]) => v !== null)
                        .map(([k, v]) => (
                        <div key={k} className="meta-badge">
                          <b>{k}:</b> {typeof v === 'number' ? v.toFixed(2) : v}
                        </div>
                      ))}
                    </div>
                  )}
                  {log.snapshot && (
                    <div className="plm-snapshot-container">
                      <img src={log.snapshot} alt="Violation Snapshot" className="plm-snapshot" />
                      <div className="snapshot-overlay">Evidence Snapshot</div>
                    </div>
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
