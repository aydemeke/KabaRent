import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Accessibility helper for modal dialogs:
// - focuses the dialog (or its first focusable element) on open
// - traps Tab / Shift+Tab within the dialog
// - closes on Escape (when closeOnEscape is true)
// - restores focus to the element that was focused before opening
//
// Returns a ref to attach to the dialog container element.
export default function useModalA11y(onClose, { closeOnEscape = true } = {}) {
  const ref = useRef(null)

  // Keep the latest onClose without re-running the setup effect (callers
  // often pass an inline arrow that changes identity every render).
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const previouslyFocused = document.activeElement

    const focusableEls = () =>
      Array.from(node.querySelectorAll(FOCUSABLE)).filter(
        el => el.offsetParent !== null || el === document.activeElement
      )

    // Move focus into the dialog on open.
    const first = focusableEls()[0]
    if (first) first.focus()
    else node.focus()

    function onKeyDown(e) {
      if (e.key === 'Escape' && closeOnEscape) {
        e.preventDefault()
        onCloseRef.current?.()
        return
      }
      if (e.key !== 'Tab') return

      const items = focusableEls()
      if (items.length === 0) {
        e.preventDefault()
        node.focus()
        return
      }
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      const active = document.activeElement

      if (e.shiftKey) {
        if (active === firstEl || !node.contains(active)) {
          e.preventDefault()
          lastEl.focus()
        }
      } else if (active === lastEl || !node.contains(active)) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus()
      }
    }
  }, [closeOnEscape])

  return ref
}
