export default function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ borderRadius: '2rem', boxShadow: '0 24px 48px rgba(1,45,29,0.18)', padding: '32px' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-jakarta font-bold text-on-surface text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low"
          >
            ×
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}
