import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

/** Gates customer self-service routes: redirects to login (returning here afterwards) when logged out. */
export default function RequireCustomer({ children }) {
  const { isLoggedIn } = useAuth()
  const location = useLocation()
  if (!isLoggedIn) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }
  return children
}
