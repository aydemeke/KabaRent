import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as loginRequest } from '../api/auth'
import { useAuth } from '../auth/useAuth'

function AdminLoginModal({ onCancel }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const auth = await loginRequest(email, password)
      if (auth.role !== 'ADMIN') {
        setError('This account is not an administrator.')
        return
      }
      login(auth)
    } catch (err) {
      setError(err.response?.status === 401
        ? 'Invalid email or password.'
        : (err.response?.data?.error || 'Something went wrong. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      dir="ltr"
      style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-sm"
        style={{ borderRadius: '2rem', padding: '36px', boxShadow: '0 24px 48px rgba(1,45,29,0.18)' }}
      >
        <h2 className="font-jakarta font-bold text-on-surface mb-1" style={{ fontSize: '1.25rem' }}>Admin Area</h2>
        <p className="font-inter text-sm text-on-surface-variant mb-6">Sign in to continue</p>

        <label htmlFor="admin-email" className="ds-label block mb-1.5">Email</label>
        <input
          id="admin-email"
          type="email" value={email} required autoComplete="username"
          onChange={e => setEmail(e.target.value)}
          placeholder="admin@kabarent.local"
          autoFocus
          className="ds-input mb-4"
        />

        <label htmlFor="admin-password" className="ds-label block mb-1.5">Password</label>
        <input
          id="admin-password"
          type="password" value={password} required autoComplete="current-password"
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="ds-input mb-2"
        />

        {error && (
          <div className="rounded-xl px-4 py-3 font-inter text-sm mt-3" style={{ background: 'rgba(86,0,0,0.08)', color: '#560000' }}>
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button type="submit" disabled={submitting} className="ds-btn-primary flex-1 text-center">
            {submitting ? 'Signing in…' : 'Enter'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-inter font-medium text-on-surface-variant transition-colors duration-150 hover:bg-surface-container-low"
            style={{ background: '#f3f4f3' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default function AdminGuard({ children }) {
  const navigate = useNavigate()
  const { isLoggedIn, isAdmin } = useAuth()

  if (isLoggedIn && isAdmin) return children

  return <AdminLoginModal onCancel={() => navigate('/', { replace: true })} />
}
