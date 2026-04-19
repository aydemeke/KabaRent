function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      style={{ color: '#1a5c2a' }}
    >
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function formatDate(isoValue) {
  if (!isoValue) return null
  const [year, month, day] = isoValue.split('-')
  return `${day}/${month}/${year}`
}

export default function DateInput({ value, onChange, onFocus, placeholder, min, required, className = '' }) {
  return (
    <div
      className={`relative rounded-xl border border-gray-200 bg-white hover:border-green-400 focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-200 transition-all duration-150 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 pointer-events-none select-none min-h-[40px]">
        <CalendarIcon />
        <span className={`flex-1 text-sm ${value ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
          {value ? formatDate(value) : placeholder}
        </span>
      </div>

      <input
        type="date"
        value={value}
        min={min}
        required={required}
        onChange={onChange}
        onFocus={onFocus}
        onClick={(e) => e.target.showPicker()}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  )
}
