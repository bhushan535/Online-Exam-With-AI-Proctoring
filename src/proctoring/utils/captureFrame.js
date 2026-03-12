export function captureFrame(videoEl) {
  if (!videoEl || videoEl.readyState < 2) return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth || 640;
    canvas.height = videoEl.videoHeight || 480;
    canvas.getContext("2d").drawImage(videoEl, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.6); // 60% quality to keep size small
  } catch {
    return null;
  }
}
