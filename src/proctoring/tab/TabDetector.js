let switchCount = 0;
let initialized = false;
let violationCallback = null;

function handleVisibilityChange() {
  if (document.hidden || document.visibilityState === "hidden") {
    switchCount++;
    const timestamp = Date.now();
    
    if (violationCallback) {
      violationCallback({
        type: "tab_switch",
        severity: switchCount >= 3 ? "high" : "medium",
        meta: {
          timestamp,
          tabTitle: document.title
        }
      });
    }
  }
}

export function initTabDetector(onViolation) {
  if (initialized) return;
  violationCallback = onViolation;
  document.addEventListener("visibilitychange", handleVisibilityChange);
  initialized = true;
}

export function destroyTabDetector() {
  if (!initialized) return;
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  violationCallback = null;
  initialized = false;
  switchCount = 0;
}
