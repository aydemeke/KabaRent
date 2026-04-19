import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getAll, checkAvailability } from '../../api/kabas'
import { create as createCustomer } from '../../api/customers'
import { create as createOrder } from '../../api/orders'
import Spinner from '../../components/Spinner'
import DateInput from '../../components/DateInput'

const today = new Date().toISOString().split('T')[0]

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

  // Load kaba list for the selector
  useEffect(() => {
    getAll().then(setKabas).finally(() => setLoadingKabas(false))
  }, [])

  // Re-check availability whenever kaba + dates change
  useEffect(() => {
    if (!kabaId || !eventDate || !returnDate) {
      setAvailability(null)
      return
    }
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
        eventDate,
        returnDate,
        notes,
        items: [{ kabaId: Number(kabaId), quantity }],
      })
      navigate(`/order/${order.id}`)
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingKabas) return <Spinner />

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">New Rental Order</h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Kaba selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">1. Select a Kaba</h2>
          <select
            value={kabaId}
            onChange={e => setKabaId(e.target.value)}
            required
            disabled={kabas.length === 0}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            style={kabas.length === 0 ? { backgroundColor: '#F3F4F6' } : undefined}
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
        </div>

        {/* Dates */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">2. Rental Dates</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Event Date</label>
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
              <label className="block text-sm text-gray-600 mb-1">Return Date</label>
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

          {/* Availability indicator */}
          {availability && (
            <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${
              availability.available
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {availability.available
                ? `✓ Available — ${availability.availableQuantity} unit${availability.availableQuantity !== 1 ? 's' : ''} free`
                : '✗ Not available for these dates'}
            </div>
          )}

          {/* Quantity + summary */}
          {availability?.available && (
            <div className="mt-4 flex items-center gap-6">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Quantity</label>
                <input
                  type="number" min={1} max={availability.availableQuantity}
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              {estimatedTotal && (
                <div className="text-sm text-gray-600">
                  {rentalDays} day{rentalDays !== 1 ? 's' : ''} × ₪{selectedKaba.pricePerDay} × {quantity} =
                  <span className="font-bold text-indigo-700 ml-1">₪{estimatedTotal}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">3. Your Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full name</label>
              <input
                type="text" value={fullName} required
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Sara Cohen"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone</label>
                <input
                  type="tel" value={phone} required
                  onChange={e => setPhone(e.target.value)}
                  placeholder="050-0000000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email" value={email} required
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Notes (optional)</label>
              <textarea
                value={notes} rows={2}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any special requests..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {submitting ? 'Placing order…' : 'Place Order'}
        </button>
      </form>
    </div>
  )
}
