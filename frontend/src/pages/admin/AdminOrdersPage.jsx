import { useEffect, useState } from 'react'
import { getAll, updateStatus } from '../../api/orders'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'

const STATUSES = ['', 'PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED']

function nextActions(status) {
  switch (status) {
    case 'PENDING':   return [{ label: 'Confirm',  next: 'CONFIRMED', color: '#1C7C49' },
                              { label: 'Cancel',   next: 'CANCELLED', color: '#B5392D' }]
    case 'CONFIRMED': return [{ label: 'Activate', next: 'ACTIVE',    color: '#1C7C49' },
                              { label: 'Cancel',   next: 'CANCELLED', color: '#B5392D' }]
    case 'ACTIVE':    return [{ label: 'Complete', next: 'COMPLETED', color: '#5A5443' }]
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
    getAll(statusFilter || undefined).then(setOrders).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter])

  async function handleAction(orderId, nextStatus) {
    setUpdating(orderId)
    try {
      const updated = await updateStatus(orderId, nextStatus)
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o))
    } finally { setUpdating(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-jakarta font-bold text-on-surface" style={{ fontSize: '1.75rem', letterSpacing: '-0.01em' }}>
          Orders
        </h1>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="ds-select"
          style={{ width: 'auto', minWidth: '160px' }}
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>{s || 'All statuses'}</option>
          ))}
        </select>
      </div>

      {loading ? <Spinner /> : (
        <div className="ds-panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="ds-table-head">
              <th>ID</th><th>Customer</th><th>Event date</th><th>Return date</th>
              <th>Items</th><th>Total</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody className="divide-y" style={{ borderColor: '#ECE4CB' }}>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center font-inter text-on-surface-variant py-12">No orders found.</td>
                </tr>
              ) : orders.map(o => (
                <tr key={o.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-3 font-inter text-on-surface-variant text-xs">#{o.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-inter font-medium text-on-surface">{o.customer.fullName}</div>
                    <div className="font-inter text-xs text-on-surface-variant">{o.customer.phone}</div>
                  </td>
                  <td className="px-4 py-3 font-inter text-on-surface-variant">{o.eventDate}</td>
                  <td className="px-4 py-3 font-inter text-on-surface-variant">{o.returnDate}</td>
                  <td className="px-4 py-3 font-inter text-on-surface-variant">
                    {o.items.map(i => <div key={i.id}>{i.kabaName} ×{i.quantity}</div>)}
                  </td>
                  <td className="px-4 py-3 font-inter font-semibold text-on-surface">₪{o.totalPrice}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {nextActions(o.status).map(({ label, next, color }) => (
                        <button
                          key={next}
                          disabled={updating === o.id}
                          onClick={() => handleAction(o.id, next)}
                          className="font-inter text-xs font-semibold hover:underline disabled:opacity-40 text-left"
                          style={{ color }}
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
