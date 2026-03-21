import React, { useEffect, useRef } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

/**
 * AIProctoringDetector - Consolidates all MediaPipe logic into a single instance
 * to avoid WASM conflicts (Module.arguments error) and improve performance.
 */
export default function AIProctoringDetector({ videoRef, onFaceStatus, onPose, onGaze, config }) {
  const lastEmitTime = useRef({ face: 0, pose: 0, gaze: 0 });
  const lastState = useRef({ faceCount: 0, poseDir: null, gazeDir: null });

  useEffect(() => {
    let active = true;
    let faceMesh = null;
    let camera = null;
    let isProcessing = false;

    const startDetection = async () => {
      if (!videoRef.current) return;

      try {
        // 1. Initialize FaceMesh (Single Instance)
        faceMesh = new FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 2, // Allow detecting multiple faces
          refineLandmarks: true, // Required for iris/gaze
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        // 2. Handle Results
        faceMesh.onResults((results) => {
          isProcessing = false;
          if (!active) return;
          const now = Date.now();
          const faceCount = results.multiFaceLandmarks ? results.multiFaceLandmarks.length : 0;

          // --- FACE STATUS ---
          if (now - lastEmitTime.current.face >= 1000) {
            lastEmitTime.current.face = now;
            onFaceStatus({ count: faceCount, timestamp: now });
          }

          if (faceCount === 0) return;

          const landmarks = results.multiFaceLandmarks[0];

          // --- HEAD POSE ---
          const nose = landmarks[1];
          const leftEyeInner = landmarks[133];
          const rightEyeInner = landmarks[362];
          const eyeMidX = (leftEyeInner.x + rightEyeInner.x) / 2;
          const eyeMidY = (leftEyeInner.y + rightEyeInner.y) / 2;
          const hDiffX = nose.x - eyeMidX;
          const hDiffY = nose.y - eyeMidY;
          
          let hDir = "center";
          if (hDiffX > 0.035) hDir = "right";
          else if (hDiffX < -0.035) hDir = "left";
          else if (hDiffY > 0.065) hDir = "down";
          else if (hDiffY < -0.045) hDir = "up";

          if (hDir !== lastState.current.poseDir || now - lastEmitTime.current.pose >= 2000) {
            lastState.current.poseDir = hDir;
            lastEmitTime.current.pose = now;
            onPose(hDir);
          }

          // --- GAZE DETECTION ---
          if (config.gaze?.enabled) {
            const l33 = landmarks[33]; 
            const l133 = landmarks[133];
            const l468 = landmarks[468]; // left iris
            const r362 = landmarks[362]; 
            const r263 = landmarks[263];
            const r473 = landmarks[473]; // right iris

            const getRatio = (outer, inner, iris) => {
                const minX = Math.min(outer.x, inner.x);
                const maxX = Math.max(outer.x, inner.x);
                return (iris.x - minX) / (maxX - minX);
            };

            const lRatio = getRatio(l33, l133, l468);
            const rRatio = getRatio(r362, r263, r473);
            const gThreshold = config.gaze.irisOffsetThreshold || 0.15;
            
            let gDir = "center";
            if (lRatio < 0.5 - gThreshold && rRatio < 0.5 - gThreshold) gDir = "left";
            else if (lRatio > 0.5 + gThreshold && rRatio > 0.5 + gThreshold) gDir = "right";

            if (gDir !== lastState.current.gazeDir || now - lastEmitTime.current.gaze >= 2000) {
              lastState.current.gazeDir = gDir;
              lastEmitTime.current.gaze = now;
              onGaze(gDir);
            }
          }
        });

        // 3. Start Camera
        camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (!active || isProcessing || !videoRef.current) return;
            if (videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0) return;

            try {
              isProcessing = true;
              await faceMesh.send({ image: videoRef.current });
            } catch (err) {
              isProcessing = false;
              // Ignore transient frame errors
            }
          },
          width: 640,
          height: 480,
        });

        await camera.start();
      } catch (err) {
        console.error("AIProctoringDetector Init Error:", err);
      }
    };

    startDetection();

    return () => {
      active = false;
      if (camera) camera.stop();
      if (faceMesh) faceMesh.close();
      
      const videoEl = videoRef.current;
      if (videoEl && videoEl.srcObject) {
         videoEl.srcObject.getTracks().forEach(track => track.stop());
         videoEl.srcObject = null;
      }
    };
  }, [onFaceStatus, onPose, onGaze, videoRef, config]);

  return (
    <video
      ref={videoRef}
      style={{ display: "none" }}
      playsInline
      muted
      autoPlay
    />
  );
}
