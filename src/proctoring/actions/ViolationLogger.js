import { BASE_URL } from '../../config';
export async function logViolation({ event, examId, studentId, snapshot, config }) {

  // Only include snapshot if: high severity, OR (medium AND config.snapshotOnMedium)
  const includeSnapshot = event.severity === "high" || (event.severity === "medium" && config.snapshotOnMedium)

  const payload = {
    examId,
    studentId,
    type: event.type,
    severity: event.severity,
    timestamp: Date.now(),
    snapshot: includeSnapshot ? snapshot : null,
    meta: {
      count: event.count || null,
      duration: event.duration || null,
      object: event.object || null,
      direction: event.direction || null,
      key: event.meta?.key || null,
      tabTitle: event.meta?.tabTitle || null,
      dB: event.dB || null,
    }
  }

  try {
    const res = await fetch(`${BASE_URL}/violations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(res.status)
  } catch (err) {
    // Retry once after 2 seconds
    setTimeout(async () => {
      try {
        await fetch(`${BASE_URL}/violations`, {

          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      } catch (_) { } // Silent fail — never crash exam
    }, 2000)
  }
}
