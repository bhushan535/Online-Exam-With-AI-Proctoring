let loudStart = null;
let lastAudioViolationTime = 0;

export function evaluateAudio(dB, config) {
  const now = Date.now();

  if (dB > config.audio.volumeThresholdDb) {
    if (!loudStart) loudStart = now;
    const duration = now - loudStart;

    if (duration >= config.audio.sustainedMs) {
      const cooldown = config.audio.cooldownMs || 15000;
      if (now - lastAudioViolationTime >= cooldown) {
        lastAudioViolationTime = now;
        loudStart = null; // Reset for next detection cycle
        return { type: "audio_detected", severity: "medium", dB, duration };
      }
      loudStart = null; // Reset even if in cooldown
    }
  } else {
    loudStart = null;
  }
  return null;
}
