function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4 flex-shrink-0"
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      style={{ color: '#012d1d', opacity: 0.6 }}
      aria-hidden="true"
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

export default function DateInput({ id, value, onChange, onFocus, placeholder, min, required, ariaLabel, className = '' }) {
  return (
    <div
      className={`kr-dateinput relative transition-all duration-150 ${className}`}
      style={{
        borderRadius: '0.75rem',
        background: value ? '#ffffff' : '#f3f4f3',
        border: value ? '1px solid rgba(1,45,29,0.25)' : '1px solid transparent',
      }}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 pointer-events-none select-none min-h-[42px]">
        <CalendarIcon />
        <span className={`flex-1 text-sm ${value ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>
          {value ? formatDate(value) : placeholder}
        </span>
      </div>

      <input
        id={id}
        type="date"
        value={value}
        min={min}
        required={required}
        aria-label={ariaLabel}
        onChange={onChange}
        onFocus={onFocus}
        onClick={(e) => e.target.showPicker()}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  )
}
