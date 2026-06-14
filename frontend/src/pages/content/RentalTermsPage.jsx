import ContentLayout, { sectionHeaderStyle, bodyStyle } from '../../components/ContentLayout'

const SECTIONS = [
  {
    title: 'תנאי השכרה',
    body: 'ההשכרה מותרת ללקוחות מגיל 18 ומעלה בלבד. בעת איסוף הציוד יש להציג תעודת זהות בתוקף. בעת ביצוע ההזמנה ייגבה פיקדון אשר יוחזר במלואו עם החזרת הציוד במצב תקין.',
  },
  {
    title: 'תקופת ההשכרה',
    body: 'תקופת ההשכרה הסטנדרטית היא החל מיום האירוע ועד ליום שלמחרת. ניתן להאריך את תקופת ההשכרה בתיאום מראש ובכפוף לזמינות, בתוספת תשלום יומי.',
  },
  {
    title: 'ביטול והחזר',
    body: 'ביטול הזמנה עד 7 ימים לפני מועד האירוע — ללא עלות והחזר מלא של הפיקדון. ביטול במועד מאוחר יותר כרוך בדמי ביטול בשיעור של 50% מערך ההזמנה.',
  },
  {
    title: 'אחריות',
    body: 'השוכר אחראי לשלמות הציוד לאורך כל תקופת ההשכרה. במקרה של נזק משמעותי, אובדן או גניבה — יחויב השוכר בהתאם להערכת הנזק ועלות הציוד.',
  },
  {
    title: 'תשלום',
    body: 'אנו מקבלים תשלום במזומן, בהעברה בנקאית ובאמצעי תשלום נייד. מקדמה תיגבה בעת ביצוע ההזמנה, והיתרה תשולם עד למועד איסוף הציוד.',
  },
]

export default function RentalTermsPage() {
  return (
    <ContentLayout title="תקנון השכרה">
      {SECTIONS.map((section, i) => (
        <section key={section.title}>
          <h2 style={{ ...sectionHeaderStyle, marginTop: i === 0 ? '8px' : '28px' }}>
            {i + 1}. {section.title}
          </h2>
          <p style={{ ...bodyStyle, margin: 0 }}>{section.body}</p>
        </section>
      ))}
    </ContentLayout>
  )
}
