import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <nav
      className="text-white px-6 py-3 flex items-center justify-between"
      style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 40%, #5C1A1A 100%)' }}
    >
      <Link
        to="/"
        className="font-bold tracking-wide flex items-center"
        style={{ color: '#e8c96a', fontSize: '1.5rem', height: '44px', padding: '4px 0' }}
      >
        ካባ
      </Link>

      <div className="flex gap-4 text-sm items-center" style={{ color: '#d4d4d8' }}>
        {isAdmin ? (
          <>
            <Link to="/admin" className="hover:text-white transition-colors">Dashboard</Link>
            <Link to="/admin/kabas" className="hover:text-white transition-colors">Kabas</Link>
            <Link to="/admin/orders" className="hover:text-white transition-colors">Orders</Link>
            <Link to="/admin/customers" className="hover:text-white transition-colors">Customers</Link>
            <Link to="/admin/payments" className="hover:text-white transition-colors">Payments</Link>
            <Link to="/" className="opacity-50 hover:opacity-80 transition-opacity text-xs">← Customer view</Link>
          </>
        ) : (
          <>
            <Link to="/" className="hover:text-white transition-colors">Browse</Link>
            <Link to="/order/new" className="hover:text-white transition-colors">New Order</Link>
            <Link to="/admin" className="opacity-50 hover:opacity-80 transition-opacity text-xs">Admin →</Link>
          </>
        )}
      </div>
    </nav>
  )
}
