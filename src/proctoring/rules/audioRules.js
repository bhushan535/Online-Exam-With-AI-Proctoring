let loudStart = null;

export function evaluateAudio(dB, config) {
  if (dB > config.audio.volumeThresholdDb) {
    if (!loudStart) loudStart = Date.now();
    if (Date.now() - loudStart >= config.audio.sustainedMs) {
      return { type: "audio_detected", severity: "medium", dB };
    }
  } else {
    loudStart = null;
  }
  return null;
}
