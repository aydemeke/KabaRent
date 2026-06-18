import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { login as loginRequest } from '../../api/auth'
import { useAuth } from '../../auth/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const redirect = searchParams.get('redirect') || '/customer/orders'

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const auth = await loginRequest(identifier, password)
      login(auth)
      // Admins belong in the admin area (all-orders, GET /api/orders) — never on the
      // customer self-service pages (/customer/orders → GET /api/my/orders → 403 for admin).
      // Customers keep the existing redirect (default /customer/orders).
      navigate(auth.role === 'ADMIN' ? '/admin' : redirect, { replace: true })
    } catch (err) {
      setError(err.response?.status === 401
        ? 'מספר טלפון או סיסמה שגויים.'
        : (err.response?.data?.error || 'אירעה שגיאה. אנא נסה שוב.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto" dir="rtl">
      <h1 className="font-jakarta font-bold text-on-surface mb-2 mt-4" style={{ fontSize: '1.75rem', letterSpacing: '-0.01em' }}>
        כניסה לחשבון
      </h1>
      <p className="font-inter text-sm text-on-surface-variant mb-8">
        התחברו כדי לצפות בהזמנות שלכם ולעקוב אחר הסטטוס.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-4" style={{ boxShadow: '0 2px 16px rgba(26,28,28,0.06)' }}>
        <div>
          <label htmlFor="login-phone" className="ds-label block mb-1.5">טלפון</label>
          <input
            id="login-phone"
            type="tel" value={identifier} required autoComplete="tel"
            onChange={e => setIdentifier(e.target.value)}
            placeholder="050-1234567"
            className="ds-input"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="ds-label block mb-1.5">סיסמה</label>
          <input
            id="login-password"
            type="password" value={password} required autoComplete="current-password"
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="ds-input"
          />
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 font-inter text-sm" style={{ background: 'rgba(86,0,0,0.08)', color: '#560000' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={submitting} className="ds-btn-primary w-full py-3.5 text-base">
          {submitting ? 'מתחבר…' : 'כניסה'}
        </button>
      </form>

      <p className="font-inter text-sm text-on-surface-variant text-center mt-6">
        אין לכם חשבון?{' '}
        <Link to={`/register${redirect !== '/customer/orders' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="ds-btn-text">
          הרשמה
        </Link>
      </p>
    </div>
  )
}
