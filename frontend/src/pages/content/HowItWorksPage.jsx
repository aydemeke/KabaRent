import ContentLayout, { bodyStyle } from '../../components/ContentLayout'

const STEPS = [
  { title: 'בחרו קאבה', text: 'דפדפו בקולקציה ובחרו את הצבע והמידה המתאימים' },
  { title: 'בדקו זמינות', text: 'הכניסו את תאריך האירוע וודאו שהקאבה פנויה' },
  { title: 'שלחו הזמנה', text: 'מלאו את פרטיכם ואשרו את ההזמנה' },
  { title: 'קבלו את הקאבה', text: 'נדאג לכך שהקאבה תגיע אליכם במצב מושלם' },
]

export default function HowItWorksPage() {
  return (
    <ContentLayout title="איך זה עובד">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '8px' }}>
        {STEPS.map((step, i) => (
          <div key={step.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <span
              className="font-inter font-bold text-white flex-shrink-0 flex items-center justify-center"
              style={{ width: 36, height: 36, borderRadius: '50%', background: '#012d1d', fontSize: '16px' }}
            >
              {i + 1}
            </span>
            <div>
              <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: 500, color: '#012d1d', marginBottom: '4px' }}>
                {step.title}
              </h3>
              <p style={{ ...bodyStyle, margin: 0 }}>{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom note */}
      <div
        style={{
          marginTop: '32px',
          padding: '16px 20px',
          background: 'rgba(1,45,29,0.05)',
          borderRadius: '12px',
          textAlign: 'center',
        }}
      >
        <p style={{ ...bodyStyle, margin: 0 }}>
          לשאלות נוספות צרו איתנו קשר בטלפון{' '}
          <a href="tel:0501234567" style={{ color: '#012d1d', fontWeight: 600, textDecoration: 'none' }}>
            050-1234567
          </a>
        </p>
      </div>
    </ContentLayout>
  )
}
