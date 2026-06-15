import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getMyOrder, getMyOrderBalance, cancelMyOrder } from '../../api/orders'
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

function formatDate(iso) {
  return iso ? iso.split('-').reverse().join('/') : ''
}

function Row({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="ds-label mb-0.5">{label}</span>
      <span className="font-inter font-medium text-on-surface text-sm">{value}</span>
    </div>
  )
}

export default function MyOrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    Promise.all([getMyOrder(id), getMyOrderBalance(id)])
      .then(([o, b]) => { setOrder(o); setBalance(b) })
      .catch(() => setError('ההזמנה לא נמצאה.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleCancel() {
    if (!window.confirm('לבטל את ההזמנה? לא ניתן לשחזר פעולה זו.')) return
    setActionError('')
    setCancelling(true)
    try {
      const updated = await cancelMyOrder(id)
      setOrder(updated)
    } catch (err) {
      setActionError(err.response?.data?.error || 'לא ניתן לבטל את ההזמנה.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <Spinner />
  if (error) return (
    <div className="text-center py-20" dir="rtl">
      <p className="font-inter text-sm mb-4" style={{ color: '#560000' }}>{error}</p>
      <Link to="/customer/orders" className="ds-btn-text">חזרה להזמנות שלי</Link>
    </div>
  )

  const rentalDays = Math.max(1,
    Math.ceil((new Date(order.returnDate) - new Date(order.eventDate)) / 86400000)
  )

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(26,28,28,0.06)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(193,200,194,0.25)' }}>
          <span className="font-jakarta font-semibold text-on-surface">הזמנה מספר #{order.id}</span>
          <StatusBadge status={order.status} />
        </div>

        {/* Dates */}
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ borderBottom: '1px solid rgba(193,200,194,0.25)' }}>
          <Row label="תאריך אירוע"  value={formatDate(order.eventDate)} />
          <Row label="תאריך החזרה"  value={formatDate(order.returnDate)} />
          <Row label="משך השכרה"    value={`${rentalDays} ${rentalDays === 1 ? 'יום' : 'ימים'}`} />
          <Row label="תאריך הזמנה"  value={new Date(order.createdAt).toLocaleDateString('he-IL')} />
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

        {/* Payment summary */}
        <div className="px-6 py-5 space-y-2" style={{ borderBottom: '1px solid rgba(193,200,194,0.25)' }}>
          <div className="flex justify-between font-inter text-sm">
            <span className="text-on-surface-variant">סה״כ</span>
            <span className="font-semibold text-on-surface">₪{order.totalPrice}</span>
          </div>
          {balance && (
            <>
              <div className="flex justify-between font-inter text-sm">
                <span className="text-on-surface-variant">שולם</span>
                <span className="font-medium text-on-surface">₪{balance.totalPaid}</span>
              </div>
              <div className="flex justify-between font-inter text-sm">
                <span className="text-on-surface-variant">יתרה לתשלום</span>
                <span className="font-bold text-primary">₪{balance.remainingBalance}</span>
              </div>
            </>
          )}
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

      {/* Cancellation: PENDING → self-cancel; CONFIRMED → contact us; otherwise nothing */}
      {actionError && (
        <div className="rounded-xl px-4 py-3 font-inter text-sm mt-4" style={{ background: 'rgba(86,0,0,0.08)', color: '#560000' }}>
          {actionError}
        </div>
      )}

      {order.status === 'PENDING' && (
        <button
          type="button"
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full mt-4 py-3.5 text-base rounded-xl font-inter font-medium transition-colors"
          style={{ background: 'rgba(86,0,0,0.08)', color: '#560000', border: 'none', cursor: 'pointer' }}
        >
          {cancelling ? 'מבטל…' : 'ביטול הזמנה'}
        </button>
      )}

      {order.status === 'CONFIRMED' && (
        <div className="rounded-xl px-4 py-3 font-inter text-sm mt-4" style={{ background: '#f3f4f3', color: '#414844' }}>
          לביטול הזמנה מאושרת אנא צרו איתנו קשר.
        </div>
      )}

      <div className="mt-8 text-center">
        <Link to="/customer/orders" className="ds-btn-text">→ חזרה להזמנות שלי</Link>
      </div>
    </div>
  )
}
