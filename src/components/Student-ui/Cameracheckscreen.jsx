import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Cameracheckscreen.css";

function Cameracheckscreen() {
    const { examId } = useParams();
    const navigate = useNavigate();

    const streamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const intervalRef = useRef(null);
    const videoRef = useRef(null);

    const [phase, setPhase] = useState("loading"); // "loading" | "granted" | "denied"
    const [cameraStatus, setCameraStatus] = useState("checking");
    const [micStatus, setMicStatus] = useState("checking");
    const [micLevel, setMicLevel] = useState(0);

    useEffect(() => {
        requestPermissions();
        return () => cleanup();
        // eslint-disable-next-line
    }, []);

    async function requestPermissions() {
        setPhase("loading");
        setCameraStatus("checking");
        setMicStatus("checking");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(() => { });
            }

            setCameraStatus("ready");
            setMicStatus("ready");
            setPhase("granted");

            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioCtx();
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            intervalRef.current = setInterval(() => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i] * dataArray[i];
                }
                const rms = Math.sqrt(sum / dataArray.length);
                const normalized = Math.min(100, Math.round((rms / 128) * 100));
                setMicLevel(normalized);
            }, 200);

        } catch (err) {
            setCameraStatus("blocked");
            setMicStatus("blocked");
            setPhase("denied");
        }
    }

    function cleanup() {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        analyserRef.current = null;
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    }

    const handleProceed = () => {
        cleanup();
        navigate(`/exam-countdown/${examId}`);
    };

    const bothReady = cameraStatus === "ready" && micStatus === "ready";

    const getMicBarColor = () => {
        if (micLevel > 70) return "#ef4444";
        if (micLevel > 40) return "#f59e0b";
        return "#10b981";
    };

    return (
        <div className="camera-check-page">
            <div className="camera-check-card">

                <div className="camera-check-header">
                    <div className="camera-check-icon-ring">🎓</div>
                    <h2>Device Check</h2>
                    <p className="camera-check-subtitle">
                        Please allow camera &amp; microphone access before starting your exam
                    </p>
                </div>

                <div className="camera-check-body">

                    {/* LOADING STATE */}
                    {phase === "loading" && (
                        <div className="camera-check-loading">
                            <div className="cc-spinner"></div>
                            <p className="cc-loading-text">Requesting device permissions...</p>
                            <p className="cc-loading-sub">A browser popup may appear — please click <strong>Allow</strong></p>
                        </div>
                    )}

                    {/* DENIED STATE — with step-by-step instructions + retry button */}
                    {phase === "denied" && (
                        <div className="cc-denied-box">
                            <div className="cc-denied-icon">🚫</div>
                            <h3>Access Blocked</h3>
                            <p>Camera or microphone was blocked. Follow these steps:</p>

                            <div className="cc-steps">
                                <div className="cc-step">
                                    <span className="cc-step-num">1</span>
                                    <span>Click the <strong>🔒 lock icon</strong> in your browser address bar (top left)</span>
                                </div>
                                <div className="cc-step">
                                    <span className="cc-step-num">2</span>
                                    <span>Find <strong>Camera</strong> and set it to <strong>Allow</strong></span>
                                </div>
                                <div className="cc-step">
                                    <span className="cc-step-num">3</span>
                                    <span>Find <strong>Microphone</strong> and set it to <strong>Allow</strong></span>
                                </div>
                                <div className="cc-step">
                                    <span className="cc-step-num">4</span>
                                    <span>Click <strong>Try Again</strong> below — no need to refresh</span>
                                </div>
                            </div>

                            <button className="cc-retry-btn" onClick={requestPermissions}>
                                🔄 Try Again
                            </button>
                        </div>
                    )}

                    {/* GRANTED STATE */}
                    {phase === "granted" && (
                        <>
                            <div className="cc-preview-section">
                                <div className="cc-video-wrapper">
                                    <video
                                        ref={videoRef}
                                        className="cc-video"
                                        autoPlay
                                        muted
                                        playsInline
                                    />
                                    <div className="cc-video-label">📷 Live Preview</div>
                                </div>
                            </div>

                            <div className="cc-status-section">
                                <h3 className="cc-status-title">Device Status</h3>

                                <div className="cc-status-row">
                                    <span className="cc-status-icon">📷</span>
                                    <span className="cc-status-label">Camera</span>
                                    <span className={`cc-status-badge ${cameraStatus}`}>
                                        {cameraStatus === "checking" && "Checking..."}
                                        {cameraStatus === "ready" && "✅ Camera Ready"}
                                        {cameraStatus === "blocked" && "❌ Camera Blocked"}
                                    </span>
                                </div>

                                <div className="cc-status-row">
                                    <span className="cc-status-icon">🎤</span>
                                    <span className="cc-status-label">Microphone</span>
                                    <span className={`cc-status-badge ${micStatus}`}>
                                        {micStatus === "checking" && "Checking..."}
                                        {micStatus === "ready" && "✅ Mic Ready"}
                                        {micStatus === "blocked" && "❌ Mic Blocked"}
                                    </span>
                                </div>

                                <div className="cc-status-row cc-mic-level-row">
                                    <span className="cc-status-icon">🔊</span>
                                    <span className="cc-status-label">Mic Level</span>
                                    <div className="cc-mic-bar-wrapper">
                                        <div
                                            className="cc-mic-bar-fill"
                                            style={{
                                                width: `${micLevel}%`,
                                                backgroundColor: getMicBarColor(),
                                            }}
                                        />
                                        <span className="cc-mic-bar-text">{micLevel}%</span>
                                    </div>
                                </div>

                                <p className="cc-tip">
                                    💡 Speak a few words to test your microphone level above
                                </p>
                            </div>

                            {bothReady && (
                                <div className="cc-ready-banner">
                                    ✅ All devices are working. You may now proceed to your exam.
                                </div>
                            )}

                            <button
                                className={`cc-proceed-btn ${!bothReady ? "disabled" : ""}`}
                                disabled={!bothReady}
                                onClick={handleProceed}
                            >
                                {bothReady ? "Proceed to Exam →" : "Waiting for device access..."}
                            </button>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}

export default Cameracheckscreen;