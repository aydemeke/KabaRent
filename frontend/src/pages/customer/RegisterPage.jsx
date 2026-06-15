import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { register as registerRequest } from '../../api/auth'
import { useAuth } from '../../auth/useAuth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const redirect = searchParams.get('redirect') || '/customer/orders'

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const auth = await registerRequest({ fullName, phone, email, password })
      login(auth)
      navigate(redirect, { replace: true })
    } catch (err) {
      if (err.response?.status === 409) {
        setError('כבר קיים חשבון עם אימייל זה. נסו להתחבר.')
      } else {
        setError(err.response?.data?.error || 'אירעה שגיאה. אנא נסה שוב.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto" dir="rtl">
      <h1 className="font-jakarta font-bold text-on-surface mb-2 mt-4" style={{ fontSize: '1.75rem', letterSpacing: '-0.01em' }}>
        יצירת חשבון
      </h1>
      <p className="font-inter text-sm text-on-surface-variant mb-8">
        נרשמים פעם אחת וצופים בכל ההזמנות שלכם במקום אחד.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-4" style={{ boxShadow: '0 2px 16px rgba(26,28,28,0.06)' }}>
        <div>
          <label htmlFor="register-fullname" className="ds-label block mb-1.5">שם מלא</label>
          <input
            id="register-fullname"
            type="text" value={fullName} required autoComplete="name"
            onChange={e => setFullName(e.target.value)}
            placeholder="לדוגמה: שרה כהן"
            className="ds-input"
          />
        </div>
        <div>
          <label htmlFor="register-phone" className="ds-label block mb-1.5">טלפון</label>
          <input
            id="register-phone"
            type="tel" value={phone} required autoComplete="tel"
            onChange={e => setPhone(e.target.value)}
            placeholder="050-0000000"
            className="ds-input"
          />
        </div>
        <div>
          <label htmlFor="register-email" className="ds-label block mb-1.5">אימייל</label>
          <input
            id="register-email"
            type="email" value={email} required autoComplete="email"
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="ds-input"
          />
        </div>
        <div>
          <label htmlFor="register-password" className="ds-label block mb-1.5">סיסמה (לפחות 8 תווים)</label>
          <input
            id="register-password"
            type="password" value={password} required minLength={8} autoComplete="new-password"
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
          {submitting ? 'נרשם…' : 'הרשמה'}
        </button>
      </form>

      <p className="font-inter text-sm text-on-surface-variant text-center mt-6">
        כבר יש לכם חשבון?{' '}
        <Link to={`/login${redirect !== '/customer/orders' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="ds-btn-text">
          כניסה
        </Link>
      </p>
    </div>
  )
}
