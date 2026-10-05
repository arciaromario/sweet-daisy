import { Link } from 'react-router';
import { AvailabilityCalendar } from '../components/AvailabilityCalendar';
import { CakeBuilder } from '../components/CakeBuilder';
import { Icon } from '../components/Icon';
import { Img } from '../components/Img';
import { Reveal } from '../components/Reveal';
import { Seo } from '../components/Seo';
import { useSettings } from '../context/CatalogContext';
import { weekdayNames } from '../data/settings';

const designs = [
  { image: 'wedding', title: 'The Garden Wedding', note: 'Three tiers · pressed flowers' },
  { image: 'floral', title: 'Blush Peony', note: 'Swiss meringue · fresh florals' },
  { image: 'birthday', title: 'Vintage Lambeth', note: 'Hand-piped heirloom borders' },
  { image: 'pistachio', title: 'Sage & Gold', note: 'Hand-painted · gold leaf' },
  { image: 'strawberry', title: 'Summer Berry Crown', note: 'Semi-naked · fresh fruit' },
  { image: 'chocolateAlt', title: 'Midnight Velvet', note: 'Ganache drip · sculpted' },
];

export default function CustomCakes() {
  const { custom, store } = useSettings();
  const closedDays = store.closedWeekdays.map((d) => weekdayNames[d]);
  return (
    <>
      <Seo
        title="Custom Cakes"
        description="Request a one-of-a-kind custom cake for birthdays, weddings and celebrations. Choose size, flavour, filling, frosting and decoration — we'll design it with you."
        path="/custom-cakes"
      />

      <section className="custom-hero">
        <div className="container custom-hero__grid">
          <div className="custom-hero__copy">
            <nav aria-label="Breadcrumb" className="crumbs">
              <ol>
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <span aria-current="page">Custom Cakes</span>
                </li>
              </ol>
            </nav>
            <span className="eyebrow">Custom cakes</span>
            <h1 className="display">
              Your cake. <em>Your story.</em>
            </h1>
            <p className="lead">
              Tell us what you’re celebrating and we’ll create something as special as the moment itself — designed with you, baked from scratch and
              finished entirely by hand.
            </p>
            <div className="hero__ctas">
              <a href="#builder" className="btn">
                Request a Custom Cake
              </a>
              <a href="#availability" className="btn btn--outline">
                View availability
              </a>
            </div>
          </div>
          <div className="custom-hero__media">
            <Img src="wedding" alt="A tiered custom celebration cake with fresh flowers" ratio="4 / 5" width={1200} sizes="(min-width: 900px) 45vw, 100vw" priority tint="#EFE4D6" />
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <ol className="process">
            {[
              ['01', 'Share your idea', 'Use the builder below to tell us about your celebration and share a few inspiration images.'],
              ['02', 'Receive your quote', 'Within 48 hours we send a personal quote and design notes — no commitment.'],
              ['03', 'Reserve your date', 'Approve the design and pay a 30% deposit to secure your date in our calendar.'],
              ['04', 'Celebrate', 'Collect from the studio or let us deliver and set up your cake with care.'],
            ].map(([n, t, d], i) => (
              <Reveal as="li" key={n} delay={i * 80}>
                <span className="process__n serif">{n}</span>
                <h2 className="process__t">{t}</h2>
                <p className="muted">{d}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--cream" aria-labelledby="designs-title">
        <div className="container">
          <Reveal className="section-head">
            <div className="section-head__text">
              <span className="eyebrow">Recent designs</span>
              <h2 id="designs-title">Made for someone special.</h2>
            </div>
            <p className="muted section-head__aside">A few of the cakes we’ve had the joy of creating. Every design begins with a conversation.</p>
          </Reveal>
          <div className="designs">
            {designs.map((d, i) => (
              <Reveal as="figure" key={d.title} delay={(i % 3) * 90} className={`design design--${i + 1}`}>
                <Img src={d.image} alt={d.title} ratio={i === 0 || i === 4 ? '3 / 4' : '1 / 1'} width={800} sizes="(min-width: 900px) 33vw, 50vw" />
                <figcaption>
                  <span className="serif">{d.title}</span>
                  <span className="muted small">{d.note}</span>
                </figcaption>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="availability" className="section" aria-labelledby="availability-title">
        <div className="container availability">
          <Reveal className="availability__copy">
            <span className="eyebrow">Availability</span>
            <h2 id="availability-title">Upcoming availability</h2>
            <p className="lead">
              We take a limited number of custom cakes each week so every one receives our full attention. Custom orders need at least{' '}
              {custom.leadDays} days notice.
            </p>
            <ul className="availability__notes">
              <li>
                <Icon name="calendar" /> Weddings & tiered cakes: book 4–8 weeks ahead
              </li>
              <li>
                <Icon name="clock" /> Shop cakes: from 24–48 hours ahead
              </li>
              {closedDays.length > 0 && (
                <li>
                  <Icon name="store" /> Closed {closedDays.join(', ')}
                </li>
              )}
            </ul>
          </Reveal>
          <Reveal delay={120} className="availability__cal">
            <AvailabilityCalendar leadDays={custom.leadDays} />
          </Reveal>
        </div>
      </section>

      <section id="builder" className="section section--sage" aria-labelledby="builder-title">
        <div className="container">
          <Reveal className="section-head section-head--center">
            <div className="section-head__text">
              <span className="eyebrow eyebrow--plain">Custom cake request</span>
              <h2 id="builder-title">Design your cake</h2>
              <p className="muted">Ten simple steps — it takes about three minutes.</p>
            </div>
          </Reveal>
          <CakeBuilder />
        </div>
      </section>
    </>
  );
}
