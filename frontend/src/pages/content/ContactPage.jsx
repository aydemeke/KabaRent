import { useState } from 'react'
import ContentLayout, { bodyStyle } from '../../components/ContentLayout'

const DETAILS = [
  { icon: '📞', text: '050-1234567' },
  { icon: '✉️', text: 'info@kaba-rent.co.il' },
  { icon: '📍', text: 'תל אביב, ישראל' },
  { icon: '🕐', text: 'א׳-ה׳ 09:00-19:00' },
]

const labelStyle = { display: 'block', marginBottom: '6px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#414844' }

export default function ContactPage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    // Frontend only — no backend yet. Show a success confirmation.
    setSubmitted(true)
  }

  return (
    <ContentLayout title="צור קשר">
      {/* Contact details */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        style={{ marginBottom: '32px' }}
      >
        {DETAILS.map((d) => (
          <div
            key={d.text}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f3f4f3', borderRadius: '12px', padding: '14px 18px' }}
          >
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{d.icon}</span>
            <span style={{ ...bodyStyle, margin: 0, fontWeight: 500, color: '#012d1d' }}>{d.text}</span>
          </div>
        ))}
      </div>

      {submitted ? (
        <div
          style={{
            background: 'rgba(1,45,29,0.06)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: 600, color: '#012d1d', marginBottom: '6px' }}>
            ההודעה נשלחה בהצלחה
          </h3>
          <p style={{ ...bodyStyle, margin: 0 }}>תודה שפניתם אלינו! נחזור אליכם בהקדם.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={labelStyle}>שם מלא</label>
            <input
              type="text" value={fullName} required
              onChange={e => setFullName(e.target.value)}
              placeholder="לדוגמה: שרה כהן"
              className="ds-input"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>טלפון</label>
              <input
                type="tel" value={phone} required
                onChange={e => setPhone(e.target.value)}
                placeholder="050-0000000"
                className="ds-input"
              />
            </div>
            <div>
              <label style={labelStyle}>אימייל</label>
              <input
                type="email" value={email} required
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="ds-input"
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>הודעה</label>
            <textarea
              value={message} required rows={4}
              onChange={e => setMessage(e.target.value)}
              placeholder="כתבו לנו..."
              className="ds-input resize-none"
            />
          </div>
          <button type="submit" className="ds-btn-primary" style={{ width: '100%', padding: '0.875rem' }}>
            שליחה
          </button>
        </form>
      )}
    </ContentLayout>
  )
}
