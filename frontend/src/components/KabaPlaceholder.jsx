export default function KabaPlaceholder() {
  return (
    <div
      className="h-40 relative overflow-hidden flex flex-col items-center justify-center select-none"
      style={{ background: 'linear-gradient(160deg, #0c3318 0%, #1a5c2a 55%, #0c3318 100%)' }}
    >
      {/* Top tilet stripe */}
      <div className="absolute top-0 inset-x-0 flex h-2">
        <div className="flex-1" style={{ background: '#078930' }} />
        <div className="flex-1" style={{ background: '#FCDD09' }} />
        <div className="flex-1" style={{ background: '#DA121A' }} />
        <div className="flex-1" style={{ background: '#FCDD09' }} />
        <div className="flex-1" style={{ background: '#078930' }} />
      </div>

      {/* Habesha Kemis / Kaba silhouette */}
      <svg viewBox="0 0 64 88" className="w-14 h-20 z-10" aria-hidden="true">
        {/* Dress body — white like traditional habesha kemis */}
        <path
          d="M22 22 L14 36 L10 76 L54 76 L50 36 L42 22 Q32 16 22 22Z"
          fill="white" opacity="0.92"
        />
        {/* Neckline scoop */}
        <path
          d="M22 22 Q32 28 42 22"
          stroke="#DA121A" strokeWidth="1.5" fill="none"
        />
        {/* Tilet border at hem */}
        <rect x="10" y="68" width="44" height="3" fill="#FCDD09" opacity="0.9" />
        <rect x="10" y="71" width="44" height="2" fill="#DA121A" opacity="0.85" />
        <rect x="10" y="73" width="44" height="3" fill="#078930" opacity="0.85" />
        {/* Tilet border at chest */}
        <rect x="14" y="32" width="36" height="2" fill="#FCDD09" opacity="0.7" />
        <rect x="14" y="34" width="36" height="1.5" fill="#DA121A" opacity="0.7" />
        {/* Ethiopian cross emblem on dress */}
        <line x1="32" y1="44" x2="32" y2="62" stroke="#DA121A" strokeWidth="1.5" opacity="0.5" />
        <line x1="24" y1="53" x2="40" y2="53" stroke="#DA121A" strokeWidth="1.5" opacity="0.5" />
      </svg>

      <span
        className="text-yellow-300 font-bold tracking-[0.25em] text-xs mt-0.5 z-10"
        style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)', fontFamily: 'serif' }}
      >
        KABA
      </span>

      {/* Bottom tilet stripe */}
      <div className="absolute bottom-0 inset-x-0 flex h-2">
        <div className="flex-1" style={{ background: '#078930' }} />
        <div className="flex-1" style={{ background: '#FCDD09' }} />
        <div className="flex-1" style={{ background: '#DA121A' }} />
        <div className="flex-1" style={{ background: '#FCDD09' }} />
        <div className="flex-1" style={{ background: '#078930' }} />
      </div>
    </div>
  )
}
