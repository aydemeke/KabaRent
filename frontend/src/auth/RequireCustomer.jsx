import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

/** Gates customer self-service routes: redirects to login (returning here afterwards) when logged out. */
export default function RequireCustomer({ children }) {
  const { isLoggedIn } = useAuth()
  const location = useLocation()
  if (!isLoggedIn) {
    // Preserve the query string too: the order intent (kabaId/dates) lives entirely in
    // location.search, so it must survive the login round-trip.
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }
  return children
}
