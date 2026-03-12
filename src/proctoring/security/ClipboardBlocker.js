let initialized = false;
let violationCallback = null;

function handleCopy(e) {
  e.preventDefault();
}

function handleCut(e) {
  e.preventDefault();
}

function handlePaste(e) {
  e.preventDefault();
  
  if (violationCallback) {
    violationCallback({
      type: "clipboard_paste",
      severity: "medium",
      timestamp: Date.now()
    });
  }
}

function handleContextMenu(e) {
  e.preventDefault();
}

export function initClipboardBlocker(onViolation) {
  if (initialized) return;
  violationCallback = onViolation;
  
  document.addEventListener("copy", handleCopy);
  document.addEventListener("cut", handleCut);
  document.addEventListener("paste", handlePaste);
  document.addEventListener("contextmenu", handleContextMenu);
  
  initialized = true;
}

export function destroyClipboardBlocker() {
  if (!initialized) return;
  
  document.removeEventListener("copy", handleCopy);
  document.removeEventListener("cut", handleCut);
  document.removeEventListener("paste", handlePaste);
  document.removeEventListener("contextmenu", handleContextMenu);
  
  violationCallback = null;
  initialized = false;
}
