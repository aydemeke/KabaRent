import useModalA11y from '../hooks/useModalA11y'

// Checkout auth gate (Hebrew RTL): shown when a logged-out visitor clicks "הזמן".
// Ordering requires an account, so the gate offers only log in or register. The in-progress
// order intent (kaba id + dates) is preserved by BrowsePage via the existing login/register
// `redirect` query-param mechanism, so either path lands the visitor back on the
// prefilled order form with their selection intact.
export default function CheckoutAuthGate({ onLogin, onRegister, onClose }) {
  const dialogRef = useModalA11y(onClose)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-gate-title"
        aria-describedby="checkout-gate-desc"
        tabIndex={-1}
        dir="rtl"
        className="bg-white w-full"
        style={{ maxWidth: '420px', borderRadius: '20px', padding: '28px 24px 22px' }}
      >
        <h2
          id="checkout-gate-title"
          className="font-jakarta font-bold text-on-surface"
          style={{ fontSize: '1.25rem', marginBottom: '8px' }}
        >
          איך תרצו להמשיך?
        </h2>
        <p
          id="checkout-gate-desc"
          className="font-inter text-on-surface-variant"
          style={{ fontSize: '0.875rem', lineHeight: 1.55, marginBottom: '22px' }}
        >
          כדי להזמין יש להתחבר או להירשם. כך תוכלו גם לעקוב אחר ההזמנות שלכם במקום אחד.
        </p>

        <div className="flex flex-col" style={{ gap: '10px' }}>
          <button
            type="button"
            onClick={onLogin}
            className="ds-btn-primary w-full"
            style={{ minHeight: '44px', padding: '0.75rem 1.5rem', fontSize: '0.9375rem' }}
          >
            התחבר
          </button>

          <button
            type="button"
            onClick={onRegister}
            className="ds-btn-ghost w-full"
            style={{ minHeight: '44px', borderRadius: '0.75rem', fontSize: '0.9375rem' }}
          >
            הירשם
          </button>
        </div>
      </div>
    </div>
  )
}