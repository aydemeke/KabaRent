// Tracks whether any in-flight request has been pending long enough to look like a
// Render cold start, so the UI can show a non-blocking "waking the server" hint.
// Mirrors the small subscribe/getSnapshot store pattern used by auth/authStorage.js.

let slowCount = 0
let snapshot = false
const listeners = new Set()

function emit() {
  const next = slowCount > 0
  if (next !== snapshot) {
    snapshot = next
    listeners.forEach(l => l())
  }
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot() {
  return snapshot
}

/** A request has been slow for a while — show the cold-start hint. */
export function markSlow() {
  slowCount += 1
  emit()
}

/** A previously-slow request settled — hide the hint once none remain. */
export function clearSlow() {
  slowCount = Math.max(0, slowCount - 1)
  emit()
}
