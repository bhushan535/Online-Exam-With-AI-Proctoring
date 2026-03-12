import { loadCocoModel } from "../object/cocoModel";

export async function detectPersons(videoEl) {
  if (!videoEl || videoEl.readyState < 2 || videoEl.videoWidth === 0) {
    return 0;
  }

  try {
    const model = await loadCocoModel();
    const predictions = await model.detect(videoEl);
    
    const persons = predictions.filter(
      (pred) => pred.class === "person" && pred.score > 0.6
    );
    
    return persons.length;
  } catch (err) {
    // Fail silently, returning 0 persons
    return 0;
  }
}