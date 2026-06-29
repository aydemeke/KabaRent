const styles = {
  PENDING:   { bg: 'rgba(255,194,51,0.15)',  color: '#8A6320' },
  CONFIRMED: { bg: 'rgba(28,124,73,0.10)',   color: '#1C7C49' },
  ACTIVE:    { bg: 'rgba(28,124,73,0.15)',   color: '#1C7C49' },
  COMPLETED: { bg: 'rgba(90,84,67,0.10)',    color: '#5A5443' },
  CANCELLED: { bg: 'rgba(226,74,59,0.10)',   color: '#B5392D' },
}

export default function StatusBadge({ status }) {
  const s = styles[status] ?? { bg: 'rgba(90,84,67,0.10)', color: '#5A5443' }
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-inter font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  )
}
