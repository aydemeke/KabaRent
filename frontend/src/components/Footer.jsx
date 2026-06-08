import { Link } from 'react-router-dom'

const FOOTER_LINK_STYLE = {
  color: 'rgba(1,45,29,0.70)',
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  textDecoration: 'none',
  display: 'block',
  marginBottom: '10px',
  transition: 'color 0.2s ease',
}

function FooterLink({ to, children }) {
  const hoverIn = e => (e.currentTarget.style.color = 'rgba(1,45,29,1)')
  const hoverOut = e => (e.currentTarget.style.color = 'rgba(1,45,29,0.70)')

  // Links without a route target (not yet built) stay as inert placeholders.
  if (!to) {
    return (
      <span style={{ ...FOOTER_LINK_STYLE, cursor: 'default' }}>{children}</span>
    )
  }

  return (
    <Link to={to} style={FOOTER_LINK_STYLE} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
      {children}
    </Link>
  )
}

const SECTION_HEADING = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: '13px',
  fontWeight: 700,
  color: '#012d1d',
  marginBottom: '16px',
  letterSpacing: '0.05em',
}

const CONTACT_LINE = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  color: 'rgba(1,45,29,0.70)',
  marginBottom: '10px',
}

export default function Footer() {
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
        {/* Column 1 — Brand (rightmost in RTL) */}
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
        <div>
          <h4 style={SECTION_HEADING}>אודות</h4>
          <FooterLink to="/about">עלינו</FooterLink>
          <FooterLink to="/how-it-works">איך זה עובד</FooterLink>
          <FooterLink to="/faq">שאלות נפוצות</FooterLink>
          <FooterLink to="/contact">צור קשר</FooterLink>
        </div>

        {/* Column 3 — מדיניות */}
        <div>
          <h4 style={SECTION_HEADING}>מדיניות</h4>
          <FooterLink to="/rental-terms">תקנון השכרה</FooterLink>
          <FooterLink to="/returns">מדיניות החזרות</FooterLink>
          <FooterLink to="/privacy">מדיניות פרטיות</FooterLink>
          <FooterLink>תנאי שימוש</FooterLink>
        </div>

        {/* Column 4 — צור קשר (leftmost in RTL) */}
        <div>
          <h4 style={SECTION_HEADING}>צור קשר</h4>
          <p style={CONTACT_LINE}>📞 050-1234567</p>
          <p style={CONTACT_LINE}>✉️ info@kaba-rent.co.il</p>
          <p style={CONTACT_LINE}>📍 חיפה, ישראל</p>
          <p style={{ ...CONTACT_LINE, fontSize: '13px', color: 'rgba(1,45,29,0.55)' }}>
            שעות: א׳-ה׳ 09:00-19:00
          </p>
        </div>
      </div>

      {/* Bottom strip */}
      <div
        style={{
          maxWidth: '1152px',
          margin: '32px auto 0',
          borderTop: '1px solid rgba(193,200,194,0.4)',
          paddingTop: '24px',
          paddingBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Right (RTL start): copyright */}
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'rgba(1,45,29,0.50)' }}>
          © 2026 ካባ — כל הזכויות שמורות
        </p>

        {/* Left (RTL end): social icons + admin link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Instagram */}
          <a
            href="#"
            style={{ color: 'rgba(1,45,29,0.45)', transition: 'color 0.2s ease' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#012d1d')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(1,45,29,0.45)')}
            aria-label="Instagram"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>

          {/* Facebook */}
          <a
            href="#"
            style={{ color: 'rgba(1,45,29,0.45)', transition: 'color 0.2s ease' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#012d1d')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(1,45,29,0.45)')}
            aria-label="Facebook"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>

          {/* WhatsApp */}
          <a
            href="#"
            style={{ color: 'rgba(1,45,29,0.45)', transition: 'color 0.2s ease' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#012d1d')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(1,45,29,0.45)')}
            aria-label="WhatsApp"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </a>

          <Link
            to="/admin"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(1,45,29,0.28)', textDecoration: 'none', marginRight: '4px' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(1,45,29,0.55)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(1,45,29,0.28)')}
          >
            ניהול
          </Link>
        </div>
      </div>
    </footer>
  )
}
