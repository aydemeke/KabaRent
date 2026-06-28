import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import CheckoutAuthGate from './CheckoutAuthGate'

export default function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isAdmin = pathname.startsWith('/admin')
  const [menuOpen, setMenuOpen] = useState(false)
  const [gateOpen, setGateOpen] = useState(false)
  const { isLoggedIn, isAdmin: isAdminUser, logout } = useAuth()

  function active(path) {
    const match = path === '/' ? pathname === '/' : pathname.startsWith(path)
    return match
      ? 'text-on-surface border-b-2 border-accent-gold pb-0.5'
      : 'text-on-surface-variant hover:text-on-surface transition-colors'
  }

  function handleLogout(to) {
    logout()
    navigate(to, { replace: true })
  }

  const linkBtn = 'transition-colors bg-transparent border-none cursor-pointer font-inter font-medium text-sm p-0'
  const greenLink = { color: '#1C7C49' }
  const greenIn = e => (e.currentTarget.style.color = '#17663C')
  const greenOut = e => (e.currentTarget.style.color = '#1C7C49')

  // "New order" entry point. Logged-in customers go straight to the prefilled form;
  // guests hit the same checkout gate as the card flow, with redirect target /order/new
  // (no kabaId — this is a generic "start an order" entry, so no selection to preserve).
  const newOrderLink = isLoggedIn ? (
    <Link to="/order/new" className="ds-btn-ghost w-full sm:w-auto" style={{ borderRadius: '10px' }} onClick={() => setMenuOpen(false)}>הזמנה חדשה</Link>
  ) : (
    <button
      type="button"
      onClick={() => { setMenuOpen(false); setGateOpen(true) }}
      className="ds-btn-ghost w-full sm:w-auto"
      style={{ borderRadius: '10px' }}
    >
      הזמנה חדשה
    </button>
  )

  const navLinks = isAdmin ? (
    <>
      <Link to="/admin"            className={active('/admin')}>Dashboard</Link>
      <Link to="/admin/kabas"      className={active('/admin/kabas')}>Kabas</Link>
      <Link to="/admin/orders"     className={active('/admin/orders')}>Orders</Link>
      <Link to="/admin/customers"  className={active('/admin/customers')}>Customers</Link>
      <Link to="/admin/payments"   className={active('/admin/payments')}>Payments</Link>
      <button type="button" onClick={() => handleLogout('/')} className={`${linkBtn} sm:ml-2`} style={greenLink} onMouseEnter={greenIn} onMouseLeave={greenOut}>Logout</button>
      <Link
        to="/"
        className="text-xs text-on-surface-variant hover:text-on-surface transition-colors opacity-60 hover:opacity-100 sm:ml-2"
      >
        ← Customer view
      </Link>
    </>
  ) : (
    <>
      {newOrderLink}
      {isLoggedIn ? (
        <>
          {/* Customer-only link; an admin viewing a customer page has no "my orders". */}
          {!isAdminUser && <Link to="/customer/orders" className={active('/customer/orders')}>ההזמנות שלי</Link>}
          <button type="button" onClick={() => handleLogout('/')} className={linkBtn} style={greenLink} onMouseEnter={greenIn} onMouseLeave={greenOut}>התנתקות</button>
        </>
      ) : (
        <>
          <Link to="/login" className={active('/login')} style={greenLink} onMouseEnter={greenIn} onMouseLeave={greenOut}>כניסה</Link>
          <Link to="/register" className={active('/register')} style={greenLink} onMouseEnter={greenIn} onMouseLeave={greenOut}>הרשמה</Link>
        </>
      )}
    </>
  )

  return (
    <nav
      className="sticky top-0 z-40"
      style={{
        background: 'rgba(253,251,245,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0px 12px 32px rgba(28,124,73,0.05)',
        borderBottom: '1px solid #ECE4CB',
      }}
    >
      <div className="flex items-center justify-between px-8 py-3">
        {/* Nav links — left side (desktop) */}
        <div className="hidden sm:flex items-center gap-6 text-sm font-inter font-medium tracking-wide">
          {navLinks}
        </div>

        {/* Hamburger — left side (mobile only) */}
        <button
          type="button"
          className="sm:hidden flex items-center justify-center text-on-surface"
          style={{ width: '44px', height: '44px', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="תפריט"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen
              ? <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>
              : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
            }
          </svg>
        </button>

        {/* Brand — right side */}
        <Link to="/" className="select-none" onClick={() => setMenuOpen(false)}>
          <img
            src="/kaba-rent-logo.png"
            alt="ካባ"
            className="h-12 sm:h-14 w-auto"
            style={{ objectFit: 'contain' }}
          />
        </Link>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="sm:hidden flex flex-col gap-4 px-8 py-4 text-sm font-inter font-medium tracking-wide"
          style={{ borderTop: '1px solid #ECE4CB', background: 'rgba(253,251,245,0.97)' }}
          onClick={() => setMenuOpen(false)}
        >
          {navLinks}
        </div>
      )}

      {gateOpen && (
        <CheckoutAuthGate
          onClose={() => setGateOpen(false)}
          onLogin={() => navigate('/login?redirect=%2Forder%2Fnew')}
          onRegister={() => navigate('/register?redirect=%2Forder%2Fnew')}
          onGuest={() => navigate('/order/new')}
        />
      )}
    </nav>
  )
}
