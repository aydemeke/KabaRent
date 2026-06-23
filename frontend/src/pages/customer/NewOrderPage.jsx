import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getAll, checkAvailability } from '../../api/kabas'
import { create as createOrder } from '../../api/orders'
import { useAuth } from '../../auth/useAuth'
import Spinner from '../../components/Spinner'
import DateInput from '../../components/DateInput'

const COLOR_NAME_HE = {
  'Black Gold':  'שחור זהב',
  'Red Gold':    'אדום זהב',
  'Black White': 'שחור לבן',
  'White Gold':  'לבן זהב',
  'Blue Gold':   'כחול זהב',
  'Red White':   'אדום לבן',
}

const SIZE_HE = { Small: 'קטנה', Medium: 'בינונית', Large: 'גדולה' }

const today = new Date().toISOString().split('T')[0]

function SectionCard({ step, title, children }) {
  return (
    <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(26,28,28,0.06)' }}>
      <div className="flex items-center gap-3 mb-5" dir="rtl">
        <span
          className="font-inter font-bold text-sm text-white flex-shrink-0 flex items-center justify-center"
          style={{ width: 28, height: 28, borderRadius: '50%', background: '#012d1d' }}
        >
          {step}
        </span>
        <h2 className="font-jakarta font-semibold text-on-surface" style={{ fontSize: '1rem' }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function NewOrderPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const [kabas, setKabas] = useState([])
  const [kabaId, setKabaId] = useState(searchParams.get('kabaId') || '')
  const [eventDate, setEventDate] = useState(searchParams.get('eventDate') || today)
  const [returnDate, setReturnDate] = useState(searchParams.get('returnDate') || '')
  const [availability, setAvailability] = useState(null)
  const [quantity, setQuantity] = useState(1)

  // Identity comes from the authenticated session (the route is guarded by RequireCustomer,
  // so `user` is always present); the order is attached to this customer server-side from the JWT.
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loadingKabas, setLoadingKabas] = useState(true)

  // One idempotency key per checkout attempt, stable across re-renders and retries of the SAME
  // submission (the lazy initializer runs once), so double-clicks / cold-start retries dedupe to a
  // single order. Rotated only after a successful submit (see handleSubmit) so a subsequent, genuinely
  // new order on this same mounted page gets a fresh key instead of being deduped to the first.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())

  useEffect(() => {
    getAll().then(setKabas).finally(() => setLoadingKabas(false))
  }, [])

  useEffect(() => {
    if (!kabaId || !eventDate || !returnDate) { setAvailability(null); return }
    checkAvailability(kabaId, eventDate, returnDate)
      .then(setAvailability)
      .catch(() => setAvailability(null))
  }, [kabaId, eventDate, returnDate])

  const rentalDays = eventDate && returnDate
    ? Math.max(1, Math.ceil((new Date(returnDate) - new Date(eventDate)) / 86400000))
    : 0

  const selectedKaba = kabas.find(k => String(k.id) === String(kabaId))
  const estimatedTotal = selectedKaba
    ? (selectedKaba.pricePerDay * rentalDays * quantity).toFixed(2)
    : null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!kabaId) { setError('יש לבחור קאבה.'); return }
    if (!eventDate || !returnDate) { setError('יש לבחור תאריכי אירוע והחזרה.'); return }
    if (availability && !availability.available) {
      setError('הקאבה אינה זמינה לתאריכים שנבחרו.')
      return
    }
    setSubmitting(true)
    try {
      // The order is attached to the authenticated customer server-side (from the JWT); no
      // customer details are sent from the client.
      const order = await createOrder({
        eventDate, returnDate, notes,
        items: [{ kabaId: Number(kabaId), quantity }],
      }, { headers: { 'Idempotency-Key': idempotencyKey } })
      // Success only: rotate the key so a further new order from this same mount isn't deduped to
      // this one. A failed submit deliberately keeps the current key so its retry stays idempotent.
      setIdempotencyKey(crypto.randomUUID())
      // Pass the created order via router state so the status page renders without a fetch
      // (GET /api/orders/{id} is admin-only; sequential ids must never be publicly readable).
      navigate(`/order/${order.id}`, { state: { order } })
    } catch (err) {
      setError(err.response?.status === 400
        ? 'מספר טלפון לא תקין'
        : (err.response?.data?.error || 'אירעה שגיאה. אנא נסה שוב.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingKabas) return <Spinner />

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <h1 className="font-jakarta font-bold text-on-surface mb-8" style={{ fontSize: '1.75rem', letterSpacing: '-0.01em' }}>
        הזמנת השכרה חדשה
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Kaba selector */}
        <SectionCard step="1" title="בחר קאבה">
          <select
            value={kabaId}
            onChange={e => setKabaId(e.target.value)}
            required
            disabled={kabas.length === 0}
            aria-label="בחר קאבה"
            className="ds-select"
            style={kabas.length === 0 ? { background: '#e2e2e2', color: '#414844' } : undefined}
          >
            {kabas.length === 0
              ? <option value="" disabled>אין קאבות זמינות</option>
              : <>
                  <option value="">— בחר קאבה —</option>
                  {kabas.map(k => (
                    <option key={k.id} value={k.id}>
                      {COLOR_NAME_HE[k.name] ?? k.name} {k.size ? `(${SIZE_HE[k.size] ?? k.size})` : ''} — ₪{k.pricePerDay}/יום
                    </option>
                  ))}
                </>
            }
          </select>
        </SectionCard>

        {/* Dates */}
        <SectionCard step="2" title="תאריכי השכרה">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="order-event-date" className="ds-label block mb-1.5">תאריך אירוע</label>
              <DateInput
                id="order-event-date"
                value={eventDate}
                placeholder="בחר תאריך"
                min={today}
                required
                onChange={e => setEventDate(e.target.value)}
                onFocus={() => setEventDate('')}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="order-return-date" className="ds-label block mb-1.5">תאריך החזרה</label>
              <DateInput
                id="order-return-date"
                value={returnDate}
                placeholder="בחר תאריך"
                min={eventDate || today}
                required
                onChange={e => setReturnDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {availability && (
            <div
              className="mt-4 text-sm px-4 py-3 rounded-xl font-inter font-medium"
              style={availability.available
                ? { background: 'rgba(1,45,29,0.08)', color: '#012d1d' }
                : { background: 'rgba(86,0,0,0.08)', color: '#560000' }
              }
            >
              {availability.available
                ? `✓ זמין — ${availability.availableQuantity} יחידות פנויות`
                : '✗ לא זמין לתאריכים אלו'}
            </div>
          )}

          {availability?.available && (
            <div className="mt-4 flex items-center gap-6">
              <div>
                <label htmlFor="order-quantity" className="ds-label block mb-1.5">כמות</label>
                <input
                  id="order-quantity"
                  type="number" min={1} max={availability.availableQuantity}
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="ds-input"
                  style={{ width: '5rem' }}
                />
              </div>
              {estimatedTotal && (
                <div className="font-inter text-sm text-on-surface-variant">
                  {rentalDays} ימים × ₪{selectedKaba.pricePerDay} × {quantity} =&nbsp;
                  <span className="font-bold text-primary">₪{estimatedTotal}</span>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* Customer details */}
        <SectionCard step="3" title="פרטי לקוח">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="ds-label block mb-1.5">שם מלא</span>
                <p className="font-inter text-on-surface" style={{ fontWeight: 600 }}>{user?.fullName}</p>
              </div>
              <div>
                <span className="ds-label block mb-1.5">טלפון</span>
                <p className="font-inter text-on-surface" style={{ fontWeight: 600 }} dir="ltr">{user?.phone}</p>
              </div>
            </div>
            <p className="font-inter text-xs text-on-surface-variant">
              ההזמנה תשויך לחשבון שלך. לעדכון השם או הטלפון פנו אלינו.
            </p>
            <div>
              <label htmlFor="order-notes" className="ds-label block mb-1.5">הערות (אופציונלי)</label>
              <textarea
                id="order-notes"
                value={notes} rows={2}
                onChange={e => setNotes(e.target.value)}
                placeholder="בקשות מיוחדות..."
                className="ds-input resize-none"
              />
            </div>
          </div>
        </SectionCard>

        {error && (
          <div className="rounded-xl px-4 py-3 font-inter text-sm" style={{ background: 'rgba(86,0,0,0.08)', color: '#560000' }}>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3.5 text-base rounded-xl font-inter font-medium transition-colors"
            style={{ background: '#f3f4f3', color: '#414844', border: 'none', cursor: 'pointer' }}
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="ds-btn-primary flex-1 py-3.5 text-base"
          >
            {submitting ? 'שולח הזמנה…' : 'שלח הזמנה'}
          </button>
        </div>
      </form>
    </div>
  )
}
