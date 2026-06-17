import { Fragment, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAll, getAvailable } from '../../api/kabas'
import { useAuth } from '../../auth/useAuth'
import Spinner from '../../components/Spinner'
import KabaDetailModal from '../../components/KabaDetailModal'
import CheckoutAuthGate from '../../components/CheckoutAuthGate'

const CATEGORY_HE = { Wedding: 'חתונה', Anniversary: 'יום נישואין', Other: 'אחר' }
const CATEGORY_PILLS = ['הכל', 'חתונה', 'יום נישואין', 'אחר']
const CATEGORY_FILTER = { 'הכל': null, 'חתונה': 'Wedding', 'יום נישואין': 'Anniversary', 'אחר': 'Other' }

const COLOR_MAP = {
  'Black Gold':  ['#1a1a1a', '#C5A028'],
  'Black White': ['#1a1a1a', '#e8e8e8'],
  'Blue Gold':   ['#1a3a8f', '#C5A028'],
  'Red Gold':    ['#B71C1C', '#C5A028'],
  'Red White':   ['#B71C1C', '#e8e8e8'],
  'White Gold':  ['#e8e8e8', '#C5A028'],
}

const COLOR_NAME_HE = {
  'Black Gold':  'שחור זהב',
  'Red Gold':    'אדום זהב',
  'Black White': 'שחור לבן',
  'White Gold':  'לבן זהב',
  'Blue Gold':   'כחול זהב',
  'Red White':   'אדום לבן',
}

const SIZE_HE = { Small: 'קטנה', Medium: 'בינונית', Large: 'גדולה' }

const HOW_IT_WORKS = [
  { title: 'בחרו קאבה',    icon: 'search'   },
  { title: 'בחרו תאריך',   icon: 'calendar' },
  { title: 'קבלו את ההזמנה', icon: 'check'  },
]

function StepIcon({ type }) {
  const p = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: '#705d00', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'search')
    return <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  if (type === 'calendar')
    return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  return <svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
}

function ColorSwatch({ name }) {
  const colors = COLOR_MAP[name]
  if (!colors) return null
  return (
    <span
      className="inline-block w-3.5 h-3.5 rounded-sm flex-shrink-0"
      style={{
        background: `linear-gradient(to right, ${colors[0]} 50%, ${colors[1]} 50%)`,
        border: '1px solid rgba(0,0,0,0.10)',
      }}
    />
  )
}

export default function BrowsePage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [kabas, setKabas] = useState([])
  const [loading, setLoading] = useState(true)
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0])
  const [returnDate, setReturnDate] = useState('')
  const [filtered, setFiltered] = useState(false)
  const [selectedKaba, setSelectedKaba] = useState(null)
  const [gateOrderPath, setGateOrderPath] = useState(null)
  const [activeCategory, setActiveCategory] = useState('הכל')
  const [sortBy, setSortBy] = useState('price-asc')

  useEffect(() => {
    getAll().then(setKabas).finally(() => setLoading(false))
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (!eventDate) return
    setLoading(true)
    const effectiveReturn = returnDate || eventDate
    getAvailable(eventDate, effectiveReturn)
      .then(data => { setKabas(data); setFiltered(true) })
      .finally(() => setLoading(false))
  }

  function handleClear() {
    setEventDate('')
    setReturnDate('')
    setFiltered(false)
    setLoading(true)
    getAll().then(setKabas).finally(() => setLoading(false))
  }

  // Build the order-form path carrying the in-progress selection (kaba + chosen dates).
  // The whole intent lives in the URL, so it survives a login/register round-trip — and
  // even a full page reload — without any separate router-state or sessionStorage backup.
  function orderPathFor(kabaId) {
    const params = new URLSearchParams({ kabaId })
    if (eventDate) params.set('eventDate', eventDate)
    if (returnDate) params.set('returnDate', returnDate)
    return `/order/new?${params}`
  }

  function bookNow(kabaId) {
    const path = orderPathFor(kabaId)
    // Logged-in customers glide straight to the prefilled form; guests hit the auth gate.
    if (isLoggedIn) {
      navigate(path)
    } else {
      setGateOrderPath(path)
    }
  }

  const catFilter = CATEGORY_FILTER[activeCategory]
  const displayedKabas = kabas
    .filter(k => !catFilter || k.category === catFilter)
    .sort((a, b) => {
      if (sortBy === 'price-asc')  return Number(a.pricePerDay) - Number(b.pricePerDay)
      if (sortBy === 'price-desc') return Number(b.pricePerDay) - Number(a.pricePerDay)
      if (sortBy === 'name-asc')   return (COLOR_NAME_HE[a.name] ?? a.name).localeCompare(COLOR_NAME_HE[b.name] ?? b.name, 'he')
      if (sortBy === 'newest')     return b.id - a.id
      return 0
    })

  return (
    <div>
      {selectedKaba && (
        <KabaDetailModal
          kaba={selectedKaba}
          onClose={() => setSelectedKaba(null)}
          onBook={() => { setSelectedKaba(null); bookNow(selectedKaba.id) }}
        />
      )}

      {gateOrderPath && (
        <CheckoutAuthGate
          onClose={() => setGateOrderPath(null)}
          onLogin={() => navigate(`/login?redirect=${encodeURIComponent(gateOrderPath)}`)}
          onRegister={() => navigate(`/register?redirect=${encodeURIComponent(gateOrderPath)}`)}
          onGuest={() => navigate(gateOrderPath)}
        />
      )}

      {/* ─── SECTION 1: Hero ─── */}
      <section style={{ textAlign: 'center', padding: '56px 32px 44px' }}>
        <h1
          dir="rtl"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '32px',
            fontWeight: 700,
            color: '#012d1d',
            letterSpacing: '-0.02em',
            marginBottom: '20px',
            lineHeight: 1.2,
          }}
        >
          השכרת הלבשה מסורתית לאירועים
        </h1>

        {/* Gold divider */}
        <div style={{ width: '48px', height: '3px', background: '#fcd400', borderRadius: '2px', margin: '0 auto 24px' }} />

        {/* Subtitle */}
        <p
          dir="rtl"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '18px',
            color: '#414844',
            maxWidth: '560px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          קולקציה אוצרת של גלימות קאבה לאירועים בלתי נשכחים
        </p>
      </section>

      {/* ─── SECTION 2: Search bar ─── */}
      <section style={{ padding: '0 0 40px' }}>
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row items-stretch sm:items-center w-full sm:max-w-[700px] mx-auto gap-2 sm:gap-0 rounded-3xl sm:rounded-[50px] sm:h-16"
          style={{
            background: '#ffffff',
            boxShadow: '0px 8px 40px rgba(1,45,29,0.10)',
            padding: '6px',
          }}
        >
          {/* Submit button — leftmost in LTR DOM */}
          <button
            type="submit"
            className="w-full sm:w-auto justify-center sm:justify-start order-3 sm:order-none"
            style={{
              flexShrink: 0,
              background: '#012d1d',
              color: '#ffffff',
              borderRadius: '40px',
              padding: '0 24px',
              height: '52px',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1b4332'; e.currentTarget.style.transform = 'scale(0.97)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#012d1d'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            בדוק זמינות
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </button>

          {/* Return date field */}
          <div
            className="w-full min-h-[44px] sm:min-h-0 order-2 sm:order-none"
            style={{
              flex: 1,
              padding: '0 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <label htmlFor="search-return-date" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5b615b', marginBottom: '2px', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
              תאריך החזרה (אופציונלי)
            </label>
            <div className="kr-datefield" style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#012d1d" strokeWidth={2} style={{ flexShrink: 0 }} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 500, color: returnDate ? '#1a1c1c' : '#6b726b', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                {returnDate ? returnDate.split('-').reverse().join('/') : 'בחר תאריך'}
              </span>
              <input
                id="search-return-date"
                type="date"
                value={returnDate}
                min={eventDate || new Date().toISOString().split('T')[0]}
                onChange={e => setReturnDate(e.target.value)}
                onClick={e => e.target.showPicker?.()}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
              />
            </div>
          </div>

          <div className="hidden sm:block" style={{ width: '1px', height: '28px', background: '#c1c8c2', opacity: 0.5, flexShrink: 0 }} />

          {/* Event date field */}
          <div
            className="w-full min-h-[44px] sm:min-h-0 order-1 sm:order-none"
            style={{
              flex: 1,
              padding: '0 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <label htmlFor="search-event-date" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5b615b', marginBottom: '2px', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
              תאריך אירוע
            </label>
            <div className="kr-datefield" style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#012d1d" strokeWidth={2} style={{ flexShrink: 0 }} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 500, color: eventDate ? '#1a1c1c' : '#6b726b', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                {eventDate ? eventDate.split('-').reverse().join('/') : 'בחר תאריך'}
              </span>
              <input
                id="search-event-date"
                type="date"
                value={eventDate}
                min={new Date().toISOString().split('T')[0]}
                required
                onChange={e => setEventDate(e.target.value)}
                onClick={e => e.target.showPicker?.()}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </form>

        {filtered && (
          <div style={{ maxWidth: '700px', margin: '12px auto 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
            <p dir="rtl" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#012d1d' }}>
              מציג {kabas.length} קאבות זמינות עבור {eventDate}
              {returnDate && returnDate !== eventDate ? ` ← ${returnDate}` : ''}
            </p>
            <button
              type="button"
              onClick={handleClear}
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#414844', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#fcd400' }}
            >
              נקה סינון
            </button>
          </div>
        )}
      </section>

      {/* ─── SECTION 3: Filter and Sort bar ─── */}
      <div
        dir="rtl"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Category pills — right (RTL start) */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CATEGORY_PILLS.map(pill => (
            <button
              key={pill}
              onClick={() => setActiveCategory(pill)}
              className="min-h-[44px] sm:min-h-0"
              style={{
                padding: '8px 20px',
                borderRadius: '999px',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: activeCategory === pill ? 'none' : '1px solid #c1c8c2',
                background: activeCategory === pill ? '#2E7D32' : 'transparent',
                color: activeCategory === pill ? 'white' : '#1a1c1c',
              }}
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Sort dropdown — left (RTL end) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="sort-by" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#5b615b', whiteSpace: 'nowrap' }}>
            מיון לפי:
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="min-h-[44px] sm:min-h-0"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#1a1c1c',
              border: '1px solid #c1c8c2',
              borderRadius: '8px',
              padding: '6px 10px',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            <option value="price-asc">מחיר: נמוך לגבוה</option>
            <option value="price-desc">מחיר: גבוה לנמוך</option>
            <option value="name-asc">שם: א-ת</option>
            <option value="newest">חדשים ביותר</option>
          </select>
        </div>
      </div>

      {/* ─── SECTION 4: Product grid ─── */}
      {loading ? (
        <Spinner />
      ) : displayedKabas.length === 0 ? (
        <div className="text-center py-24 font-inter text-on-surface-variant">
          אין קאבות זמינות לתאריך זה
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedKabas.map((kaba) => {
            const inStock = kaba.quantity > 0
            return (
              <div
                key={kaba.id}
                role="button"
                tabIndex={0}
                aria-label={`צפה בפרטים: ${COLOR_NAME_HE[kaba.name] ?? kaba.name}`}
                onClick={() => setSelectedKaba(kaba)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedKaba(kaba)
                  }
                }}
                className="kr-card group cursor-pointer transition-all duration-500"
                style={{
                  background: '#ffffff',
                  borderRadius: '2.5rem',
                  overflow: 'hidden',
                  boxShadow: '0 2px 16px rgba(1,45,29,0.06)',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 32px rgba(1,45,29,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 16px rgba(1,45,29,0.06)')}
              >
                {/* Image area */}
                <div style={{ position: 'relative', height: '220px', overflow: 'hidden', background: '#eeeeed' }}>
                  {kaba.imageUrl ? (
                    <img
                      src={kaba.imageUrl}
                      alt={kaba.name}
                      className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(1,45,29,0.40) 0%, transparent 55%)',
                  }} />

                  {/* Category badge — top-right */}
                  {kaba.category && (
                    <span
                      className="absolute top-5 right-5 font-inter font-semibold uppercase"
                      style={{ fontSize: '12px', letterSpacing: '0.1em', padding: '5px 13px', borderRadius: '999px', background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(8px)', color: '#012d1d' }}
                    >
                      {CATEGORY_HE[kaba.category] ?? kaba.category}
                    </span>
                  )}

                  {/* Availability badge — top-left */}
                  <span
                    className="absolute top-5 left-5 font-inter font-semibold"
                    style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', background: inStock ? 'rgba(46,125,50,0.95)' : 'rgba(180,30,30,0.95)', color: 'white' }}
                  >
                    {inStock ? 'זמין' : 'אזל המלאי'}
                  </span>
                </div>

                {/* Card body */}
                <div className="px-6 pt-5 pb-6 flex flex-col gap-3">
                  <div className="flex items-center gap-2" dir="rtl">
                    <ColorSwatch name={kaba.name} />
                    <h3 className="font-jakarta font-bold text-primary" style={{ fontSize: '1.25rem' }}>
                      {COLOR_NAME_HE[kaba.name] ?? kaba.name}
                    </h3>
                  </div>

                  <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {kaba.size && (
                      <span
                        className="self-start font-inter font-medium"
                        style={{ fontSize: '12px', padding: '3px 11px', borderRadius: '999px', background: '#f3f4f3', color: '#414844', letterSpacing: '0.04em' }}
                      >
                        מידה {SIZE_HE[kaba.size] ?? kaba.size}
                      </span>
                    )}
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontStyle: 'italic', color: '#5b615b' }}>
                      {kaba.quantity} פריטים זמינים
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(193,200,194,0.30)' }}>
                    <div className="flex items-baseline gap-1">
                      <span className="font-jakarta font-black text-primary" style={{ fontSize: '1.5rem' }}>₪{kaba.pricePerDay}</span>
                      <span className="font-inter text-on-surface-variant" style={{ fontSize: '12px' }}>/ יום</span>
                    </div>
                    <button
                      disabled={!inStock}
                      onClick={e => { e.stopPropagation(); if (inStock) setSelectedKaba(kaba) }}
                      className="ds-btn-primary"
                      style={{ padding: '8px 20px', fontSize: '13px', opacity: inStock ? 1 : 0.45, cursor: inStock ? 'pointer' : 'not-allowed' }}
                    >
                      הזמן עכשיו
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── SECTION 5: How it Works — compact strip ─── */}
      <div
        dir="rtl"
        style={{ margin: '40px auto 0', padding: '24px 32px', maxWidth: '1100px' }}
      >
        <p style={{
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
          fontSize: '16px',
          fontWeight: 700,
          color: '#5b615b',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}>
          איך זה עובד
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {HOW_IT_WORKS.map(({ title, icon }, i) => (
            <Fragment key={title}>
              {i > 0 && (
                <span
                  className="hidden sm:inline"
                  style={{ color: '#c1c8c2', fontSize: '15px', lineHeight: 1, userSelect: 'none', flexShrink: 0 }}
                >
                  ←
                </span>
              )}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
              >
                <StepIcon type={icon} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#1a1c1c', whiteSpace: 'nowrap' }}>
                  {title}
                </span>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
