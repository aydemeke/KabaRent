import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getAll, checkAvailability } from '../../api/kabas'
import { create as createCustomer } from '../../api/customers'
import { create as createOrder } from '../../api/orders'
import Spinner from '../../components/Spinner'
import DateInput from '../../components/DateInput'

const today = new Date().toISOString().split('T')[0]

function SectionCard({ step, title, children }) {
  return (
    <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(26,28,28,0.06)' }}>
      <div className="flex items-center gap-3 mb-5">
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

  const [kabas, setKabas] = useState([])
  const [kabaId, setKabaId] = useState(searchParams.get('kabaId') || '')
  const [eventDate, setEventDate] = useState(searchParams.get('eventDate') || today)
  const [returnDate, setReturnDate] = useState(searchParams.get('returnDate') || '')
  const [availability, setAvailability] = useState(null)
  const [quantity, setQuantity] = useState(1)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loadingKabas, setLoadingKabas] = useState(true)

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
    if (!kabaId) { setError('Please select a Kaba.'); return }
    if (!eventDate || !returnDate) { setError('Please select event and return dates.'); return }
    if (availability && !availability.available) {
      setError('This Kaba is not available for the selected dates.')
      return
    }
    setSubmitting(true)
    try {
      const customer = await createCustomer({ fullName, phone, email })
      const order = await createOrder({
        customerId: customer.id,
        eventDate, returnDate, notes,
        items: [{ kabaId: Number(kabaId), quantity }],
      })
      navigate(`/order/${order.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingKabas) return <Spinner />

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-jakarta font-bold text-on-surface mb-8" style={{ fontSize: '1.75rem', letterSpacing: '-0.01em' }}>
        New Rental Order
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Kaba selector */}
        <SectionCard step="1" title="Select a Kaba">
          <select
            value={kabaId}
            onChange={e => setKabaId(e.target.value)}
            required
            disabled={kabas.length === 0}
            className="ds-select"
            style={kabas.length === 0 ? { background: '#e2e2e2', color: '#414844' } : undefined}
          >
            {kabas.length === 0
              ? <option value="" disabled>No Kabas available</option>
              : <>
                  <option value="">— Choose a Kaba —</option>
                  {kabas.map(k => (
                    <option key={k.id} value={k.id}>
                      {k.name} {k.size ? `(${k.size})` : ''} — ₪{k.pricePerDay}/day
                    </option>
                  ))}
                </>
            }
          </select>
        </SectionCard>

        {/* Dates */}
        <SectionCard step="2" title="Rental Dates">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="ds-label block mb-1.5">Event Date</label>
              <DateInput
                value={eventDate}
                placeholder="Select event date"
                min={today}
                required
                onChange={e => setEventDate(e.target.value)}
                onFocus={() => setEventDate('')}
                className="w-full"
              />
            </div>
            <div>
              <label className="ds-label block mb-1.5">Return Date</label>
              <DateInput
                value={returnDate}
                placeholder="Select return date"
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
                ? `✓ Available — ${availability.availableQuantity} unit${availability.availableQuantity !== 1 ? 's' : ''} free`
                : '✗ Not available for these dates'}
            </div>
          )}

          {availability?.available && (
            <div className="mt-4 flex items-center gap-6">
              <div>
                <label className="ds-label block mb-1.5">Quantity</label>
                <input
                  type="number" min={1} max={availability.availableQuantity}
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="ds-input"
                  style={{ width: '5rem' }}
                />
              </div>
              {estimatedTotal && (
                <div className="font-inter text-sm text-on-surface-variant">
                  {rentalDays} day{rentalDays !== 1 ? 's' : ''} × ₪{selectedKaba.pricePerDay} × {quantity} =&nbsp;
                  <span className="font-bold text-primary">₪{estimatedTotal}</span>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* Customer details */}
        <SectionCard step="3" title="Your Details">
          <div className="space-y-4">
            <div>
              <label className="ds-label block mb-1.5">Full name</label>
              <input
                type="text" value={fullName} required
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Sara Cohen"
                className="ds-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="ds-label block mb-1.5">Phone</label>
                <input
                  type="tel" value={phone} required
                  onChange={e => setPhone(e.target.value)}
                  placeholder="050-0000000"
                  className="ds-input"
                />
              </div>
              <div>
                <label className="ds-label block mb-1.5">Email</label>
                <input
                  type="email" value={email} required
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="ds-input"
                />
              </div>
            </div>
            <div>
              <label className="ds-label block mb-1.5">Notes (optional)</label>
              <textarea
                value={notes} rows={2}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any special requests..."
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

        <button
          type="submit"
          disabled={submitting}
          className="ds-btn-primary w-full py-3.5 text-base"
        >
          {submitting ? 'Placing order…' : 'Place Order'}
        </button>
      </form>
    </div>
  )
}
