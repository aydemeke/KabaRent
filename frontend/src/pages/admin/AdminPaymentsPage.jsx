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
        const paidByOrder = {}
        p.filter(pay => pay.status === 'COMPLETED').forEach(pay => {
          paidByOrder[pay.orderId] = (paidByOrder[pay.orderId] || 0) + Number(pay.amount)
        })
        setUnpaidOrders(o.filter(o =>
          o.status !== 'CANCELLED' && (paidByOrder[o.id] || 0) < Number(o.totalPrice)
        ))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!orderId) { setBalance(null); setAmount(''); return }
    setLoadingBalance(true); setBalance(null); setAmountError('')
    getBalance(orderId)
      .then(b => { setBalance(b); setAmount(Number(b.remainingBalance).toFixed(2)) })
      .finally(() => setLoadingBalance(false))
  }, [orderId])

  function handleAmountChange(val) {
    setAmount(val); setAmountError('')
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
    setSaving(true); setError(''); setSuccess('')
    try {
      await recordPayment({ orderId: Number(orderId), amount: Number(amount), method })
      setSuccess(`Payment of ₪${amount} recorded for order #${orderId}.`)
      setOrderId(''); setAmount(''); setBalance(null); setMethod('CASH'); setAmountError('')
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment.')
    } finally { setSaving(false) }
  }

  if (loading) return <Spinner />

  const noUnpaid = unpaidOrders.length === 0

  return (
    <div className="space-y-8">
      <h1 className="font-jakarta font-bold text-on-surface" style={{ fontSize: '1.75rem', letterSpacing: '-0.01em' }}>
        Payments
      </h1>

      {/* Record payment form */}
      <div className="bg-white rounded-2xl p-6 shadow-ambient border border-outline-variant">
        <h2 className="font-jakarta font-semibold text-on-surface mb-5">Record a Payment</h2>
        <form onSubmit={handleRecord} className="flex flex-wrap gap-4 items-end">

          <div className="flex-1 min-w-48">
            <label className="ds-label block mb-1.5">Order</label>
            <select
              value={orderId}
              onChange={e => { setOrderId(e.target.value); setError('') }}
              required
              disabled={noUnpaid}
              className="ds-select"
              style={noUnpaid ? { background: '#E4DABB', color: '#5A5443' } : undefined}
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
              <p className="mt-1.5 font-inter text-xs text-on-surface-variant">No active unpaid orders at this time</p>
            )}
          </div>

          <div style={{ width: '9rem' }}>
            <label className="ds-label block mb-1.5">Amount (₪)</label>
            <input
              type="number"
              value={amount}
              min="0.01"
              step="0.01"
              max={balance ? Number(balance.remainingBalance).toFixed(2) : undefined}
              required
              disabled={noUnpaid}
              onChange={e => handleAmountChange(e.target.value)}
              className="ds-input"
              style={amountError ? { borderColor: 'rgba(226,74,59,0.40)', background: 'rgba(226,74,59,0.04)' } : undefined}
            />
            {amountError && (
              <p className="mt-1.5 font-inter text-xs" style={{ color: '#B5392D' }}>{amountError}</p>
            )}
          </div>

          <div style={{ width: '11rem' }}>
            <label className="ds-label block mb-1.5">Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} disabled={noUnpaid} className="ds-select">
              {METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving || noUnpaid || !!amountError}
            className={`font-inter font-semibold text-sm rounded-xl px-6 py-2.5 transition-all duration-150 ${
              noUnpaid || amountError
                ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
                : 'ds-btn-primary hover:scale-95 active:scale-90'
            }`}
            style={!noUnpaid && !amountError ? { background: '#1C7C49' } : undefined}
          >
            {saving ? 'Saving…' : 'Record Payment'}
          </button>
        </form>

        {/* Balance summary */}
        {orderId && (
          <div className="mt-5">
            {loadingBalance ? (
              <p className="font-inter text-xs text-on-surface-variant">Loading balance…</p>
            ) : balance && (
              <div className="flex flex-wrap gap-6 rounded-xl px-5 py-4 font-inter text-sm" style={{ background: '#F8F3E7' }}>
                <div>
                  <span className="text-on-surface-variant">Order total:</span>
                  <span className="ml-1.5 font-semibold text-on-surface">₪{Number(balance.totalPrice).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant">Already paid:</span>
                  <span className="ml-1.5 font-semibold text-primary">₪{Number(balance.totalPaid).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant">Remaining:</span>
                  <span className="ml-1.5 font-bold text-on-surface">₪{Number(balance.remainingBalance).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {error   && <p className="mt-4 font-inter text-sm" style={{ color: '#B5392D' }}>{error}</p>}
        {success && <p className="mt-4 font-inter text-sm text-primary font-medium">{success}</p>}
      </div>

      {/* Payments table */}
      <div className="ds-panel">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #ECE4CB' }}>
          <h2 className="font-jakarta font-semibold text-on-surface">Payment History ({payments.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="ds-table-head">
            <th>ID</th><th>Order</th><th>Amount</th><th>Method</th><th>Status</th><th>Paid at</th>
          </tr></thead>
          <tbody className="divide-y" style={{ borderColor: '#ECE4CB' }}>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center font-inter text-on-surface-variant py-12">No payments recorded yet.</td>
              </tr>
            ) : payments.map(p => (
              <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                <td className="px-4 py-3 font-inter text-on-surface-variant text-xs">#{p.id}</td>
                <td className="px-4 py-3 font-inter text-on-surface-variant">#{p.orderId}</td>
                <td className="px-4 py-3 font-inter font-semibold text-on-surface">₪{p.amount}</td>
                <td className="px-4 py-3 font-inter text-on-surface-variant">{p.method.replace('_', ' ')}</td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-xs font-inter font-semibold"
                    style={{ background: 'rgba(28,124,73,0.10)', color: '#1C7C49' }}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-inter text-on-surface-variant text-xs">
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
