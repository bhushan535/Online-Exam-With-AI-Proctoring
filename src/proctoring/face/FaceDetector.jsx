import React, { useEffect, useRef } from "react";
import { FaceDetection } from "@mediapipe/face_detection";
import { Camera } from "@mediapipe/camera_utils";

export default function FaceDetector({ onFaceStatus, videoRef }) {
  const lastCallTimeRef = useRef(0);
  
  // Inline throttle helper
  const throttledOnFaceStatus = (status) => {
    const now = Date.now();
    // Max 1 face status update per second
    if (now - lastCallTimeRef.current >= 1000) {
      lastCallTimeRef.current = now;
      onFaceStatus(status);
    }
  };

  useEffect(() => {
    const videoEl = videoRef.current;
    let active = true;
    let camera = null;
    let faceDetection = null;

    const startDetection = async () => {
      if (!videoRef.current) return;

      try {
        faceDetection = new FaceDetection({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/${file}`,
        });

        faceDetection.setOptions({
          model: "short",
          minDetectionConfidence: 0.5,
        });

        faceDetection.onResults((results) => {
          if (!active) return;
          const count = results.detections ? results.detections.length : 0;
          throttledOnFaceStatus({ count, timestamp: Date.now() });
        });

        camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (active && videoRef.current) {
              await faceDetection.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });

        await camera.start();
      } catch (err) {
        // Fail silently
      }
    };

    startDetection();

    return () => {
      active = false;
      if (camera) {
        camera.stop();
      }
      if (videoEl && videoEl.srcObject) {
        const tracks = videoEl.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        videoEl.srcObject = null;
      }
      if (faceDetection) {
        faceDetection.close();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // This is the ONLY place the <video> element exists in the whole system
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