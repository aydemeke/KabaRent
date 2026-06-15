import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrders } from '../../api/orders'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'

function formatDate(iso) {
  return iso ? iso.split('-').reverse().join('/') : ''
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .catch(() => setError('לא ניתן לטעון את ההזמנות כעת.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <h1 className="font-jakarta font-bold text-on-surface mb-6 mt-4" style={{ fontSize: '1.75rem', letterSpacing: '-0.01em' }}>
        ההזמנות שלי
      </h1>

      {error && (
        <div className="rounded-xl px-4 py-3 font-inter text-sm mb-4" style={{ background: 'rgba(86,0,0,0.08)', color: '#560000' }}>
          {error}
        </div>
      )}

      {!error && orders.length === 0 && (
        <div className="text-center py-16">
          <p className="font-inter text-sm text-on-surface-variant mb-4">עדיין אין לכם הזמנות.</p>
          <Link to="/" className="ds-btn-text">→ לעיון בקאבות</Link>
        </div>
      )}

      <div className="space-y-3">
        {orders.map(order => (
          <Link
            key={order.id}
            to={`/customer/orders/${order.id}`}
            className="block bg-white rounded-2xl px-5 py-4 transition-transform hover:scale-[0.99]"
            style={{ boxShadow: '0 2px 16px rgba(26,28,28,0.06)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-jakarta font-semibold text-on-surface">הזמנה מספר #{order.id}</span>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center justify-between font-inter text-sm text-on-surface-variant">
              <span>{formatDate(order.eventDate)} – {formatDate(order.returnDate)}</span>
              <span className="font-bold text-primary">₪{order.totalPrice}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
