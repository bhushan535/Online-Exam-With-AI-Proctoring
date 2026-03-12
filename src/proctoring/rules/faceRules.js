export function evaluateFaceRules({ count, timestamp }) {
  if (count === 0) return [{ type: "no_face", severity: "medium", timestamp }];
  return [{ type: "face_detected", severity: "info", timestamp }];
}