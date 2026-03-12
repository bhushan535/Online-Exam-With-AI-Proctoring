let initialized = false;
let exitCount = 0;
let violationCallback = null;
let currentConfig = null;
let forceBackTimer = null;

async function attemptFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  } catch (err) {
    // Browsers require a user gesture to enter fullscreen.
    // In a real app, the exam start button click serves as that gesture.
  }
}

function handleFullscreenChange() {
  if (!document.fullscreenElement) {
    // User exited fullscreen
    exitCount++;
    
    if (exitCount < currentConfig.fullscreen.maxExitsBeforeViolation) {
      if (violationCallback) {
        violationCallback({
          type: "fullscreen_exit",
          severity: "medium",
          count: exitCount
        });
      }
      
      // Force them back in after a delay
      if (forceBackTimer) clearTimeout(forceBackTimer);
      forceBackTimer = setTimeout(() => {
        attemptFullscreen();
      }, currentConfig.fullscreen.forceBackDelayMs);
      
    } else {
      if (violationCallback) {
        violationCallback({
          type: "fullscreen_exit",
          severity: "high",
          count: exitCount
        });
      }
    }
  }
}

export function initFullscreen(onViolation, config) {
  if (initialized) return;
  violationCallback = onViolation;
  currentConfig = config;
  
  if (config.fullscreen.enforced) {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    attemptFullscreen();
  }
  
  initialized = true;
}

export function destroyFullscreen() {
  if (!initialized) return;
  
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
  if (forceBackTimer) clearTimeout(forceBackTimer);
  
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  
  violationCallback = null;
  currentConfig = null;
  exitCount = 0;
  initialized = false;
}
