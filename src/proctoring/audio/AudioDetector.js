import { evaluateAudio } from "../rules/audioRules";

let audioContext = null;
let analyser = null;
let microphone = null;
let scriptProcessor = null;
let stream = null;
let intervalId = null;

export async function initAudioDetector(onViolation, config) {
  if (audioContext) return;

  // Listen for exam submit event → auto cleanup
  window.addEventListener("proctor:stop", stopAudioDetector, { once: true });

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);

    scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    intervalId = setInterval(() => {
      // ✅ null check — prevents crash after unmount or stopAllMedia
      if (!analyser || !dataArray) return;

      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const db = rms > 0 ? 20 * Math.log10(rms / 255) : -100;
      const normalizedDb = Math.max(0, db + 100);

      const violation = evaluateAudio(normalizedDb, config);
      if (violation) {
        onViolation(violation);
      }
    }, config.audio.checkIntervalMs);

  } catch (err) {
    // Fail silently (e.g. permission denied)
  }
}

export function stopAudioDetector() {
  // ✅ Clear interval FIRST before nulling analyser — prevents null crash
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  if (scriptProcessor) { scriptProcessor.disconnect(); scriptProcessor = null; }
  if (analyser) { analyser.disconnect(); analyser = null; }
  if (microphone) { microphone.disconnect(); microphone = null; }

  if (audioContext && audioContext.state !== "closed") {
    audioContext.close();
  }
  audioContext = null;

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}