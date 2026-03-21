import React, { useEffect, useRef, useState, useMemo } from "react";
import { defaultConfig } from "./config/defaultConfig";
import AIProctoringDetector from "./AIProctoringDetector";
import ProctoringOverlay from "./ui/ProctoringOverlay";
import { captureFrame } from "./utils/captureFrame";
import { evaluateFaceRules } from "./rules/faceRules";
import { evaluateHeadPose } from "./rules/headPoseRules";
import { evaluateGaze } from "./rules/gazeRules";
import { evaluateObjectRules } from "./rules/objectRules";
import { processViolation } from "./rules/ViolationEngine";
import { handleViolationAction } from "./actions/AutoActionEngine";
import { logViolation } from "./actions/ViolationLogger";
import { initTabDetector, destroyTabDetector } from "./tab/TabDetector";
import { detectPersons } from "./person/PersonDetector";
import { detectObjects } from "./object/ObjectDetector";
import { initAudioDetector, stopAudioDetector } from "./audio/AudioDetector";
import { initFullscreen, destroyFullscreen } from "./security/FullscreenManager";
import { initKeyboardBlocker, destroyKeyboardBlocker } from "./security/KeyboardBlocker";
import { initClipboardBlocker, destroyClipboardBlocker } from "./security/ClipboardBlocker";
import { initMultiMonitorDetector, destroyMultiMonitorDetector } from "./security/MultiMonitorDetector";
import { initDevToolsDetector, destroyDevToolsDetector } from "./security/DevToolsDetector";

export default function ProctoringEngine({ examId, studentId, config = {}, onAutoSubmit, onWarning }) {
  const videoRef = useRef(null);
  const examStartRef = useRef(Date.now());
  const [warningCount, setWarningCount] = useState(0);
  const [lastViolation, setLastViolation] = useState(null);

  const mergedConfig = useMemo(() => {
    const base = {
      ...defaultConfig,
      ...config,
      face: { ...defaultConfig.face, ...config.face },
      headPose: { ...defaultConfig.headPose, ...config.headPose },
      gaze: { ...defaultConfig.gaze, ...config.gaze },
      audio: { ...defaultConfig.audio, ...config.audio },
      fullscreen: { ...defaultConfig.fullscreen, ...config.fullscreen },
      strikes: { ...defaultConfig.strikes, ...config.strikes },
      violations: { ...defaultConfig.violations, ...config.violations },
      objects: { ...defaultConfig.objects, ...config.objects },
      persons: { ...defaultConfig.persons, ...config.persons },
    };

    // Override with granular proctoring configuration if present
    if (config) {
      if (config.autoSubmitLimit > 0) {
        base.strikes.autoSubmitAt = config.autoSubmitLimit;
      } else if (config.autoSubmitLimit === 0) {
        base.strikes.autoSubmitAt = 999; // Effectively disabled
      }
      
      if (config.requireFullScreen !== undefined) {
        base.fullscreen.enforced = config.requireFullScreen;
      }
      
      // We'll use warningLimit to control some internal logic if needed
      // For now mapping autoSubmitLimit to autoSubmitAt is the primary 
    }

    return base;
  }, [config]);

  const submitExam = () => onAutoSubmit?.();
  const warnStudent = (msg) => onWarning?.(msg);

  const handleFinalViolation = async (event) => {
    if (!event) return;

    // 1. GRACE PERIOD check
    if (Date.now() - examStartRef.current < mergedConfig.gracePeriodMs) {
      return;
    }

    // 2. Snapshot
    const snapshot = captureFrame(videoRef.current);

    // 3. Log to backend
    await logViolation({
      event,
      examId,
      studentId,
      snapshot,
      config: mergedConfig
    });

    // 4. Action Engine (Strikes & UI Events)
    handleViolationAction(event, { warnStudent, submitExam }, mergedConfig);

    // 5 & 6. Update local UI state
    if (event.severity === "medium" || event.severity === "high") {
      setLastViolation(event);
      if (event.severity === "medium") {
        setWarningCount(prev => prev + 1);
      } else if (event.severity === "high") {
        setWarningCount(prev => prev + 2); // High equals 2 strikes roughly in count display 
      }
    }

    // 7. Parent callback
    onWarning?.(event);
  };

  const processRawEvent = (rawEvents) => {
    if (!rawEvents) return;
    const events = Array.isArray(rawEvents) ? rawEvents : [rawEvents];

    events.forEach(event => {
      const finalEvent = processViolation(event, mergedConfig);
      if (finalEvent) handleFinalViolation(finalEvent);
    });
  };

  // Status Handlers
  const handleFaceStatus = (status) => {
    const rules = evaluateFaceRules(status);
    processRawEvent(rules);
  };

  const handleHeadPose = (direction) => {
    const rule = evaluateHeadPose(direction, mergedConfig);
    processRawEvent(rule);
  };

  const handleGaze = (direction) => {
    const rule = evaluateGaze(direction, mergedConfig);
    processRawEvent(rule);
  };

  const handleSecurityViolation = (event) => {
    processRawEvent(event);
  };

  // Mount/Unmount effect for security detectors
  useEffect(() => {
    if (config?.enabled === false) return;

    let active = true;

    if (config?.disableTabSwitching !== false) {
      initTabDetector(handleSecurityViolation);
    }
    
    if (mergedConfig.fullscreen.enforced) {
       initFullscreen(handleSecurityViolation, mergedConfig);
    }

    initKeyboardBlocker(handleSecurityViolation);
    initClipboardBlocker(handleSecurityViolation);
    initMultiMonitorDetector(handleSecurityViolation);
    initDevToolsDetector(handleSecurityViolation);

    if (mergedConfig.audio.enabled) {
      initAudioDetector(handleSecurityViolation, mergedConfig);
    }

    // Interval detectors
    const personInterval = setInterval(async () => {
      if (!active || !videoRef.current) return;
      const count = await detectPersons(videoRef.current);
      if (count > 1) {
        processRawEvent({ type: "multi_face", severity: "high", count });
      }
    }, mergedConfig.persons.checkIntervalMs);

    const objectInterval = setInterval(async () => {
      if (!active || !videoRef.current) return;
      const objects = await detectObjects(videoRef.current, mergedConfig);
      if (objects && objects.length > 0) {
        const violation = evaluateObjectRules(objects, mergedConfig);
        processRawEvent(violation);
      }
    }, mergedConfig.objects.checkIntervalMs);

    return () => {
      active = false;
      clearInterval(personInterval);
      clearInterval(objectInterval);

      destroyTabDetector();
      destroyFullscreen();
      destroyKeyboardBlocker();
      destroyClipboardBlocker();
      destroyMultiMonitorDetector();
      destroyDevToolsDetector();
      stopAudioDetector();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (config && config.enabled === false) {
    return null;
  }

  return (
    <>
      <AIProctoringDetector 
        videoRef={videoRef} 
        onFaceStatus={handleFaceStatus}
        onPose={handleHeadPose} 
        onGaze={handleGaze} 
        config={mergedConfig} 
      />

      <ProctoringOverlay
        videoRef={videoRef}
        warningCount={warningCount}
        maxStrikes={mergedConfig.strikes.autoSubmitAt}
        lastViolation={lastViolation}
      />
    </>
  );
}
