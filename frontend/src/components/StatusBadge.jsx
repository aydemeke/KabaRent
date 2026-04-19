const colours = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  ACTIVE:    'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${colours[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}
