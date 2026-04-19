import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// TODO: replace with real authentication in next phase
const SESSION_KEY = 'kaba_admin_auth'

function PasswordModal({ onSuccess, onCancel }) {
  // TODO: replace with real authentication in next phase
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Admin Area</h2>
        <p className="text-sm text-gray-500 mb-5">Enter password to continue</p>

        <input
          type="password"
          onKeyDown={e => e.key === 'Enter' && onSuccess()}
          placeholder="Password"
          autoFocus
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-600 mb-2"
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onSuccess}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors duration-150"
            style={{ background: '#1B5E20' }}
            onMouseEnter={e => e.currentTarget.style.background = '#2E7D32'}
            onMouseLeave={e => e.currentTarget.style.background = '#1B5E20'}
          >
            Enter
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-150"
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
