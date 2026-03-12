let state = {
  noFaceStart: null,
  tabSwitchCount: 0,
  lastEmit: {}
};

function emitOnce(event, config) {
  const now = Date.now();
  const lastTime = state.lastEmit[event.type] || 0;
  let cooldown = 0;

  if (event.severity === "medium") {
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
        return emitOnce(event, config);
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
      return emitOnce({ ...event, severity: "high" }, config);

    case "gaze_away":
      return emitOnce({ ...event, severity: "medium" }, config);

    case "object_detected":
      return emitOnce(event, config);

    case "tab_switch":
      state.tabSwitchCount++;
      return emitOnce({ 
        ...event, 
        severity: state.tabSwitchCount >= 3 ? "high" : "medium" 
      }, config);

    case "audio_detected":
      return emitOnce({ ...event, severity: "medium" }, config);

    case "fullscreen_exit":
      return event;

    case "keyboard_cheat":
    case "clipboard_paste":
    case "multi_monitor":
    case "devtools_open":
      return emitOnce({ ...event, severity: "medium" }, config);

    default:
      return null;
  }
}
