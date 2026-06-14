import ContentLayout, { bodyStyle } from '../../components/ContentLayout'

const VALUES = [
  {
    title: 'איכות',
    text: 'כל קאבה עוברת בדיקה קפדנית לפני כל השכרה',
    icon: (p) => (
      <svg {...p}><path d="M20 6L9 17l-5-5" /></svg>
    ),
  },
  {
    title: 'מסורת',
    text: 'קולקציה אותנטית המייצגת את המורשת האתיופית',
    icon: (p) => (
      <svg {...p}><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4L8 14 2 9.4h7.6z" /></svg>
    ),
  },
  {
    title: 'שירות',
    text: 'ליווי אישי מהזמנה ועד האירוע',
    icon: (p) => (
      <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    ),
  },
]

export default function AboutPage() {
  const iconProps = {
    width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none',
    stroke: '#012d1d', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  }

  return (
    <ContentLayout title="עלינו">
      <p style={bodyStyle}>
        KabaRent הוא עסק משפחתי המתמחה בהשכרת קאבות מסורתיות אתיופיות לחתונות,
        ימי נישואין ואירועים מיוחדים ברחבי ישראל. אנו מביאים את המורשת האתיופית
        האותנטית אל היום המיוחד שלכם, עם תשומת לב לכל פרט ופרט.
      </p>

      {/* Mission statement */}
      <div
        style={{
          marginTop: '28px',
          padding: '20px 24px',
          background: 'rgba(1,45,29,0.05)',
          borderRight: '3px solid #fcd400',
          borderRadius: '12px',
        }}
      >
        <p style={{ ...bodyStyle, fontWeight: 600, color: '#012d1d', margin: 0 }}>
          להנגיש את היופי של הלבוש המסורתי האתיופי לכל אירוע בישראל
        </p>
      </div>

      {/* Value cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        style={{ marginTop: '32px' }}
      >
        {VALUES.map((v) => (
          <div
            key={v.title}
            style={{
              background: '#f3f4f3',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              {v.icon(iconProps)}
            </div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '17px', fontWeight: 600, color: '#012d1d', marginBottom: '6px' }}>
              {v.title}
            </h3>
            <p style={{ ...bodyStyle, fontSize: '14px', margin: 0 }}>{v.text}</p>
          </div>
        ))}
      </div>
    </ContentLayout>
  )
}
