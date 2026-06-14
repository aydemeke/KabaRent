import { Link } from 'react-router-dom'
import { useState } from 'react'

const FOOTER_LINK_STYLE = {
  color: 'rgba(1,45,29,0.70)',
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  textDecoration: 'none',
  transition: 'color 0.2s ease',
}

// On mobile, links are 44px-tall flex rows for tappability; on desktop they
// revert to the original block layout with 10px spacing.
const FOOTER_LINK_CLASS = 'flex items-center min-h-[44px] sm:block sm:min-h-0 sm:mb-2.5'

function FooterLink({ to, children }) {
  const hoverIn = e => (e.currentTarget.style.color = 'rgba(1,45,29,1)')
  const hoverOut = e => (e.currentTarget.style.color = 'rgba(1,45,29,0.70)')

  // Links without a route target (not yet built) stay as inert placeholders.
  if (!to) {
    return (
      <span className={FOOTER_LINK_CLASS} style={{ ...FOOTER_LINK_STYLE, cursor: 'default' }}>{children}</span>
    )
  }

  return (
    <Link to={to} className={FOOTER_LINK_CLASS} style={FOOTER_LINK_STYLE} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
      {children}
    </Link>
  )
}

const SECTION_HEADING = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: '13px',
  fontWeight: 700,
  color: '#012d1d',
  letterSpacing: '0.05em',
}

const CONTACT_LINE = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  color: 'rgba(1,45,29,0.70)',
  marginBottom: '10px',
}

// Collapsible on mobile, always-expanded on desktop. The heading is a tappable
// 44px button on mobile (chevron rotates when open); the content is hidden when
// collapsed on mobile but forced visible from `sm:` up regardless of state.
function AccordionSection({ id, title, open, onToggle, children }) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between min-h-[44px] sm:min-h-0 sm:cursor-default"
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'right' }}
      >
        <h4 className="mb-0 sm:mb-4" style={SECTION_HEADING}>{title}</h4>
        <span
          className="sm:hidden"
          aria-hidden="true"
          style={{ color: '#012d1d', fontSize: '14px', transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▾
        </span>
      </button>
      <div className={open ? 'block' : 'hidden sm:block'}>
        {children}
      </div>
    </div>
  )
}

const SOCIAL = [
  {
    label: 'Instagram',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
]

// 44px tap target on mobile, original inline icon on desktop.
function SocialLinks() {
  return SOCIAL.map(s => (
    <a
      key={s.label}
      href="#"
      aria-label={s.label}
      className="inline-flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto"
      style={{ color: 'rgba(1,45,29,0.45)', transition: 'color 0.2s ease' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#012d1d')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(1,45,29,0.45)')}
    >
      {s.svg}
    </a>
  ))
}

function AdminLink() {
  return (
    <Link
      to="/admin"
      className="inline-flex items-center min-h-[44px] sm:min-h-0"
      style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(1,45,29,0.28)', textDecoration: 'none' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(1,45,29,0.55)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(1,45,29,0.28)')}
    >
      ניהול
    </Link>
  )
}

function Copyright() {
  return (
    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'rgba(1,45,29,0.50)' }}>
      © 2026 ካባ — כל הזכויות שמורות
    </p>
  )
}

export default function Footer() {
  const [open, setOpen] = useState({})
  const toggle = id => setOpen(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <footer
      dir="rtl"
      style={{
        background: '#f3f4f3',
        borderTop: '1px solid rgba(193,200,194,0.3)',
        padding: '48px 32px 0',
      }}
    >
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10"
        style={{ maxWidth: '1152px', margin: '0 auto' }}
      >
        {/* Column 1 — Brand (always visible, never collapsed) */}
        <div>
          <img
            src="/kaba-rent-logo.png"
            alt="ካባ"
            style={{
              height: '48px',
              width: 'auto',
              objectFit: 'contain',
              mixBlendMode: 'multiply',
              marginBottom: '16px',
            }}
          />
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: '#012d1d', marginBottom: '6px' }}>
            השכרת הלבשה מסורתית לאירועים
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(1,45,29,0.60)' }}>
            מורשת אתיופית, אירוע בלתי נשכח
          </p>
        </div>

        {/* Column 2 — אודות */}
        <AccordionSection id="about" title="אודות" open={open.about} onToggle={toggle}>
          <FooterLink to="/about">עלינו</FooterLink>
          <FooterLink to="/how-it-works">איך זה עובד</FooterLink>
          <FooterLink to="/faq">שאלות נפוצות</FooterLink>
          <FooterLink to="/contact">צור קשר</FooterLink>
        </AccordionSection>

        {/* Column 3 — מדיניות */}
        <AccordionSection id="policy" title="מדיניות" open={open.policy} onToggle={toggle}>
          <FooterLink to="/rental-terms">תקנון השכרה</FooterLink>
          <FooterLink to="/returns">מדיניות החזרות</FooterLink>
          <FooterLink to="/privacy">מדיניות פרטיות</FooterLink>
          <FooterLink>תנאי שימוש</FooterLink>
        </AccordionSection>

        {/* Column 4 — צור קשר */}
        <AccordionSection id="contact" title="צור קשר" open={open.contact} onToggle={toggle}>
          <p style={CONTACT_LINE}>📞 050-1234567</p>
          <p style={CONTACT_LINE}>✉️ info@kaba-rent.co.il</p>
          <p style={CONTACT_LINE}>📍 תל אביב, ישראל</p>
          <p style={{ ...CONTACT_LINE, fontSize: '13px', color: 'rgba(1,45,29,0.55)' }}>
            שעות: א׳-ה׳ 09:00-19:00
          </p>
        </AccordionSection>
      </div>

      {/* Bottom strip */}
      <div
        style={{
          maxWidth: '1152px',
          margin: '32px auto 0',
          borderTop: '1px solid rgba(193,200,194,0.4)',
          paddingTop: '24px',
          paddingBottom: '24px',
        }}
      >
        {/* Mobile: stacked + centered (social → copyright → admin) */}
        <div className="sm:hidden flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <SocialLinks />
          </div>
          <Copyright />
          <AdminLink />
        </div>

        {/* Desktop: original horizontal layout */}
        <div className="hidden sm:flex items-center justify-between">
          <Copyright />
          <div className="flex items-center gap-4">
            <SocialLinks />
            <AdminLink />
          </div>
        </div>
      </div>
    </footer>
  )
}
