// IMPORTANT: The `proctor:freeze` custom event is dispatched on violations.
// The consuming project's exam page can listen to this event (window.addEventListener('proctor:freeze', ...)) 
// and disable inputs for the specified duration (e.detail.duration) to prevent cheating.

let strikes = 0;
let lastStrikeTime = 0;

export function handleStrike(event, callbacks, config) {
  const { warnStudent, submitExam } = callbacks;

  // Cooldown between strikes: 5 seconds
  if (Date.now() - lastStrikeTime < 5000) return;
  lastStrikeTime = Date.now();

  if (event.severity === "medium") {
    strikes += 1;
    warnStudent({ level: "warning", message: "⚠️ Suspicious activity detected", event });
    
    // Dispatch freeze event for 3 seconds on medium
    window.dispatchEvent(new CustomEvent("proctor:freeze", { detail: { duration: 3000 } }));
  }

  if (event.severity === "high") {
    strikes += 2;
    warnStudent({ level: "danger", message: "🚫 Serious violation recorded", event });
    
    // Dispatch freeze event for 8 seconds on high
    window.dispatchEvent(new CustomEvent("proctor:freeze", { detail: { duration: 8000 } }));
    
    setTimeout(() => submitExam(), 8000);
  }

  if (strikes >= config.strikes.autoSubmitAt) {
    submitExam();
  }
}
