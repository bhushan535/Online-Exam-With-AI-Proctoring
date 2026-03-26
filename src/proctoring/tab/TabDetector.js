let switchCount = 0;
let initialized = false;
let violationCallback = null;
let lastTabViolationTime = 0;

function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    const now = Date.now();
    // 10s cooldown between tab violations
    if (now - lastTabViolationTime < 10000) return;
    lastTabViolationTime = now;

    switchCount++;
    if (violationCallback) {
      violationCallback({
        type: "tab_switch",
        severity: switchCount >= 3 ? "high" : "medium",
        meta: {
          timestamp: now,
          tabTitle: document.title
        }
      });
    }
  }
}

export function initTabDetector(onViolation) {
  if (initialized) return;
  violationCallback = onViolation;

  // Only detect actual tab/window switches via visibilitychange
  // Window blur is NOT used — it fires on same-page clicks and causes false positives
  document.addEventListener("visibilitychange", handleVisibilityChange);

  initialized = true;
}

export function destroyTabDetector() {
  if (!initialized) return;
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  violationCallback = null;
  initialized = false;
  switchCount = 0;
  lastTabViolationTime = 0;
}