export const defaultConfig = {
  gracePeriodMs: 30000,       // No violations in first 30 seconds
  snapshotOnMedium: true,     // Capture webcam snapshot for medium violations too

  face: {
    noFaceThresholdMs: 10000, // 10s without face = violation
    callbackThrottleMs: 1000, // Max 1 face status update per second
  },

  headPose: {
    lookAwayThresholdMs: 10000,
    centerResetFrames: 5,     // Need 5 consecutive "center" frames to reset timer
    fpsInterval: 200,         // Run at 5 FPS
  },

  gaze: {
    enabled: true,
    lookAwayThresholdMs: 8000,
    irisOffsetThreshold: 0.15,
  },

  audio: {
    enabled: true,
    volumeThresholdDb: 40,
    sustainedMs: 3000,
    checkIntervalMs: 500,
  },

  fullscreen: {
    enforced: true,
    maxExitsBeforeViolation: 3,
    forceBackDelayMs: 3000,
  },

  strikes: {
    autoSubmitAt: 3,
    mediumToHighRatio: 2,     // Every 2 medium = 1 high strike
  },

  violations: {
    mediumCooldownMs: 30000,  // Same medium violation won't re-fire for 30s
    highCooldownMs: 60000,
  },

  objects: {
    checkIntervalMs: 5000,
    phoneLabels: ["cell phone", "cellphone", "mobile phone", "phone", "remote"],
    bookLabels: ["book", "notebook", "magazine"],
    minConfidence: 0.3,
    sustainedDetectionMs: 5000,
  },

  persons: {
    checkIntervalMs: 5000,
    minConfidence: 0.6,
  },
};
