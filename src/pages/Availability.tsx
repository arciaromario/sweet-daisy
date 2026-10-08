import { Link } from 'react-router';
import { AvailabilityCalendar } from '../components/AvailabilityCalendar';
import { Icon, type IconName } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { Reveal } from '../components/Reveal';
import { Seo } from '../components/Seo';
import { useCatalog, useSite } from '../context/CatalogContext';
import { weekdayNames } from '../data/settings';
import { firstAvailable, formatDate } from '../lib/availability';

export default function Availability() {
  const { products, overrides, settings } = useCatalog();
  const site = useSite();
  const closed = settings.store.closedWeekdays;
  const closedDays = closed.map((d) => weekdayNames[d]);

  const cookies = products.filter((p) => p.category === 'cookies');
  const cookieLead = cookies.length ? Math.max(...cookies.map((p) => p.leadDays)) : 1;
  const customLead = settings.custom.leadDays;

  const options: { icon: IconName; title: string; lead: number; note: string; cta: string; to: string }[] = [
    { icon: 'gift', title: 'NY cookies', lead: cookieLead, note: 'Packs of 2, 4 and 6 in every flavour.', cta: 'Shop cookies', to: '/cookies' },
    { icon: 'heart', title: 'Build your own box', lead: cookieLead, note: 'Mix any flavours in one box.', cta: 'Build your box', to: '/products/build-your-box' },
    { icon: 'sparkle', title: 'Custom cakes', lead: customLead, note: 'Designed with you, from sketch to stand.', cta: 'Design your cake', to: '/custom-cakes#builder' },
  ];

  return (
    <>
      <Seo
        title="Availability"
        description="See upcoming availability at Sweet Daisy, the earliest pickup for New York–style cookies and custom cakes, and how far ahead to order."
        path="/availability"
      />
      <PageHeader
        eyebrow="Availability"
        title="Plan your celebration"
        intro="Everything is baked by hand, so we take a limited number of orders each day. Here’s when we can bake for you."
        crumbs={[{ label: 'Availability' }]}
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
                <p className="avail-card__label">Next available</p>
                <p className="avail-card__date serif">{formatDate(firstAvailable(overrides, o.lead, closed), { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                <p className="small muted">{o.lead === 0 ? 'Ready the same day.' : `Order at least ${o.lead} ${o.lead === 1 ? 'day' : 'days'} ahead.`}</p>
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
            <span className="eyebrow">Calendar</span>
            <h2 id="calendar-title">Upcoming availability</h2>
            <p className="lead">Limited days fill up quickly — weekends especially. You choose your exact date and time when you order.</p>
            <ul className="availability__notes">
              <li>
                <Icon name="calendar" /> Weddings & tiered cakes: book 4–8 weeks ahead
              </li>
              <li>
                <Icon name="clock" /> Custom cakes: at least {customLead} days notice
              </li>
              {closedDays.length > 0 && (
                <li>
                  <Icon name="store" /> Closed {closedDays.join(', ')}
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
            <span className="eyebrow">Visit the studio</span>
            <h2 id="hours-title">Opening hours</h2>
            <p className="muted">
              {site.address.street}, {site.address.city}. Pickups are collected at the time you choose at checkout.
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
