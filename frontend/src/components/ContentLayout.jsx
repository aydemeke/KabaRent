// Shared layout + design tokens for the static content pages
// (about, how-it-works, faq, contact, rental-terms, returns, privacy).
// Each page renders its white content card inside a full-screen backdrop:
// clicking the backdrop (outside the card), pressing Escape, or the X button
// closes the page via navigate(-1), returning to the page you came from.

import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export const titleStyle = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontWeight: 700,
  color: '#012d1d',
  letterSpacing: '-0.01em',
  textAlign: 'right',
  marginBottom: '24px',
}

export const sectionHeaderStyle = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: '18px',
  fontWeight: 500,
  color: '#012d1d',
  marginTop: '28px',
  marginBottom: '10px',
}

export const bodyStyle = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '15px',
  color: '#414844',
  lineHeight: 1.8,
}

export default function ContentLayout({ title, children }) {
  const navigate = useNavigate()

  // Return to the previous page; fall back to home if there is no history
  // (e.g. the page was opened directly via a deep link).
  const close = useCallback(() => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }, [navigate])

  // Close on Escape, and lock body scroll while the overlay is open.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [close])

  return (
    <div
      dir="rtl"
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(1,45,29,0.35)',
        overflowY: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px',
      }}
    >
      <div
        className="bg-white p-5 sm:p-12"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '800px',
          width: '100%',
          margin: 'auto',
          borderRadius: '2rem',
          boxShadow: '0 8px 40px rgba(1,45,29,0.18)',
        }}
      >
        {/* Close button — top-left corner (RTL) */}
        <button
          type="button"
          onClick={close}
          aria-label="סגירה"
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            borderRadius: '50%',
            background: 'rgba(1,45,29,0.06)',
            color: '#012d1d',
            cursor: 'pointer',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(1,45,29,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(1,45,29,0.06)')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h1 className="text-2xl sm:text-[2rem]" style={titleStyle}>{title}</h1>
        {children}
      </div>
    </div>
  )
}
