let initialized = false;
let violationCallback = null;

function handleKeyDown(e) {
  let blocked = false;
  let combo = "";

  // F12
  if (e.key === "F12") {
    blocked = true;
    combo = "F12";
  }
  
  // Ctrl+Shift+...
  if (e.ctrlKey && e.shiftKey) {
    if (e.key === "I" || e.key === "i") { blocked = true; combo = "Ctrl+Shift+I"; }
    else if (e.key === "J" || e.key === "j") { blocked = true; combo = "Ctrl+Shift+J"; }
    else if (e.key === "C" || e.key === "c") { blocked = true; combo = "Ctrl+Shift+C"; }
  }
  
  // Ctrl+...
  if (e.ctrlKey && !e.shiftKey) {
    if (e.key === "U" || e.key === "u") { blocked = true; combo = "Ctrl+U"; }
    else if (e.key === "T" || e.key === "t") { blocked = true; combo = "Ctrl+T"; }
    else if (e.key === "W" || e.key === "w") { blocked = true; combo = "Ctrl+W"; }
    else if (e.key === "N" || e.key === "n") { blocked = true; combo = "Ctrl+N"; }
    else if (e.key === "R" || e.key === "r") { blocked = true; combo = "Ctrl+R"; }
  }

  // Alt+F4
  if (e.altKey && e.key === "F4") {
    blocked = true;
    combo = "Alt+F4";
  }

  if (blocked) {
    e.preventDefault();
    e.stopPropagation();
    
    if (violationCallback) {
      violationCallback({
        type: "keyboard_cheat",
        severity: "medium",
        meta: { key: combo }
      });
    }
  }
}

// Special handler for blurred window (like Alt+Tab which we can't fully prevent)
function handleBlur() {
  if (violationCallback) {
    violationCallback({
      type: "keyboard_cheat",
      severity: "medium",
      meta: { key: "Window Blur (Alt+Tab)" }
    });
  }
}

export function initKeyboardBlocker(onViolation) {
  if (initialized) return;
  violationCallback = onViolation;
  
  window.addEventListener("keydown", handleKeyDown, { capture: true });
  window.addEventListener("blur", handleBlur);
  
  initialized = true;
}

export function destroyKeyboardBlocker() {
  if (!initialized) return;
  
  window.removeEventListener("keydown", handleKeyDown, { capture: true });
  window.removeEventListener("blur", handleBlur);
  
  violationCallback = null;
  initialized = false;
}
