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
    } finally {
      setLoadingOrders(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
      <p className="text-sm text-gray-500">{customers.length} customer{customers.length !== 1 ? 's' : ''} registered</p>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Registered</th>
              <th className="px-4 py-3 text-left">Orders</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-10">No customers yet.</td>
              </tr>
            ) : customers.map(c => (
              <>
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.fullName}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleExpand(c.id)}
                      className="text-indigo-600 hover:underline text-xs"
                    >
                      {expanded === c.id ? 'Hide orders ▲' : 'View orders ▼'}
                    </button>
                  </td>
                </tr>
                {expanded === c.id && (
                  <tr key={`${c.id}-orders`}>
                    <td colSpan={5} className="bg-indigo-50 px-6 py-4">
                      {loadingOrders && !customerOrders[c.id] ? (
                        <p className="text-sm text-gray-400">Loading…</p>
                      ) : (customerOrders[c.id] || []).length === 0 ? (
                        <p className="text-sm text-gray-400">No orders for this customer.</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead className="text-gray-500">
                            <tr>
                              <th className="text-left py-1 pr-4">Order #</th>
                              <th className="text-left py-1 pr-4">Event date</th>
                              <th className="text-left py-1 pr-4">Items</th>
                              <th className="text-left py-1 pr-4">Total</th>
                              <th className="text-left py-1">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-indigo-100">
                            {customerOrders[c.id].map(o => (
                              <tr key={o.id}>
                                <td className="py-1.5 pr-4 text-gray-600">#{o.id}</td>
                                <td className="py-1.5 pr-4 text-gray-600">{o.eventDate}</td>
                                <td className="py-1.5 pr-4 text-gray-700">
                                  {o.items.map(i => `${i.kabaName} ×${i.quantity}`).join(', ')}
                                </td>
                                <td className="py-1.5 pr-4 font-medium text-gray-800">₪{o.totalPrice}</td>
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
