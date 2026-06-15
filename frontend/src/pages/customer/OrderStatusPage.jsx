import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { getMyOrder } from '../../api/orders'
import { useAuth } from '../../auth/useAuth'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'

const COLOR_NAME_HE = {
  'Black Gold':  'שחור זהב',
  'Red Gold':    'אדום זהב',
  'Black White': 'שחור לבן',
  'White Gold':  'לבן זהב',
  'Blue Gold':   'כחול זהב',
  'Red White':   'אדום לבן',
}

const STATUS_HE = {
  PENDING:   'ממתין לאישור',
  CONFIRMED: 'מאושר',
  ACTIVE:    'פעיל',
  COMPLETED: 'הושלם',
  CANCELLED: 'בוטל',
}

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
  const location = useLocation()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  // Just after checkout the order arrives via router state → render with no fetch.
  const stateOrder = location.state?.order
  const [order, setOrder] = useState(stateOrder ?? null)
  const [loading, setLoading] = useState(!stateOrder)
  const [error, setError] = useState('')

  useEffect(() => {
    if (order) return // already have it (from router state)
    if (!isLoggedIn) {
      // Cold visit (e.g. refresh) with no session: order reads are not public, so send the
      // visitor to register/login — which links their orders by email — and return here after.
      navigate(`/register?redirect=${encodeURIComponent(location.pathname)}`, { replace: true })
      return
    }
    getMyOrder(id)
      .then(setOrder)
      .catch(() => setError('ההזמנה לא נמצאה.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) return <Spinner />
  if (error) return (
    <div className="text-center py-20" dir="rtl">
      <p className="font-inter text-sm mb-4" style={{ color: '#560000' }}>{error}</p>
      <Link to="/" className="ds-btn-text">חזרה לעיון</Link>
    </div>
  )

  const rentalDays = Math.max(1,
    Math.ceil((new Date(order.returnDate) - new Date(order.eventDate)) / 86400000)
  )

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
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
            הזמנה מספר #{order.id} בוצעה!
          </h1>
          <p className="font-inter text-sm text-on-surface-variant">
            הזמנתך במצב <strong className="text-on-surface">{STATUS_HE[order.status] ?? order.status}</strong>. הצוות יאשר אותה בקרוב.
          </p>
        </div>
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(26,28,28,0.06)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(193,200,194,0.25)' }}>
          <span className="font-jakarta font-semibold text-on-surface">הזמנה מספר #{order.id}</span>
          <StatusBadge status={order.status} />
        </div>

        {/* Dates grid */}
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ borderBottom: '1px solid rgba(193,200,194,0.25)' }}>
          <Row label="תאריך אירוע"   value={order.eventDate} />
          <Row label="תאריך החזרה"   value={order.returnDate} />
          <Row label="משך השכרה"     value={`${rentalDays} ${rentalDays === 1 ? 'יום' : 'ימים'}`} />
          <Row label="תאריך הזמנה"   value={new Date(order.createdAt).toLocaleDateString('he-IL')} />
        </div>

        {/* Items */}
        <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(193,200,194,0.25)' }}>
          <p className="ds-label mb-3">פריטים</p>
          <div className="space-y-2">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between font-inter text-sm">
                <span className="text-on-surface">
                  {COLOR_NAME_HE[item.kabaName] ?? item.kabaName}
                  <span className="text-on-surface-variant mr-1">× {item.quantity}</span>
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
          <span className="font-inter font-semibold text-on-surface-variant text-sm">סה״כ</span>
          <span className="font-jakarta font-black text-primary" style={{ fontSize: '1.35rem' }}>₪{order.totalPrice}</span>
        </div>

        {/* Customer */}
        <div className="px-6 py-5">
          <p className="ds-label mb-2">פרטי לקוח</p>
          <p className="font-inter font-medium text-on-surface text-sm">{order.customer.fullName}</p>
          <p className="font-inter text-on-surface-variant text-sm">{order.customer.phone} · {order.customer.email}</p>
        </div>

        {order.notes && (
          <div className="px-6 pb-5 font-inter text-sm" style={{ borderTop: '1px solid rgba(193,200,194,0.25)', paddingTop: '16px' }}>
            <span className="text-on-surface-variant">הערות: </span>
            <span className="text-on-surface">{order.notes}</span>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link to="/" className="ds-btn-text">→ חזרה לעיון</Link>
      </div>
    </div>
  )
}
