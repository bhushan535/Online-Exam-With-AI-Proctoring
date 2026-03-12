let gazeAwayStart = null;

export function evaluateGaze(direction, config) {
  if (direction === "center") {
    gazeAwayStart = null;
    return null;
  }

  if (direction === "left" || direction === "right") {
    if (!gazeAwayStart) {
      gazeAwayStart = Date.now();
    }
    const duration = Date.now() - gazeAwayStart;
    
    if (duration >= config.gaze.lookAwayThresholdMs) {
      return { type: "gaze_away", severity: "medium", direction, duration };
    }
  }

  return null;
}
