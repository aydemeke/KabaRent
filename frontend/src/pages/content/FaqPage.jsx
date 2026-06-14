import { useState } from 'react'
import ContentLayout, { bodyStyle } from '../../components/ContentLayout'

const FAQS = [
  {
    q: 'כמה זמן מראש צריך להזמין?',
    a: 'מומלץ להזמין לפחות שבועיים מראש, במיוחד בעונת החגים.',
  },
  {
    q: 'האם ניתן לבטל הזמנה?',
    a: 'ביטול עד 7 ימים לפני האירוע — ללא עלות. ביטול מאוחר יותר כרוך בדמי ביטול של 50%.',
  },
  {
    q: 'מה כלול בחבילה?',
    a: 'זוג קאבות בצבע הנבחר, 4 חצוצרות טורומבות, 4 מקלות, 2 כתרי משי, 4 מטריות תחרה.',
  },
  {
    q: 'האם יש משלוח?',
    a: 'כן, אנו מספקים משלוח ואיסוף לכל הארץ בתיאום מראש.',
  },
  {
    q: 'מה קורה אם הקאבה ניזוקה?',
    a: 'נזקים קלים — ללא חיוב. נזקים משמעותיים — יחויבו בהתאם להערכת נזק.',
  },
  {
    q: 'אילו מידות זמינות?',
    a: 'קטנה, בינונית, גדולה. ניתן לפנות אלינו לייעוץ מידות.',
  },
]

function AccordionItem({ q, a, isOpen, onToggle }) {
  return (
    <div style={{ borderBottom: '1px solid rgba(193,200,194,0.4)' }}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '18px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'right',
        }}
      >
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', fontWeight: 600, color: '#012d1d' }}>
          {q}
        </span>
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="#012d1d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <p style={{ ...bodyStyle, margin: 0, paddingBottom: '18px' }}>{a}</p>
      )}
    </div>
  )
}

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <ContentLayout title="שאלות נפוצות">
      <div style={{ marginTop: '8px' }}>
        {FAQS.map((item, i) => (
          <AccordionItem
            key={item.q}
            q={item.q}
            a={item.a}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </div>
    </ContentLayout>
  )
}
