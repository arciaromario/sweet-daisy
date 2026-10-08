import { Link } from 'react-router';
import { AvailabilityCalendar } from '../components/AvailabilityCalendar';
import { Icon, type IconName } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { Reveal } from '../components/Reveal';
import { Seo } from '../components/Seo';
import { useCatalog, useSite } from '../context/CatalogContext';
import { weekdayNames } from '../data/settings';
import { useCopy } from '../i18n';
import { firstAvailable, formatDate } from '../lib/availability';

const en = {
  seoTitle: 'Availability',
  seoDescription: 'See upcoming availability at Sweet Daisy, the earliest pickup for New York–style cookies and custom cakes, and how far ahead to order.',
  eyebrow: 'Availability',
  title: 'Plan your celebration',
  intro: 'Everything is baked by hand, so we take a limited number of orders each day. Here’s when we can bake for you.',
  crumb: 'Availability',
  cookies: { title: 'NY cookies', note: 'Packs of 2, 4 and 6 in every flavour.', cta: 'Shop cookies' },
  box: { title: 'Build your own box', note: 'Mix any flavours in one box.', cta: 'Build your box' },
  custom: { title: 'Custom cakes', note: 'Designed with you, from sketch to stand.', cta: 'Design your cake' },
  nextAvailable: 'Next available',
  sameDay: 'Ready the same day.',
  orderAhead: (n: number) => `Order at least ${n} ${n === 1 ? 'day' : 'days'} ahead.`,
  calendarEyebrow: 'Calendar',
  calendarTitle: 'Upcoming availability',
  calendarLead: 'Limited days fill up quickly — weekends especially. You choose your exact date and time when you order.',
  weddings: 'Weddings & tiered cakes: book 4–8 weeks ahead',
  customNotice: (n: number) => `Custom cakes: at least ${n} days notice`,
  closedOn: (days: string) => `Closed ${days}`,
  weekday: (d: number) => weekdayNames[d],
  visitEyebrow: 'Visit the studio',
  hoursTitle: 'Opening hours',
  pickupNote: 'Pickups are collected at the time you choose at checkout.',
};
const esWeekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const es: typeof en = {
  seoTitle: 'Disponibilidad',
  seoDescription:
    'Consulta la disponibilidad de Sweet Daisy, la fecha de recogida más próxima para galletas estilo Nueva York y pasteles personalizados, y con cuánta anticipación pedir.',
  eyebrow: 'Disponibilidad',
  title: 'Planea tu celebración',
  intro: 'Todo se hornea a mano, así que aceptamos un número limitado de pedidos cada día. Estas son las fechas en que podemos hornear para ti.',
  crumb: 'Disponibilidad',
  cookies: { title: 'Galletas NY', note: 'Paquetes de 2, 4 y 6 en todos los sabores.', cta: 'Comprar galletas' },
  box: { title: 'Arma tu caja', note: 'Combina los sabores que quieras en una caja.', cta: 'Arma tu caja' },
  custom: { title: 'Pasteles personalizados', note: 'Diseñados contigo, del boceto a la mesa.', cta: 'Diseña tu pastel' },
  nextAvailable: 'Próxima fecha disponible',
  sameDay: 'Listo el mismo día.',
  orderAhead: (n) => `Pide con al menos ${n} ${n === 1 ? 'día' : 'días'} de anticipación.`,
  calendarEyebrow: 'Calendario',
  calendarTitle: 'Próxima disponibilidad',
  calendarLead: 'Los días con pocos lugares se llenan rápido, sobre todo los fines de semana. Eliges la fecha y hora exactas al hacer tu pedido.',
  weddings: 'Bodas y pasteles de varios pisos: reserva con 4 a 8 semanas',
  customNotice: (n) => `Pasteles personalizados: al menos ${n} días de anticipación`,
  closedOn: (days) => `Cerrado los ${days}`,
  weekday: (d) => esWeekdays[d],
  visitEyebrow: 'Visita el estudio',
  hoursTitle: 'Horario',
  pickupNote: 'Los pedidos se recogen a la hora que elijas al pagar.',
};

export default function Availability() {
  const { products, overrides, settings } = useCatalog();
  const site = useSite();
  const t = useCopy({ en, es });
  const closed = settings.store.closedWeekdays;
  const closedDays = closed.map((d) => t.weekday(d));

  const cookies = products.filter((p) => p.category === 'cookies');
  const cookieLead = cookies.length ? Math.max(...cookies.map((p) => p.leadDays)) : 1;
  const customLead = settings.custom.leadDays;

  const options: { icon: IconName; title: string; lead: number; note: string; cta: string; to: string }[] = [
    { icon: 'gift', title: t.cookies.title, lead: cookieLead, note: t.cookies.note, cta: t.cookies.cta, to: '/cookies' },
    { icon: 'heart', title: t.box.title, lead: cookieLead, note: t.box.note, cta: t.box.cta, to: '/products/build-your-box' },
    { icon: 'sparkle', title: t.custom.title, lead: customLead, note: t.custom.note, cta: t.custom.cta, to: '/custom-cakes#builder' },
  ];

  return (
    <>
      <Seo
        title={t.seoTitle}
        description={t.seoDescription}
        path="/availability"
      />
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        intro={t.intro}
        crumbs={[{ label: t.crumb }]}
      />

      <section className="section section--tight">
        <div className="container">
          <ul className="avail-cards">
            {options.map((o, i) => (
              <Reveal as="li" key={o.title} delay={i * 90} className="avail-card">
                <span className="avail-card__icon">
                  <Icon name={o.icon} />
                </span>
                <h2 className="avail-card__title">{o.title}</h2>
                <p className="muted small">{o.note}</p>
                <p className="avail-card__label">{t.nextAvailable}</p>
                <p className="avail-card__date serif">{formatDate(firstAvailable(overrides, o.lead, closed), { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                <p className="small muted">{o.lead === 0 ? t.sameDay : t.orderAhead(o.lead)}</p>
                <Link to={o.to} className="link avail-card__cta">
                  {o.cta} <Icon name="arrow" />
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--cream" aria-labelledby="calendar-title">
        <div className="container availability">
          <Reveal className="availability__copy">
            <span className="eyebrow">{t.calendarEyebrow}</span>
            <h2 id="calendar-title">{t.calendarTitle}</h2>
            <p className="lead">{t.calendarLead}</p>
            <ul className="availability__notes">
              <li>
                <Icon name="calendar" /> {t.weddings}
              </li>
              <li>
                <Icon name="clock" /> {t.customNotice(customLead)}
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

      <section className="section" aria-labelledby="hours-title">
        <div className="container availability">
          <Reveal className="availability__copy">
            <span className="eyebrow">{t.visitEyebrow}</span>
            <h2 id="hours-title">{t.hoursTitle}</h2>
            <p className="muted">
              {site.address.street}, {site.address.city}. {t.pickupNote}
            </p>
          </Reveal>
          <Reveal delay={120}>
            <dl className="hours">
              {site.hours.map((h) => (
                <div key={h.days}>
                  <dt>{h.days}</dt>
                  <dd>{h.time}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>
    </>
  );
}
