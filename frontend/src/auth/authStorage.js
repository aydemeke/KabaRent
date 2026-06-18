// Client-side auth session: JWT + identity in localStorage (~24h, matching the backend
// token expiry). A tiny subscriber list lets React components (e.g. the navbar) re-render
// on login/logout via useSyncExternalStore.

const TOKEN_KEY = 'kaba_token'
const USER_KEY = 'kaba_user'

const listeners = new Set()

function read() {
  const token = localStorage.getItem(TOKEN_KEY)
  const raw = localStorage.getItem(USER_KEY)
  let user = null
  if (raw) {
    try { user = JSON.parse(raw) } catch { user = null }
  }
  return { token, user }
}

// Cached snapshot with a stable reference between changes (required by useSyncExternalStore).
let snapshot = read()

function refresh() {
  snapshot = read()
  listeners.forEach(l => l())
}

export function getSnapshot() {
  return snapshot
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getToken() {
  return snapshot.token
}

export function getUser() {
  return snapshot.user
}

export function isLoggedIn() {
  return !!snapshot.token
}

export function isAdmin() {
  return snapshot.user?.role === 'ADMIN'
}

/** Stores the auth response ({ token, customerId, fullName, phone, email, role }). */
export function setAuth({ token, ...user }) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  refresh()
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  refresh()
}
