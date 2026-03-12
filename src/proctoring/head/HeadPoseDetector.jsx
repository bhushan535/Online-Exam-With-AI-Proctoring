import { useEffect, useRef } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";

export default function HeadPoseDetector({ videoRef, onPose, config }) {
  const lastEmitTime = useRef(0);
  const lastDirection = useRef(null);

  useEffect(() => {
    let active = true;
    let faceMesh = null;
    let intervalId = null;

    const initDetector = async () => {
      // Wait for video ready
      let attempts = 0;
      while (
        active &&
        !(videoRef.current?.readyState >= 2 && videoRef.current?.videoWidth > 0) &&
        attempts < 50 // 5 seconds (50 * 100ms)
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (!active || attempts >= 50) return;

      try {
        faceMesh = new FaceMesh({
          locateFile: (file) => `${process.env.PUBLIC_URL}/mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results) => {
          if (!active) return;
          
          if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            // CRITICAL: Do NOT call onPose("no_face") when no landmarks found — just return
            return;
          }

          const landmarks = results.multiFaceLandmarks[0];
          const nose = landmarks[1];
          const leftEye = landmarks[33];
          const rightEye = landmarks[263];

          const eyeMidX = (leftEye.x + rightEye.x) / 2;
          const eyeMidY = (leftEye.y + rightEye.y) / 2;

          const diffX = nose.x - eyeMidX;
          const diffY = nose.y - eyeMidY;

          let direction = "center";

          if (diffX > 0.03) direction = "right";
          else if (diffX < -0.03) direction = "left";
          else if (diffY > 0.06) direction = "down";
          else if (diffY < -0.04) direction = "up";

          const now = Date.now();
          const changed = direction !== lastDirection.current;
          const timeSinceEmit = now - lastEmitTime.current;

          // CRITICAL: Only emit when direction changes OR 2 seconds have passed since last emit
          if (changed || timeSinceEmit >= 2000) {
            lastDirection.current = direction;
            lastEmitTime.current = now;
            onPose(direction);
          }
        });

        intervalId = setInterval(async () => {
          if (active && videoRef.current && videoRef.current.readyState >= 2) {
            await faceMesh.send({ image: videoRef.current });
          }
        }, config.headPose.fpsInterval); // 200ms

      } catch (err) {
         // Fail silently
      }
    };

    initDetector();

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
      if (faceMesh) faceMesh.close();
    };
  }, [onPose, videoRef, config]);

  return null; // Renders nothing
}