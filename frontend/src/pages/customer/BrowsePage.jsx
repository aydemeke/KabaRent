import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAll, getAvailable } from '../../api/kabas'
import Spinner from '../../components/Spinner'
import DateInput from '../../components/DateInput'
import KabaDetailModal from '../../components/KabaDetailModal'

const COLOR_MAP = {
  'Black Gold':  ['#1a1a1a', '#C5A028'],
  'Black White': ['#1a1a1a', '#e8e8e8'],
  'Blue Gold':   ['#1a3a8f', '#C5A028'],
  'Red Gold':    ['#B71C1C', '#C5A028'],
  'Red White':   ['#B71C1C', '#e8e8e8'],
  'White Gold':  ['#e8e8e8', '#C5A028'],
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
  const [kabas, setKabas] = useState([])
  const [loading, setLoading] = useState(true)
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0])
  const [returnDate, setReturnDate] = useState('')
  const [filtered, setFiltered] = useState(false)
  const [selectedKaba, setSelectedKaba] = useState(null)

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

  function bookNow(kabaId) {
    const params = new URLSearchParams({ kabaId })
    if (eventDate) params.set('eventDate', eventDate)
    if (returnDate) params.set('returnDate', returnDate)
    navigate(`/order/new?${params}`)
  }

  return (
    <div>
      {selectedKaba && (
        <KabaDetailModal
          kaba={selectedKaba}
          onClose={() => setSelectedKaba(null)}
          onBook={() => { setSelectedKaba(null); bookNow(selectedKaba.id) }}
        />
      )}

      {/* Hero */}
      <div className="text-center py-10">
        <p
          dir="rtl"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '28px',
            fontWeight: 700,
            color: '#012d1d',
            letterSpacing: '-0.02em',
            marginBottom: '20px',
          }}
        >
          השכרת הלבשה מסורתית לאירועים
        </p>
        <div className="mx-auto" style={{ width: '48px', height: '3px', background: '#fcd400', borderRadius: '2px' }} />
      </div>

      {/* Search bar */}
      <div className="mb-10">
        <p style={{
          fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: '#414844', marginBottom: '12px',
          fontFamily: 'Inter, sans-serif',
        }}>
          Find Available Kabas
        </p>
        <form
          onSubmit={handleSearch}
          style={{
            display: 'flex',
            alignItems: 'stretch',
            background: '#ffffff',
            borderRadius: '20px',
            padding: '8px',
            boxShadow: '0px 12px 40px rgba(1, 45, 29, 0.10)',
            gap: 0,
          }}
        >
          {/* Event Date field */}
          <div style={{ flex: 1, padding: '10px 16px', position: 'relative' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#717973', marginBottom: '4px', fontFamily: 'Inter, sans-serif' }}>
              Event Date
            </p>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#012d1d" strokeWidth={2} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span style={{ fontSize: '14px', fontWeight: 500, color: eventDate ? '#1a1c1c' : '#9ca3af', fontFamily: 'Inter, sans-serif' }}>
                {eventDate ? eventDate.split('-').reverse().join('/') : 'Select date'}
              </span>
              <input
                type="date"
                value={eventDate}
                min={new Date().toISOString().split('T')[0]}
                required
                onChange={e => setEventDate(e.target.value)}
                onFocus={() => setEventDate('')}
                onClick={e => e.target.showPicker?.()}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* Separator */}
          <div style={{ width: '1px', background: 'rgba(193,200,194,0.30)', margin: '10px 0' }} />

          {/* Return Date field */}
          <div style={{ flex: 1, padding: '10px 16px', position: 'relative' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#717973', marginBottom: '4px', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '5px' }}>
              Return Date
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '9px', color: '#9ca3af' }}>(optional)</span>
            </p>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#012d1d" strokeWidth={2} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span style={{ fontSize: '14px', fontWeight: 500, color: returnDate ? '#1a1c1c' : '#9ca3af', fontFamily: 'Inter, sans-serif' }}>
                {returnDate ? returnDate.split('-').reverse().join('/') : 'Select date'}
              </span>
              <input
                type="date"
                value={returnDate}
                min={eventDate || new Date().toISOString().split('T')[0]}
                onChange={e => setReturnDate(e.target.value)}
                onClick={e => e.target.showPicker?.()}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, rgba(1,75,45,0.12) 0%, rgba(252,212,0,0.10) 50%, rgba(180,30,30,0.10) 100%)',
              color: '#012d1d',
              borderRadius: '14px',
              padding: '14px 28px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '14px',
              border: '1px solid rgba(1,45,29,0.20)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(1,75,45,0.20) 0%, rgba(252,212,0,0.17) 50%, rgba(180,30,30,0.17) 100%)'; e.currentTarget.style.transform = 'scale(0.97)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(1,75,45,0.12) 0%, rgba(252,212,0,0.10) 50%, rgba(180,30,30,0.10) 100%)'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            Check Availability
          </button>
        </form>

        {filtered && (
          <div className="flex items-center justify-between mt-4 px-1">
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#012d1d' }}>
              Showing {kabas.length} available Kaba{kabas.length !== 1 ? 's' : ''} for {eventDate}
              {returnDate && returnDate !== eventDate ? ` → ${returnDate}` : ''}
            </p>
            <button
              type="button"
              onClick={handleClear}
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#414844', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#fcd400' }}
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Kaba grid */}
      {loading ? (
        <Spinner />
      ) : kabas.length === 0 ? (
        <div className="text-center py-24 font-inter text-on-surface-variant">
          No Kabas available for this date
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          {kabas.map((kaba) => (
            <div
              key={kaba.id}
              onClick={() => setSelectedKaba(kaba)}
              className="group cursor-pointer transition-all duration-500"
              style={{
                background: '#ffffff',
                borderRadius: '2.5rem',
                overflow: 'hidden',
                boxShadow: '0 2px 16px rgba(1,45,29,0.06)',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 32px rgba(1,45,29,0.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 16px rgba(1,45,29,0.06)'}
            >
              {/* Image */}
              <div style={{ position: 'relative', height: '280px', overflow: 'hidden', background: '#eeeeed' }}>
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
                {/* Scrim */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(1,45,29,0.40) 0%, transparent 55%)',
                }} />
                {/* Category badge */}
                {kaba.category && (
                  <span
                    className="absolute top-5 right-5 font-inter font-semibold uppercase"
                    style={{
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      padding: '5px 13px',
                      borderRadius: '999px',
                      background: 'rgba(255,255,255,0.90)',
                      backdropFilter: 'blur(8px)',
                      color: '#012d1d',
                    }}
                  >
                    {kaba.category}
                  </span>
                )}
              </div>

              {/* Card body */}
              <div className="px-6 pt-5 pb-6 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <ColorSwatch name={kaba.name} />
                  <h3 className="font-jakarta font-bold text-primary" style={{ fontSize: '1.25rem' }}>
                    {kaba.name}
                  </h3>
                </div>

                {kaba.size && (
                  <span
                    className="self-start font-inter font-medium"
                    style={{
                      fontSize: '11px',
                      padding: '3px 11px',
                      borderRadius: '999px',
                      background: '#f3f4f3',
                      color: '#414844',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Size {kaba.size}
                  </span>
                )}

                <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(193,200,194,0.30)' }}>
                  <div className="flex items-baseline gap-1">
                    <span className="font-jakarta font-black text-primary" style={{ fontSize: '1.5rem' }}>
                      ₪{kaba.pricePerDay}
                    </span>
                    <span className="font-inter text-on-surface-variant" style={{ fontSize: '12px' }}>/ day</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedKaba(kaba) }}
                    className="ds-btn-primary"
                    style={{ padding: '8px 20px', fontSize: '13px' }}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
