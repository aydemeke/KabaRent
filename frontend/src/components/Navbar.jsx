import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isAdmin = pathname.startsWith('/admin')

  function active(path) {
    const match = path === '/' ? pathname === '/' : pathname.startsWith(path)
    return match
      ? 'text-on-surface border-b-2 border-amber-400 pb-0.5'
      : 'text-on-surface-variant hover:text-on-surface transition-colors'
  }

  return (
    <nav
      className="sticky top-0 z-40 flex items-center justify-between px-8 py-3"
      style={{
        background: 'rgba(249,249,248,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0px 12px 32px rgba(26,28,28,0.06)',
        borderBottom: '1px solid #e8e8e7',
      }}
    >
      {/* Brand */}
      <Link
        to="/"
        className="font-jakarta font-bold italic text-3xl select-none"
        style={{ color: '#012d1d' }}
      >
        ካባ
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-6 text-sm font-inter font-medium tracking-wide">
        {isAdmin ? (
          <>
            <Link to="/admin"            className={active('/admin')}>Dashboard</Link>
            <Link to="/admin/kabas"      className={active('/admin/kabas')}>Kabas</Link>
            <Link to="/admin/orders"     className={active('/admin/orders')}>Orders</Link>
            <Link to="/admin/customers"  className={active('/admin/customers')}>Customers</Link>
            <Link to="/admin/payments"   className={active('/admin/payments')}>Payments</Link>
            <Link
              to="/"
              className="text-xs text-on-surface-variant hover:text-on-surface transition-colors opacity-60 hover:opacity-100 ml-2"
            >
              ← Customer view
            </Link>
          </>
        ) : (
          <>
            <Link to="/"          className={active('/')}>Browse</Link>
            <Link to="/order/new" className={active('/order/new')}>New Order</Link>
            <Link
              to="/admin"
              className="text-xs text-on-surface-variant hover:text-on-surface transition-colors opacity-60 hover:opacity-100"
            >
              Admin →
            </Link>
            <button
              onClick={() => navigate('/order/new')}
              className="ml-2 bg-primary text-white font-semibold rounded-xl px-6 py-2.5 text-sm tracking-wide transition-all duration-150 hover:scale-95 active:scale-90"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Rent Now
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
