import { useCatalog } from '../context/CatalogContext';
import { weekdayNames } from '../data/settings';
import { useCopy } from '../i18n';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { Icon } from './Icon';
import { Reveal } from './Reveal';

const en = {
  eyebrow: 'Availability',
  title: 'Upcoming availability',
  lead: 'Limited days fill up quickly — weekends especially. You choose your exact date and time when you order.',
  weddings: 'Weddings & tiered cakes: book 4–8 weeks ahead',
  customNotice: (n: number) => `Custom cakes: at least ${n} days notice`,
  closedOn: (days: string) => `Closed ${days}`,
  weekday: (d: number) => weekdayNames[d],
};
const esWeekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const es: typeof en = {
  eyebrow: 'Disponibilidad',
  title: 'Próxima disponibilidad',
  lead: 'Los días con pocos lugares se llenan rápido, sobre todo los fines de semana. Eliges la fecha y hora exactas al hacer tu pedido.',
  weddings: 'Bodas y pasteles de varios pisos: reserva con 4 a 8 semanas',
  customNotice: (n) => `Pasteles personalizados: al menos ${n} días de anticipación`,
  closedOn: (days) => `Cerrado los ${days}`,
  weekday: (d) => esWeekdays[d],
};

/** The availability calendar with its booking notes, shown on the home page. */
export function AvailabilitySection() {
  const { settings } = useCatalog();
  const t = useCopy({ en, es });
  const closedDays = settings.store.closedWeekdays.map((d) => t.weekday(d));

  return (
    <section id="availability" className="section section--cream anchor-section" aria-labelledby="calendar-title">
      <div className="container availability">
        <Reveal className="availability__copy">
          <span className="eyebrow">{t.eyebrow}</span>
          <h2 id="calendar-title">{t.title}</h2>
          <p className="lead">{t.lead}</p>
          <ul className="availability__notes">
            <li>
              <Icon name="calendar" /> {t.weddings}
            </li>
            <li>
              <Icon name="clock" /> {t.customNotice(settings.custom.leadDays)}
            </li>
            {closedDays.length > 0 && (
              <li>
                <Icon name="store" /> {t.closedOn(closedDays.join(', '))}
              </li>
            )}
          </ul>
        </Reveal>
        <Reveal delay={120} className="availability__cal">
          <AvailabilityCalendar />
        </Reveal>
      </div>
    </section>
  );
}
