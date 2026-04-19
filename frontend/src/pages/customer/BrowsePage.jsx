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
      className="inline-block w-4 h-4 rounded-sm border border-gray-300 flex-shrink-0"
      style={{ background: `linear-gradient(to right, ${colors[0]} 50%, ${colors[1]} 50%)` }}
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
    getAll()
      .then(setKabas)
      .finally(() => setLoading(false))
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
      {/* Hero header */}
      <div className="text-center py-5">
        <p
          dir="rtl"
          style={{ fontSize: '22px', fontWeight: 500, color: '#1a1a1a', letterSpacing: '0.5px' }}
        >
          השכרת הלבשה מסורתית לאירועים
        </p>
        <div className="mx-auto mt-3" style={{ width: '60px', height: '2px', background: '#D4AF37', marginBottom: '24px' }} />
      </div>

      {/* Date filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h2 style={{ fontSize: '15px', fontWeight: 400, color: '#888', marginBottom: '16px' }}>Find Available Kabas</h2>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Event Date</label>
            <DateInput
              value={eventDate}
              placeholder="Select date"
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setEventDate(e.target.value)}
              onFocus={() => setEventDate('')}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Return Date</label>
            <DateInput
              value={returnDate}
              placeholder="Select date"
              min={eventDate || new Date().toISOString().split('T')[0]}
              onChange={e => setReturnDate(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-colors duration-150"
            style={{ background: '#1B5E20' }}
            onMouseEnter={e => e.currentTarget.style.background = '#2E7D32'}
            onMouseLeave={e => e.currentTarget.style.background = '#1B5E20'}
          >
            Check Availability
          </button>
          {filtered && (
            <button type="button" onClick={handleClear} className="text-sm text-gray-400 hover:text-gray-600 underline">
              Clear filter
            </button>
          )}
        </form>
        {filtered && (
          <p className="mt-3 text-sm text-green-700 font-medium">
            Showing {kabas.length} available Kaba{kabas.length !== 1 ? 's' : ''} for {eventDate}{returnDate && returnDate !== eventDate ? ` → ${returnDate}` : ''}
          </p>
        )}
      </div>

      {/* Kaba grid */}
      {loading ? (
        <Spinner />
      ) : kabas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No Kabas available for this date
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kabas.map(kaba => (
            <div
              key={kaba.id}
              onClick={() => setSelectedKaba(kaba)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Image */}
              {kaba.imageUrl && (
                <div className="w-full overflow-hidden rounded-t-xl" style={{ height: '280px' }}>
                  <img
                    src={kaba.imageUrl}
                    alt={kaba.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              )}

              <div className="p-5 flex flex-col gap-3 flex-1">
              {/* Color name + swatch */}
              <div className="flex items-center gap-2">
                <ColorSwatch name={kaba.name} />
                <span className="text-xs text-gray-400 font-medium">Color:</span>
                <h3 className="font-semibold text-gray-800 text-base leading-tight">{kaba.name}</h3>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {kaba.category && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    {kaba.category}
                  </span>
                )}
                {kaba.size && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    Size: {kaba.size}
                  </span>
                )}
              </div>

              {/* Price + Book */}
              <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-100">
                <div>
                  <span className="text-gray-800 font-bold text-lg">₪{kaba.pricePerDay}</span>
                  <span className="text-gray-400 text-xs ml-1">/ day</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setSelectedKaba(kaba) }}
                  className="text-sm px-4 py-1.5 rounded-lg font-medium text-white transition-colors duration-150"
                  style={{ background: '#1B5E20' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#2E7D32'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1B5E20'}
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
