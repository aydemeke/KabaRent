import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getById } from '../../api/orders'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'

function Row({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="ds-label mb-0.5">{label}</span>
      <span className="font-inter font-medium text-on-surface text-sm">{value}</span>
    </div>
  )
}

export default function OrderStatusPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getById(id)
      .then(setOrder)
      .catch(() => setError('Order not found.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spinner />
  if (error) return (
    <div className="text-center py-20">
      <p className="font-inter text-sm mb-4" style={{ color: '#560000' }}>{error}</p>
      <Link to="/" className="ds-btn-text">Back to browse</Link>
    </div>
  )

  const rentalDays = Math.max(1,
    Math.ceil((new Date(order.returnDate) - new Date(order.eventDate)) / 86400000)
  )

  return (
    <div className="max-w-2xl mx-auto">
      {/* Confirmation banner */}
      <div
        className="rounded-2xl px-6 py-5 mb-6 flex items-start gap-4"
        style={{ background: 'rgba(1,45,29,0.08)' }}
      >
        <span
          className="font-inter font-bold text-white flex-shrink-0 flex items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: '50%', background: '#012d1d', fontSize: '16px' }}
        >
          ✓
        </span>
        <div>
          <h1 className="font-jakarta font-bold text-primary" style={{ fontSize: '1.1rem', marginBottom: '2px' }}>
            Order #{order.id} placed!
          </h1>
          <p className="font-inter text-sm text-on-surface-variant">
            Your order is <strong className="text-on-surface">{order.status}</strong>. The team will confirm it shortly.
          </p>
        </div>
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(26,28,28,0.06)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(193,200,194,0.25)' }}>
          <span className="font-jakarta font-semibold text-on-surface">Order #{order.id}</span>
          <StatusBadge status={order.status} />
        </div>

        {/* Dates grid */}
        <div className="px-6 py-5 grid grid-cols-2 gap-5" style={{ borderBottom: '1px solid rgba(193,200,194,0.25)' }}>
          <Row label="Event date"  value={order.eventDate} />
          <Row label="Return date" value={order.returnDate} />
          <Row label="Duration"    value={`${rentalDays} day${rentalDays !== 1 ? 's' : ''}`} />
          <Row label="Placed on"   value={new Date(order.createdAt).toLocaleDateString()} />
        </div>

        {/* Items */}
        <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(193,200,194,0.25)' }}>
          <p className="ds-label mb-3">Items</p>
          <div className="space-y-2">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between font-inter text-sm">
                <span className="text-on-surface">
                  {item.kabaName}
                  <span className="text-on-surface-variant ml-1">× {item.quantity}</span>
                </span>
                <span className="font-medium text-on-surface">
                  ₪{(item.unitPrice * rentalDays * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(193,200,194,0.25)' }}>
          <span className="font-inter font-semibold text-on-surface-variant text-sm">Total</span>
          <span className="font-jakarta font-black text-primary" style={{ fontSize: '1.35rem' }}>₪{order.totalPrice}</span>
        </div>

        {/* Customer */}
        <div className="px-6 py-5">
          <p className="ds-label mb-2">Customer</p>
          <p className="font-inter font-medium text-on-surface text-sm">{order.customer.fullName}</p>
          <p className="font-inter text-on-surface-variant text-sm">{order.customer.phone} · {order.customer.email}</p>
        </div>

        {order.notes && (
          <div className="px-6 pb-5 font-inter text-sm" style={{ borderTop: '1px solid rgba(193,200,194,0.25)', paddingTop: '16px' }}>
            <span className="text-on-surface-variant">Notes: </span>
            <span className="text-on-surface">{order.notes}</span>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link to="/" className="ds-btn-text">← Back to browse</Link>
      </div>
    </div>
  )
}
