import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

let modelPromise = null;

export function loadCocoModel() {
  if (!modelPromise) modelPromise = cocoSsd.load();
  return modelPromise;
}
