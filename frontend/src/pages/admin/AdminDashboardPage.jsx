import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAll as getOrders } from '../../api/orders'
import { getAll as getKabas } from '../../api/kabas'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'

function StatCard({ label, value, accent }) {
  return (
    <div
      className="bg-white rounded-2xl p-6 flex flex-col gap-2 shadow-ambient"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <p className="ds-label">{label}</p>
      <p className="font-jakarta font-black text-on-surface" style={{ fontSize: '2rem', lineHeight: 1 }}>{value}</p>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState([])
  const [kabas, setKabas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getOrders(), getKabas()])
      .then(([o, k]) => { setOrders(o); setKabas(k) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const pending   = orders.filter(o => o.status === 'PENDING').length
  const active    = orders.filter(o => o.status === 'ACTIVE').length
  const revenue   = orders
    .filter(o => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + Number(o.totalPrice), 0)

  const recent = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)

  return (
    <div className="space-y-8">
      <h1 className="font-jakarta font-bold text-on-surface" style={{ fontSize: '1.75rem', letterSpacing: '-0.01em' }}>
        Dashboard
      </h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total orders"          value={orders.length}         accent="#ECE4CB" />
        <StatCard label="Pending"               value={pending}               accent="#FFC233" />
        <StatCard label="Active rentals"        value={active}                accent="#1C7C49" />
        <StatCard label="Revenue (completed)"   value={`₪${revenue.toFixed(0)}`} accent="#FFC233" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/admin/orders',    label: 'Orders' },
          { to: '/admin/kabas',     label: 'Kabas' },
          { to: '/admin/customers', label: 'Customers' },
          { to: '/admin/payments',  label: 'Payments' },
        ].map(({ to, label }) => (
          <Link
            key={to} to={to}
            className="bg-white rounded-2xl px-4 py-3.5 font-inter text-sm font-semibold text-on-surface-variant text-center transition-all duration-150 hover:text-primary hover:bg-surface-container-low"
            style={{ boxShadow: '0 2px 12px rgba(28,124,73,0.05)' }}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="ds-panel">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #ECE4CB' }}>
          <h2 className="font-jakarta font-semibold text-on-surface">Recent Orders</h2>
          <Link to="/admin/orders" className="font-inter text-sm text-primary font-medium hover:underline">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-center font-inter text-on-surface-variant py-10 text-sm">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="ds-table-head">
              <th>ID</th><th>Customer</th><th>Event date</th><th>Total</th><th>Status</th>
            </tr></thead>
            <tbody className="divide-y" style={{ borderColor: '#ECE4CB' }}>
              {recent.map(o => (
                <tr key={o.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-3 font-inter text-on-surface-variant text-xs">#{o.id}</td>
                  <td className="px-4 py-3 font-inter font-medium text-on-surface">{o.customer.fullName}</td>
                  <td className="px-4 py-3 font-inter text-on-surface-variant">{o.eventDate}</td>
                  <td className="px-4 py-3 font-inter font-medium text-on-surface">₪{o.totalPrice}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Inventory summary */}
      <div className="ds-panel">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #ECE4CB' }}>
          <h2 className="font-jakarta font-semibold text-on-surface">Inventory ({kabas.length} active Kabas)</h2>
          <Link to="/admin/kabas" className="font-inter text-sm text-primary font-medium hover:underline">Manage →</Link>
        </div>
        <div>
          {kabas.slice(0, 5).map((k, i) => (
            <div
              key={k.id}
              className="flex justify-between items-center px-6 py-3.5 font-inter text-sm transition-colors hover:bg-surface-container-low"
              style={i > 0 ? { borderTop: '1px solid #ECE4CB' } : undefined}
            >
              <span className="font-medium text-on-surface">{k.name}</span>
              <span className="text-on-surface-variant flex items-center gap-3">
                {k.category && <span>{k.category}</span>}
                {k.size && <span>Size {k.size}</span>}
                <span className="font-semibold text-primary">₪{k.pricePerDay}/day</span>
                <span className="text-xs">qty {k.quantity}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
