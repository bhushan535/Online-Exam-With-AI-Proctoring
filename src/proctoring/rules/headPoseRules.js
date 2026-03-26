let lookAwayStart = null;
let consecutiveCenterFrames = 0;
let lastLookDownTime = 0;

export function evaluateHeadPose(direction, config) {
  const now = Date.now();

  if (direction === "center") {
    consecutiveCenterFrames++;
    if (consecutiveCenterFrames >= config.headPose.centerResetFrames) {
      lookAwayStart = null;
    }
    return null;
  }

  consecutiveCenterFrames = 0;
  if (!lookAwayStart) {
    lookAwayStart = now;
  }

  const duration = (now - lookAwayStart) / 1000;

  if (
    (direction === "left" || direction === "right") &&
    now - lookAwayStart >= config.headPose.lookAwayThresholdMs
  ) {
    return { type: "looking_away", severity: "medium", direction, duration };
  }

  if (direction === "down") {
    const downThreshold = config.headPose.lookDownThresholdMs || 4000;
    if (now - lookAwayStart >= downThreshold) {
      const cooldown = config.headPose.lookDownCooldownMs || 20000;
      if (now - lastLookDownTime >= cooldown) {
        lastLookDownTime = now;
        return { type: "looking_down", severity: "low", duration };
      }
    }
  }

  return null;
}
