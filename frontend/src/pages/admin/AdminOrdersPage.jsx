import { useEffect, useState } from 'react'
import { getAll, updateStatus } from '../../api/orders'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'

const STATUSES = ['', 'PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED']

// Returns the valid next actions for a given status
function nextActions(status) {
  switch (status) {
    case 'PENDING':   return [{ label: 'Confirm', next: 'CONFIRMED', style: 'text-blue-600' },
                              { label: 'Cancel',  next: 'CANCELLED', style: 'text-red-500' }]
    case 'CONFIRMED': return [{ label: 'Activate', next: 'ACTIVE',     style: 'text-green-600' },
                              { label: 'Cancel',   next: 'CANCELLED',  style: 'text-red-500' }]
    case 'ACTIVE':    return [{ label: 'Complete', next: 'COMPLETED',  style: 'text-gray-600' }]
    default:          return []
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [updating, setUpdating] = useState(null)

  function load() {
    setLoading(true)
    getAll(statusFilter || undefined)
      .then(setOrders)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter])

  async function handleAction(orderId, nextStatus) {
    setUpdating(orderId)
    try {
      const updated = await updateStatus(orderId, nextStatus)
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o))
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>{s || 'All statuses'}</option>
          ))}
        </select>
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Event date</th>
                <th className="px-4 py-3 text-left">Return date</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 py-10">No orders found.</td>
                </tr>
              ) : orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">#{o.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{o.customer.fullName}</div>
                    <div className="text-gray-400 text-xs">{o.customer.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{o.eventDate}</td>
                  <td className="px-4 py-3 text-gray-600">{o.returnDate}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {o.items.map(i => (
                      <div key={i.id}>{i.kabaName} ×{i.quantity}</div>
                    ))}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">₪{o.totalPrice}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {nextActions(o.status).map(({ label, next, style }) => (
                        <button
                          key={next}
                          disabled={updating === o.id}
                          onClick={() => handleAction(o.id, next)}
                          className={`text-xs font-medium hover:underline disabled:opacity-40 ${style}`}
                        >
                          {updating === o.id ? '…' : label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
