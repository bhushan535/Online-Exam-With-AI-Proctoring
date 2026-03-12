import { useEffect } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";

export default function GazeDetector({ videoRef, onGaze, config }) {
  useEffect(() => {
    let active = true;
    let faceMesh = null;
    let intervalId = null;

    if (!config.gaze.enabled) return;

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
          refineLandmarks: true, // Required for iris
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results) => {
          if (!active) return;
          
          if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            return;
          }

          const landmarks = results.multiFaceLandmarks[0];
          
          const l33 = landmarks[33]; // left eye outer
          const l133 = landmarks[133]; // left eye inner
          const l468 = landmarks[468]; // left iris center

          const r362 = landmarks[362]; // right eye outer
          const r263 = landmarks[263]; // right eye inner
          const r473 = landmarks[473]; // right iris center

          const getRatio = (outer, inner, iris) => {
            const minX = Math.min(outer.x, inner.x);
            const maxX = Math.max(outer.x, inner.x);
            return (iris.x - minX) / (maxX - minX);
          };

          const leftRatio = getRatio(l33, l133, l468);
          const rightRatio = getRatio(r362, r263, r473);

          const threshold = config.gaze.irisOffsetThreshold;
          let direction = "center";

          if (leftRatio < 0.5 - threshold && rightRatio < 0.5 - threshold) {
            direction = "left";
          } else if (leftRatio > 0.5 + threshold && rightRatio > 0.5 + threshold) {
            direction = "right";
          }

          onGaze(direction);
        });

        intervalId = setInterval(async () => {
          if (active && videoRef.current && videoRef.current.readyState >= 2) {
            await faceMesh.send({ image: videoRef.current });
          }
        }, 200); // Run at 5 FPS

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
  }, [onGaze, videoRef, config]);

  return null; // Renders nothing
}
