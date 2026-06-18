import axios from 'axios'
import { getToken, clearAuth } from '../auth/authStorage'
import { markSlow, clearSlow } from './coldStart'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  // Render free tier can take ~60s to wake from a cold start; allow headroom.
  timeout: 70000,
})

const SLOW_MS = 3000        // show the "waking the server" hint after this long
const MAX_RETRIES = 2       // retry attempts on transport failures (network error / timeout)
const RETRY_DELAY_MS = 3000

// Attach the JWT (if any) to every request, and arm the slow-request (cold-start) hint.
api.interceptors.request.use(config => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // If the request is still in flight after SLOW_MS, flag it so the UI shows the hint.
  // (Re-armed on each attempt, including retries.)
  config.__isSlow = false
  config.__slowTimer = setTimeout(() => { config.__isSlow = true; markSlow() }, SLOW_MS)
  return config
})

// Clear the slow-request hint as soon as a request settles (success OR failure).
// Registered first so it runs before the retry interceptor re-fires the request.
function settleSlow(config) {
  if (!config) return
  if (config.__slowTimer) { clearTimeout(config.__slowTimer); config.__slowTimer = null }
  if (config.__isSlow) { config.__isSlow = false; clearSlow() }
}
api.interceptors.response.use(
  response => { settleSlow(response.config); return response },
  error => { settleSlow(error.config); return Promise.reject(error) }
)

// On 401 (expired/invalid token), clear the stored session and bounce to login.
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      clearAuth()
      const { pathname } = window.location
      // Don't force-redirect on the auth pages, or on /admin (AdminGuard re-prompts there
      // once the cleared session triggers a re-render).
      if (!pathname.startsWith('/login') && !pathname.startsWith('/register') && !pathname.startsWith('/admin')) {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  }
)

// Retry ONLY transport failures (no HTTP response: network error / timeout) — e.g. a
// Render cold start. Never retry real 4xx/5xx responses (those carry error.response).
api.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config
    const isTransportError = !error.response
    if (isTransportError && config) {
      config.__retryCount = config.__retryCount || 0
      if (config.__retryCount < MAX_RETRIES) {
        config.__retryCount += 1
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
        return api(config)
      }
    }
    return Promise.reject(error)
  }
)

export default api
