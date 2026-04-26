const CATEGORY_HE = { Wedding: 'חתונה', Anniversary: 'יום נישואין', Other: 'אחר' }
const SIZE_HE = { Small: 'קטנה', Medium: 'בינונית', Large: 'גדולה' }
const COLOR_NAME_HE = {
  'Black Gold':  'שחור זהב',
  'Red Gold':    'אדום זהב',
  'Black White': 'שחור לבן',
  'White Gold':  'לבן זהב',
  'Blue Gold':   'כחול זהב',
  'Red White':   'אדום לבן',
}

const PACKAGE_ITEMS_TAIL = [
  '4 חצוצרות טורומבות מסורתיות',
  '4 מקלות עם צבעי דגל אתיופיה',
  '2 כתרי משי לראש לגבר ולאישה',
  '4 מטריות תחרה צבעוניות',
]

export default function KabaDetailModal({ kaba, onBook, onClose }) {
  const packageItems = [`זוג קאבות בצבע ${COLOR_NAME_HE[kaba.name] ?? kaba.name}`, ...PACKAGE_ITEMS_TAIL]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white w-full"
        style={{ maxWidth: '460px', borderRadius: '20px' }}
      >

        {/* Image with identity overlay */}
        <div style={{ position: 'relative', height: '200px', borderRadius: '20px 20px 0 0', overflow: 'hidden', flexShrink: 0, background: '#eeeeed' }}>
          {kaba.imageUrl
            ? <img src={kaba.imageUrl} alt={kaba.name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%' }} />
          }
          {/* Dark gradient overlay at the bottom of the image */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)',
          }} />
          {/* Name + pills overlaid */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 20px 12px' }} dir="rtl">
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: '6px' }}>
              {COLOR_NAME_HE[kaba.name] ?? kaba.name}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {kaba.category && (
                <span style={{
                  fontSize: '12px', fontWeight: 600, color: '#fff',
                  background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)',
                  borderRadius: '20px', padding: '3px 10px',
                }}>
                  {CATEGORY_HE[kaba.category] ?? kaba.category}
                </span>
              )}
              {kaba.size && (
                <span style={{
                  fontSize: '12px', fontWeight: 600, color: '#fff',
                  background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)',
                  borderRadius: '20px', padding: '3px 10px',
                }}>
                  {SIZE_HE[kaba.size] ?? kaba.size}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px 20px' }}>

          {/* Package contents */}
          <div style={{ marginBottom: '14px' }}>
            <p style={{
              fontSize: '11px', fontWeight: 600, color: '#9CA3AF',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: '8px', textAlign: 'right',
            }}>
              מה כלול בחבילה
            </p>
            <div
              dir="rtl"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 12px' }}
            >
              {packageItems.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    fontSize: '12.5px',
                    color: '#374151',
                    lineHeight: 1.4,
                    textAlign: 'right',
                  }}
                >
                  <span style={{ color: '#D4AF37', fontSize: '9px', marginTop: '4px', flexShrink: 0 }}>●</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Price bar */}
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>
              ₪{kaba.pricePerDay}
            </span>
            <span style={{ fontSize: '13px', color: '#9CA3AF', marginRight: '4px' }}>/ יום</span>
          </div>

          {/* Book Now button */}
          <button
            onClick={onBook}
            style={{
              width: '100%',
              height: '44px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 700,
              background: '#1B5E20',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              marginBottom: '10px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#2E7D32'}
            onMouseLeave={e => e.currentTarget.style.background = '#1B5E20'}
          >
            הזמן עכשיו
          </button>

          {/* Close link */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '13px',
                color: '#9CA3AF',
                cursor: 'pointer',
                padding: '2px 8px',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#6B7280'}
              onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
            >
              סגור
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
