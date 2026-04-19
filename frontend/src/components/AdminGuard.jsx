import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// TODO: replace with real authentication in next phase
const SESSION_KEY = 'kaba_admin_auth'

function PasswordModal({ onSuccess, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      <div className="bg-white w-full max-w-sm" style={{ borderRadius: '2rem', padding: '36px', boxShadow: '0 24px 48px rgba(1,45,29,0.18)' }}>
        <h2 className="font-jakarta font-bold text-on-surface mb-1" style={{ fontSize: '1.25rem' }}>Admin Area</h2>
        <p className="font-inter text-sm text-on-surface-variant mb-6">Enter password to continue</p>

        <input
          type="password"
          onKeyDown={e => e.key === 'Enter' && onSuccess()}
          placeholder="Password"
          autoFocus
          className="ds-input mb-2"
        />

        <div className="flex gap-3 mt-5">
          <button onClick={onSuccess} className="ds-btn-primary flex-1 text-center">
            Enter
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-inter font-medium text-on-surface-variant transition-colors duration-150 hover:bg-surface-container-low"
            style={{ background: '#f3f4f3' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminGuard({ children }) {
  const navigate = useNavigate()
  const [authorized, setAuthorized] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === '1'
  )

  function handleSuccess() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setAuthorized(true)
  }

  if (authorized) return children

  return (
    <PasswordModal
      onSuccess={handleSuccess}
      onCancel={() => navigate('/', { replace: true })}
    />
  )
}
