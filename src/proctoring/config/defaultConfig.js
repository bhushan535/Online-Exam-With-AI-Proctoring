export const defaultConfig = {
  snapshotOnMedium: true,     // Capture webcam snapshot for medium violations too

  face: {
    noFaceThresholdMs: 3000,  // 3s without face = violation
    cooldownMs: 15000,        // 15s between face violations
    callbackThrottleMs: 1000, // Max 1 face status update per second
  },

  headPose: {
    lookAwayThresholdMs: 3000,
    lookDownThresholdMs: 4000,  // 4s sustained downward look before violation
    lookDownCooldownMs: 20000,  // 20s cooldown for looking-down violations
    centerResetFrames: 5,       // Need 5 consecutive "center" frames to reset timer
    fpsInterval: 200,           // Run at 5 FPS
  },

  gaze: {
    enabled: true,
    lookAwayThresholdMs: 3000,
    lookDownThresholdMs: 4000,  // 4s for downward gaze (future use)
    lookDownCooldownMs: 20000,  // 20s cooldown for gaze-down (future use)
    irisOffsetThreshold: 0.15,
  },

  audio: {
    enabled: true,
    volumeThresholdDb: 40,
    sustainedMs: 2500,          // Must be loud for 2.5s continuously to count
    cooldownMs: 15000,          // 15s between audio violations
    checkIntervalMs: 500,
  },

  fullscreen: {
    enforced: true,
    maxExitsBeforeViolation: 3,
    forceBackDelayMs: 3000,
  },

  strikes: {
    autoSubmitAt: 5,
    mediumToHighRatio: 2,     // Every 2 medium = 1 high strike
  },

  violations: {
    lowCooldownMs: 15000,     // Low severity: 15s cooldown (log only, no strike)
    mediumCooldownMs: 30000,  // Same medium violation won't re-fire for 30s
    highCooldownMs: 60000,
  },

  tab: {
    cooldownMs: 10000,        // 10s between tab violations
  },

  clipboard: {
    cooldownMs: 10000,        // 10s between paste violations
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
