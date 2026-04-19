import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAll as getOrders } from '../../api/orders'
import { getAll as getKabas } from '../../api/kabas'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'

function StatCard({ label, value, colour }) {
  return (
    <div className={`rounded-xl p-5 ${colour}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
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
  const confirmed = orders.filter(o => o.status === 'CONFIRMED').length
  const active    = orders.filter(o => o.status === 'ACTIVE').length
  const revenue   = orders
    .filter(o => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + Number(o.totalPrice), 0)

  const recent = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total orders"    value={orders.length} colour="bg-white border border-gray-200 text-gray-800" />
        <StatCard label="Pending"         value={pending}       colour="bg-yellow-50 text-yellow-800" />
        <StatCard label="Active rentals"  value={active}        colour="bg-green-50 text-green-800" />
        <StatCard label="Revenue (completed)" value={`₪${revenue.toFixed(0)}`} colour="bg-indigo-50 text-indigo-800" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/admin/orders',    label: '📋 Orders' },
          { to: '/admin/kabas',     label: '👘 Kabas' },
          { to: '/admin/customers', label: '👤 Customers' },
          { to: '/admin/payments',  label: '💳 Payments' },
        ].map(({ to, label }) => (
          <Link
            key={to} to={to}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 transition text-center"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Recent Orders</h2>
          <Link to="/admin/orders" className="text-indigo-600 text-sm hover:underline">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Event date</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">#{o.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{o.customer.fullName}</td>
                  <td className="px-4 py-3 text-gray-600">{o.eventDate}</td>
                  <td className="px-4 py-3 text-gray-800">₪{o.totalPrice}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Inventory summary */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Inventory ({kabas.length} active Kabas)</h2>
          <Link to="/admin/kabas" className="text-indigo-600 text-sm hover:underline">Manage →</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {kabas.slice(0, 5).map(k => (
            <div key={k.id} className="px-5 py-3 flex justify-between items-center text-sm">
              <span className="text-gray-800 font-medium">{k.name}</span>
              <span className="text-gray-500">
                {k.category && <span className="mr-2">{k.category}</span>}
                {k.size && <span className="mr-2">Size {k.size}</span>}
                <span className="text-indigo-700 font-medium">₪{k.pricePerDay}/day</span>
                <span className="ml-3 text-gray-400">qty {k.quantity}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
