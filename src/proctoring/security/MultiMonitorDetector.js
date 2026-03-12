let initialized = false;
let violationCallback = null;
let intervalId = null;
let emitted = false;

function checkMultiMonitor() {
  if (emitted) return; // Only emit once

  // Screen available width vs window width check
  // If the available screen is significantly wider than the window, 
  // they might be on a second monitor or have a massive ultra-wide setup.
  const diffWidth = window.screen.availWidth - window.innerWidth;
  
  // Or if the total screen width itself is very large (e.g. 2x 1080p is 3840)
  const isWideScreen = window.screen.width > 2560;

  if (diffWidth > 200 || isWideScreen) {
    emitted = true;
    if (violationCallback) {
      violationCallback({
        type: "multi_monitor",
        severity: "medium"
      });
    }
  }
}

export function initMultiMonitorDetector(onViolation) {
  if (initialized) return;
  violationCallback = onViolation;
  
  // Check immediately
  checkMultiMonitor();
  
  // And check every 30 seconds thereafter
  intervalId = setInterval(checkMultiMonitor, 30000);
  
  initialized = true;
}

export function destroyMultiMonitorDetector() {
  if (!initialized) return;
  
  if (intervalId) clearInterval(intervalId);
  violationCallback = null;
  initialized = false;
  emitted = false;
}
