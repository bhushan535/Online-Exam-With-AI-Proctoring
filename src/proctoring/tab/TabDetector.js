let switchCount = 0;
let initialized = false;
let violationCallback = null;
let blurHandler = null;
let focusHandler = null;

function handleVisibilityChange() {
  if (document.hidden || document.visibilityState === "hidden") {
    switchCount++;
    if (violationCallback) {
      violationCallback({
        type: "tab_switch",
        severity: switchCount >= 3 ? "high" : "medium",
        meta: {
          timestamp: Date.now(),
          tabTitle: document.title
        }
      });
    }
  }
}

export function initTabDetector(onViolation) {
  if (initialized) return;
  violationCallback = onViolation;

  // Detect tab switch
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Detect window minimize / alt+tab / click on another app
  blurHandler = () => {
    if (violationCallback) {
      violationCallback({
        type: "tab_switch",
        severity: "medium",
        meta: {
          timestamp: Date.now(),
          tabTitle: "Window minimized or focus lost"
        }
      });
    }
  };

  focusHandler = () => {
    // No violation on focus regain — just tracking state
  };

  window.addEventListener("blur", blurHandler);
  window.addEventListener("focus", focusHandler);

  initialized = true;
}

export function destroyTabDetector() {
  if (!initialized) return;
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  if (blurHandler) window.removeEventListener("blur", blurHandler);
  if (focusHandler) window.removeEventListener("focus", focusHandler);
  violationCallback = null;
  initialized = false;
  switchCount = 0;
  blurHandler = null;
  focusHandler = null;
}