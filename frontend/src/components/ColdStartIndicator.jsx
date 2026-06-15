import { useSyncExternalStore } from 'react'
import { subscribe, getSnapshot } from '../api/coldStart'

/**
 * Non-blocking toast shown when an API request runs unusually long (likely a Render
 * cold start), so the user sees progress instead of a blank screen. Hebrew RTL; reuses
 * the Spinner's spinning-ring style.
 */
export default function ColdStartIndicator() {
  const slow = useSyncExternalStore(subscribe, getSnapshot)
  if (!slow) return null

  return (
    <div
      dir="rtl"
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: '#ffffff', boxShadow: '0 8px 24px rgba(26,28,28,0.16)' }}
    >
      <div className="w-5 h-5 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <span className="font-inter text-sm text-on-surface">מעירים את השרת, רגע אחד…</span>
    </div>
  )
}
