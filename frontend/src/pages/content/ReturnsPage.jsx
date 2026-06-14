import ContentLayout, { sectionHeaderStyle, bodyStyle } from '../../components/ContentLayout'

const SECTIONS = [
  {
    title: 'כיצד מחזירים',
    body: 'את הציוד יש להחזיר באריזה המקורית שקיבלתם, נקי ויבש. אין צורך לכבס או לנקות את הקאבות — ניקוי קל כלול בשירות. ניתן להחזיר במשרדנו או לתאם איסוף עד הבית.',
  },
  {
    title: 'מועד ההחזרה',
    body: 'יש להחזיר את הציוד עד היום שלמחרת האירוע, לא יאוחר מהשעה 12:00 בצהריים. במקרה של עיכוב צפוי, נא ליצור איתנו קשר מראש לתיאום.',
  },
  {
    title: 'מצב הציוד הצפוי',
    body: 'הציוד צריך לחזור ללא קרעים, כתמים קבועים או חלקים חסרים. בלאי סביר הנובע משימוש רגיל אינו כרוך בחיוב.',
  },
  {
    title: 'דמי איחור',
    body: 'החזרה לאחר המועד שנקבע תחויב בדמי איחור יומיים בהתאם לתעריף הציוד. איחור מתמשך ללא תיאום עלול להיחשב כאי-החזרה ולחייב את מלוא ערך הפיקדון.',
  },
]

export default function ReturnsPage() {
  return (
    <ContentLayout title="מדיניות החזרות">
      {SECTIONS.map((section, i) => (
        <section key={section.title}>
          <h2 style={{ ...sectionHeaderStyle, marginTop: i === 0 ? '8px' : '28px' }}>
            {section.title}
          </h2>
          <p style={{ ...bodyStyle, margin: 0 }}>{section.body}</p>
        </section>
      ))}
    </ContentLayout>
  )
}
