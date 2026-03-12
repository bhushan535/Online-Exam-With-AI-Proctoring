let initialized = false;
let violationCallback = null;
let intervalId = null;
let lastEmitTime = 0;

function checkDevTools() {
  const widthDiff = window.outerWidth - window.innerWidth > 160;
  const heightDiff = window.outerHeight - window.innerHeight > 160;

  if (widthDiff || heightDiff) {
    const now = Date.now();
    
    // Cooldown: Don't re-emit within 30 seconds
    if (now - lastEmitTime >= 30000) {
      lastEmitTime = now;
      
      if (violationCallback) {
        violationCallback({
          type: "devtools_open",
          severity: "medium"
        });
      }
    }
  }
}

export function initDevToolsDetector(onViolation) {
  if (initialized) return;
  violationCallback = onViolation;
  
  // Check every 3 seconds
  intervalId = setInterval(checkDevTools, 3000);
  
  initialized = true;
}

export function destroyDevToolsDetector() {
  if (!initialized) return;
  
  if (intervalId) clearInterval(intervalId);
  violationCallback = null;
  initialized = false;
  lastEmitTime = 0;
}
