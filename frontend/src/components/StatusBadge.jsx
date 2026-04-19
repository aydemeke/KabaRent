const styles = {
  PENDING:   { bg: 'rgba(205,160,0,0.12)',  color: '#705d00' },
  CONFIRMED: { bg: 'rgba(1,45,80,0.10)',    color: '#013d6b' },
  ACTIVE:    { bg: 'rgba(1,45,29,0.10)',    color: '#012d1d' },
  COMPLETED: { bg: 'rgba(65,72,68,0.08)',   color: '#414844' },
  CANCELLED: { bg: 'rgba(86,0,0,0.10)',     color: '#560000' },
}

export default function StatusBadge({ status }) {
  const s = styles[status] ?? { bg: 'rgba(65,72,68,0.08)', color: '#414844' }
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-inter font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  )
}
