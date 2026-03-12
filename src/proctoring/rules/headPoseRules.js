let lookAwayStart = null;
let consecutiveCenterFrames = 0;

export function evaluateHeadPose(direction, config) {
  if (direction === "center") {
    consecutiveCenterFrames++;
    if (consecutiveCenterFrames >= config.headPose.centerResetFrames) {
      lookAwayStart = null;
    }
    return null;
  }

  consecutiveCenterFrames = 0;
  if (!lookAwayStart) {
    lookAwayStart = Date.now();
  }

  const duration = (Date.now() - lookAwayStart) / 1000;

  if (
    (direction === "left" || direction === "right") &&
    Date.now() - lookAwayStart >= config.headPose.lookAwayThresholdMs
  ) {
    return { type: "looking_away", severity: "medium", direction, duration };
  }

  if (direction === "down" && Date.now() - lookAwayStart >= 5000) {
    return { type: "looking_down", severity: "high", duration };
  }

  return null;
}
