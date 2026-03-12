import { loadCocoModel } from "./cocoModel";

let lastRun = 0;

export async function detectObjects(videoEl, config) {
  if (!videoEl || videoEl.readyState < 2 || videoEl.videoWidth === 0) {
    return [];
  }

  const now = Date.now();
  if (now - lastRun < 5000) {
    return [];
  }
  lastRun = now;

  try {
    const model = await loadCocoModel();
    const predictions = await model.detect(videoEl);
    
    // Fallback defaults if config is missing
    const phoneLabels = config?.objects?.phoneLabels || ["cell phone", "cellphone", "mobile phone", "phone", "remote"];
    const bookLabels = config?.objects?.bookLabels || ["book", "notebook", "magazine"];
    const minConf = config?.objects?.minConfidence || 0.3;
    const allowedLabels = [...phoneLabels, ...bookLabels];

    const objects = predictions
      .filter(pred => allowedLabels.includes(pred.class) && pred.score > minConf)
      .map(pred => ({ class: pred.class, score: pred.score }));
      
    return objects;
  } catch (err) {
    // Fail silently
    return [];
  }
}