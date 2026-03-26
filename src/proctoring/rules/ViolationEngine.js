let state = {
  noFaceStart: null,
  tabSwitchCount: 0,
  lastEmit: {}
};

function emitOnce(event, config) {
  const now = Date.now();
  const lastTime = state.lastEmit[event.type] || 0;
  let cooldown = 0;

  if (event.severity === "low") {
    cooldown = config.violations.lowCooldownMs || 15000;
  } else if (event.severity === "medium") {
    cooldown = config.violations.mediumCooldownMs;
  } else if (event.severity === "high") {
    cooldown = config.violations.highCooldownMs;
  }

  if (now - lastTime >= cooldown) {
    state.lastEmit[event.type] = now;
    return event;
  }
  return null;
}

export function processViolation(event, config) {
  if (!event) return null;
  const now = Date.now();

  switch (event.type) {
    case "no_face":
      if (!state.noFaceStart) {
        state.noFaceStart = now;
      }
      if (now - state.noFaceStart >= config.face.noFaceThresholdMs) {
        return emitOnce({ ...event, severity: "medium" }, config);
      }
      return null;

    case "face_detected":
      state.noFaceStart = null;
      return null;

    case "multi_face":
      return emitOnce({ ...event, severity: "high" }, config);

    case "looking_away":
      return emitOnce({ ...event, severity: "medium" }, config);

    case "looking_down":
      // Low severity — log only, no strike
      return emitOnce({ ...event, severity: "low" }, config);

    case "gaze_away":
      return emitOnce({ ...event, severity: "medium" }, config);

    case "object_detected":
      // Phone = high (+2 strikes), Book = high (+2 strikes)
      return emitOnce({ ...event, severity: "high" }, config);

    case "tab_switch":
      state.tabSwitchCount++;
      return emitOnce({
        ...event,
        severity: state.tabSwitchCount >= 3 ? "high" : "medium"
      }, config);

    case "audio_detected":
      // Severity is set by audioRules.js (medium for sustained noise)
      return emitOnce({ ...event, severity: event.severity || "medium" }, config);

    case "fullscreen_exit":
      return event;

    case "clipboard_paste":
      return emitOnce({ ...event, severity: "medium" }, config);

    case "keyboard_cheat":
    case "multi_monitor":
    case "devtools_open":
      return emitOnce({ ...event, severity: "medium" }, config);

    default:
      return null;
  }
}
