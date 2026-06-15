import axios from 'axios'
import { getToken, clearAuth } from '../auth/authStorage'

//Locally
//const api = axios.create({
//  baseURL: 'http://localhost:8080/api',
//  headers: { 'Content-Type': 'application/json' },
//})

//Remote server
const api = axios.create({
  baseURL: 'https://kabarent.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach the JWT (if any) to every request.
api.interceptors.request.use(config => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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

export default api
