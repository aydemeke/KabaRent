import { useSyncExternalStore } from 'react'
import { subscribe, getSnapshot, setAuth, clearAuth } from './authStorage'

/**
 * Subscribes a component to the auth session. Returns { token, user, isLoggedIn, isAdmin }
 * plus login/logout helpers. Re-renders on any login/logout anywhere in the app.
 */
export function useAuth() {
  const { token, user } = useSyncExternalStore(subscribe, getSnapshot)
  return {
    token,
    user,
    isLoggedIn: !!token,
    isAdmin: user?.role === 'ADMIN',
    login: setAuth,
    logout: clearAuth,
  }
}
