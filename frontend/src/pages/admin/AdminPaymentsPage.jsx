import { useEffect, useState } from 'react'
import { getAll as getAllOrders } from '../../api/orders'
import { getAll as getAllPayments, getBalance, create as recordPayment } from '../../api/payments'
import Spinner from '../../components/Spinner'

const METHODS = ['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'BIT', 'PAYBOX']

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([])
  const [unpaidOrders, setUnpaidOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const [orderId, setOrderId] = useState('')
  const [balance, setBalance] = useState(null)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CASH')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [amountError, setAmountError] = useState('')
  const [success, setSuccess] = useState('')

  function load() {
    return Promise.all([getAllPayments(), getAllOrders()])
      .then(([p, o]) => {
        setPayments(p)
        // Build per-order paid totals from COMPLETED payments
        const paidByOrder = {}
        p.filter(pay => pay.status === 'COMPLETED').forEach(pay => {
          paidByOrder[pay.orderId] = (paidByOrder[pay.orderId] || 0) + Number(pay.amount)
        })
        const unpaid = o.filter(o =>
          o.status !== 'CANCELLED' &&
          (paidByOrder[o.id] || 0) < Number(o.totalPrice)
        )
        setUnpaidOrders(unpaid)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Fetch balance detail whenever the selected order changes
  useEffect(() => {
    if (!orderId) { setBalance(null); setAmount(''); return }
    setLoadingBalance(true)
    setBalance(null)
    setAmountError('')
    getBalance(orderId)
      .then(b => {
        setBalance(b)
        setAmount(Number(b.remainingBalance).toFixed(2))
      })
      .finally(() => setLoadingBalance(false))
  }, [orderId])

  function handleAmountChange(val) {
    setAmount(val)
    setAmountError('')
    if (balance && val && Number(val) > Number(balance.remainingBalance)) {
      setAmountError(`Amount cannot exceed remaining balance of ₪${Number(balance.remainingBalance).toFixed(2)}`)
    }
  }

  async function handleRecord(e) {
    e.preventDefault()
    if (!orderId) { setError('Select an order.'); return }
    if (balance && Number(amount) > Number(balance.remainingBalance)) {
      setAmountError(`Amount cannot exceed remaining balance of ₪${Number(balance.remainingBalance).toFixed(2)}`)
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await recordPayment({ orderId: Number(orderId), amount: Number(amount), method })
      setSuccess(`Payment of ₪${amount} recorded for order #${orderId}.`)
      setOrderId('')
      setAmount('')
      setBalance(null)
      setMethod('CASH')
      setAmountError('')
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  const noUnpaid = unpaidOrders.length === 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Payments</h1>

      {/* Record payment form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Record a Payment</h2>
        <form onSubmit={handleRecord} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-40">
            <label className="block text-sm text-gray-600 mb-1">Order</label>
            <select
              value={orderId}
              onChange={e => { setOrderId(e.target.value); setError('') }}
              required
              disabled={noUnpaid}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              style={noUnpaid ? { backgroundColor: '#F3F4F6' } : undefined}
            >
              {noUnpaid
                ? <option value="" disabled>No unpaid orders</option>
                : <>
                    <option value="">— Select order —</option>
                    {unpaidOrders.map(o => (
                      <option key={o.id} value={o.id}>
                        #{o.id} — {o.customer.fullName} — ₪{o.totalPrice} ({o.status})
                      </option>
                    ))}
                  </>
              }
            </select>
            {noUnpaid && (
              <p className="mt-1 text-xs text-gray-400">No active unpaid orders at this time</p>
            )}
          </div>
          <div className="w-40">
            <label className="block text-sm text-gray-600 mb-1">Amount (₪)</label>
            <input
              type="number"
              value={amount}
              min="0.01"
              step="0.01"
              max={balance ? Number(balance.remainingBalance).toFixed(2) : undefined}
              required
              disabled={noUnpaid}
              onChange={e => handleAmountChange(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${amountError ? 'border-red-400' : 'border-gray-300'}`}
            />
            {amountError && (
              <p className="mt-1 text-xs text-red-500">{amountError}</p>
            )}
          </div>
          <div className="w-44">
            <label className="block text-sm text-gray-600 mb-1">Method</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              disabled={noUnpaid}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving || noUnpaid || !!amountError}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              noUnpaid || amountError
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-700 text-white hover:bg-green-800 disabled:opacity-50'
            }`}
          >
            {saving ? 'Saving…' : 'Record Payment'}
          </button>
        </form>

        {/* Balance summary */}
        {orderId && (
          <div className="mt-4">
            {loadingBalance ? (
              <p className="text-xs text-gray-400">Loading balance…</p>
            ) : balance && (
              <div className="flex gap-6 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm">
                <div>
                  <span className="text-gray-500">Order total:</span>
                  <span className="ml-1 font-semibold text-gray-800">₪{Number(balance.totalPrice).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Already paid:</span>
                  <span className="ml-1 font-semibold text-green-700">₪{Number(balance.totalPaid).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Remaining:</span>
                  <span className="ml-1 font-bold text-indigo-700">₪{Number(balance.remainingBalance).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {error   && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-3 text-sm text-green-600">{success}</p>}
      </div>

      {/* Payments table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Payment History ({payments.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Method</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Paid at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-10">No payments recorded yet.</td>
              </tr>
            ) : payments.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">#{p.id}</td>
                <td className="px-4 py-3 text-gray-700">#{p.orderId}</td>
                <td className="px-4 py-3 font-medium text-gray-800">₪{p.amount}</td>
                <td className="px-4 py-3 text-gray-600">{p.method.replace('_', ' ')}</td>
                <td className="px-4 py-3">
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded">
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {p.paidAt ? new Date(p.paidAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
