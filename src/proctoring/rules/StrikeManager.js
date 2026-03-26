// Strike Manager — tracks violation strikes and auto-submits when limit is reached.
// The `proctor:freeze` custom event is dispatched on violations.

let strikes = 0;
let autoSubmitTriggered = false;

export function resetStrikes() {
  strikes = 0;
  autoSubmitTriggered = false;
}

export function getStrikes() {
  return strikes;
}

export function handleStrike(event, callbacks, config) {
  const { warnStudent, submitExam } = callbacks;

  // Low severity → log only, no strike, no freeze, no warning
  if (event.severity === "low") {
    return;
  }

  // Prevent double auto-submit
  if (autoSubmitTriggered) return;

  // Increment strikes based on severity
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
  }

  console.log(`[STRIKE_MANAGER] Strikes: ${strikes}/${config.strikes.autoSubmitAt}`);

  // Check if max strikes reached — auto-submit immediately
  if (strikes >= config.strikes.autoSubmitAt) {
    console.log(`[STRIKE_MANAGER] MAX STRIKES REACHED (${strikes}/${config.strikes.autoSubmitAt}). AUTO-SUBMITTING.`);
    autoSubmitTriggered = true;
    submitExam();
  }
}
