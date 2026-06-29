import { useEffect, useState } from 'react'
import { getAll } from '../../api/customers'
import { getByCustomer } from '../../api/orders'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [customerOrders, setCustomerOrders] = useState({})
  const [loadingOrders, setLoadingOrders] = useState(false)

  useEffect(() => {
    getAll().then(setCustomers).finally(() => setLoading(false))
  }, [])

  async function toggleExpand(id) {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (customerOrders[id]) return
    setLoadingOrders(true)
    try {
      const orders = await getByCustomer(id)
      setCustomerOrders(prev => ({ ...prev, [id]: orders }))
    } finally { setLoadingOrders(false) }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-jakarta font-bold text-on-surface" style={{ fontSize: '1.75rem', letterSpacing: '-0.01em' }}>
          Customers
        </h1>
        <p className="font-inter text-sm text-on-surface-variant mt-1">
          {customers.length} customer{customers.length !== 1 ? 's' : ''} registered
        </p>
      </div>

      <div className="ds-panel">
        <table className="w-full text-sm">
          <thead><tr className="ds-table-head">
            <th>Name</th><th>Phone</th><th>Email</th><th>Registered</th><th>Orders</th>
          </tr></thead>
          <tbody className="divide-y" style={{ borderColor: '#ECE4CB' }}>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center font-inter text-on-surface-variant py-12">No customers yet.</td>
              </tr>
            ) : customers.map(c => (
              <>
                <tr key={c.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-3 font-inter font-medium text-on-surface">{c.fullName}</td>
                  <td className="px-4 py-3 font-inter text-on-surface-variant">{c.phone}</td>
                  <td className="px-4 py-3 font-inter text-on-surface-variant">{c.email}</td>
                  <td className="px-4 py-3 font-inter text-on-surface-variant text-xs">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleExpand(c.id)}
                      className="font-inter text-xs font-semibold text-primary hover:underline"
                    >
                      {expanded === c.id ? 'Hide ▲' : 'View orders ▼'}
                    </button>
                  </td>
                </tr>
                {expanded === c.id && (
                  <tr key={`${c.id}-orders`}>
                    <td colSpan={5} className="px-6 py-4" style={{ background: '#F8F3E7' }}>
                      {loadingOrders && !customerOrders[c.id] ? (
                        <p className="font-inter text-sm text-on-surface-variant">Loading…</p>
                      ) : (customerOrders[c.id] || []).length === 0 ? (
                        <p className="font-inter text-sm text-on-surface-variant">No orders for this customer.</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead className="font-inter font-semibold text-on-surface-variant uppercase tracking-wide">
                            <tr>
                              <th className="text-left py-1 pr-4">Order #</th>
                              <th className="text-left py-1 pr-4">Event date</th>
                              <th className="text-left py-1 pr-4">Items</th>
                              <th className="text-left py-1 pr-4">Total</th>
                              <th className="text-left py-1">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y" style={{ borderColor: '#ECE4CB' }}>
                            {customerOrders[c.id].map(o => (
                              <tr key={o.id}>
                                <td className="py-1.5 pr-4 font-inter text-on-surface-variant">#{o.id}</td>
                                <td className="py-1.5 pr-4 font-inter text-on-surface-variant">{o.eventDate}</td>
                                <td className="py-1.5 pr-4 font-inter text-on-surface">
                                  {o.items.map(i => `${i.kabaName} ×${i.quantity}`).join(', ')}
                                </td>
                                <td className="py-1.5 pr-4 font-inter font-semibold text-on-surface">₪{o.totalPrice}</td>
                                <td className="py-1.5"><StatusBadge status={o.status} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
