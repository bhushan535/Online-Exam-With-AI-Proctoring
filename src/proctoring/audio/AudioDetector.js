import { evaluateAudio } from "../rules/audioRules";

let audioContext = null;
let analyser = null;
let microphone = null;
let scriptProcessor = null;
let stream = null;
let intervalId = null;

export async function initAudioDetector(onViolation, config) {
  if (audioContext) return;

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    
    // We use a ScriptProcessorNode to get raw audio data periodically
    // (Deprecated but widely supported, AudioWorklet is better but more complex to inline)
    scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    intervalId = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i]; // sum of squares
      }
      const rms = Math.sqrt(sum / dataArray.length);
      
      // Prevent -Infinity for pure silence
      const db = rms > 0 ? 20 * Math.log10(rms / 255) : -100;
      
      // Web Audio gives negative dB (0 is full volume).
      // We'll normalize it so 0 is silence, and higher numbers are louder
      // This maps roughly -100dB..0dB to 0..100
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
  if (intervalId) clearInterval(intervalId);
  if (scriptProcessor) scriptProcessor.disconnect();
  if (analyser) analyser.disconnect();
  if (microphone) microphone.disconnect();
  
  if (audioContext && audioContext.state !== "closed") {
    audioContext.close();
  }
  
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  
  audioContext = null;
  analyser = null;
  microphone = null;
  scriptProcessor = null;
  stream = null;
  intervalId = null;
}
