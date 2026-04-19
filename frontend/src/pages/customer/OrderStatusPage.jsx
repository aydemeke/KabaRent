import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getById } from '../../api/orders'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'

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
    <div className="text-center py-16">
      <p className="text-red-500 mb-4">{error}</p>
      <Link to="/" className="text-indigo-600 underline text-sm">Back to browse</Link>
    </div>
  )

  const rentalDays = Math.max(1,
    Math.ceil((new Date(order.returnDate) - new Date(order.eventDate)) / 86400000)
  )

  return (
    <div className="max-w-2xl mx-auto">
      {/* Confirmation banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 flex items-start gap-3">
        <span className="text-2xl">✓</span>
        <div>
          <h1 className="font-bold text-green-800 text-lg">Order #{order.id} placed!</h1>
          <p className="text-green-700 text-sm mt-0.5">
            Your order is <strong>{order.status}</strong>. The team will confirm it shortly.
          </p>
        </div>
      </div>

      {/* Order summary card */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between">
          <span className="font-semibold text-gray-800">Order #{order.id}</span>
          <StatusBadge status={order.status} />
        </div>

        {/* Dates */}
        <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 block">Event date</span>
            <span className="font-medium text-gray-800">{order.eventDate}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Return date</span>
            <span className="font-medium text-gray-800">{order.returnDate}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Duration</span>
            <span className="font-medium text-gray-800">{rentalDays} day{rentalDays !== 1 ? 's' : ''}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Placed on</span>
            <span className="font-medium text-gray-800">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Items</h3>
          <div className="space-y-2">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-800">
                  {item.kabaName}
                  <span className="text-gray-400 ml-1">× {item.quantity}</span>
                </span>
                <span className="text-gray-700 font-medium">
                  ₪{(item.unitPrice * rentalDays * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="px-5 py-4 flex justify-between items-center">
          <span className="font-semibold text-gray-700">Total</span>
          <span className="text-indigo-700 font-bold text-lg">₪{order.totalPrice}</span>
        </div>

        {/* Customer */}
        <div className="px-5 py-4 text-sm">
          <h3 className="font-semibold text-gray-600 mb-2">Customer</h3>
          <p className="text-gray-800">{order.customer.fullName}</p>
          <p className="text-gray-500">{order.customer.phone} · {order.customer.email}</p>
        </div>

        {order.notes && (
          <div className="px-5 py-4 text-sm">
            <span className="text-gray-500">Notes: </span>
            <span className="text-gray-700">{order.notes}</span>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link to="/" className="text-indigo-600 text-sm underline">
          ← Back to browse
        </Link>
      </div>
    </div>
  )
}
