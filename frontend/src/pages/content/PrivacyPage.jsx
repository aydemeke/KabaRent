import ContentLayout, { sectionHeaderStyle, bodyStyle } from '../../components/ContentLayout'

const SECTIONS = [
  {
    title: 'איזה מידע אנו אוספים',
    body: 'בעת ביצוע הזמנה אנו אוספים את שמכם המלא, מספר טלפון, כתובת דוא״ל ופרטי ההזמנה (תאריכי האירוע, הפריטים שנבחרו). איננו אוספים פרטי אשראי במערכת.',
  },
  {
    title: 'כיצד אנו משתמשים במידע',
    body: 'המידע משמש לעיבוד ההזמנה, ליצירת קשר בנוגע לאירוע, לתיאום משלוח ואיסוף, ולשיפור השירות שאנו מציעים. לא נשלח אליכם דיוור פרסומי ללא הסכמתכם.',
  },
  {
    title: 'שיתוף מידע עם צד שלישי',
    body: 'אנו מכבדים את פרטיותכם ואיננו מוכרים, משכירים או מעבירים את פרטיכם האישיים לצדדים שלישיים, למעט כאשר הדבר נדרש לצורך אספקת השירות (כגון שירות משלוחים) או על פי חוק.',
  },
  {
    title: 'הזכויות שלכם',
    body: 'באפשרותכם לעיין במידע השמור אצלנו, לבקש את תיקונו או למחוק את פרטיכם מהמערכת בכל עת. לפנייה בנושא זה ניתן ליצור קשר בכתובת info@kaba-rent.co.il.',
  },
  {
    title: 'אבטחת מידע',
    body: 'אנו נוקטים אמצעים סבירים לשמירה על אבטחת המידע שלכם ומגבילים את הגישה אליו לעובדים המורשים בלבד.',
  },
]

export default function PrivacyPage() {
  return (
    <ContentLayout title="מדיניות פרטיות">
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
