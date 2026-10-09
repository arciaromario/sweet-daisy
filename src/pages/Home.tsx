import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from '../components/Icon';
import { DaisyMark } from '../components/Logo';
import { Img } from '../components/Img';
import { Newsletter } from '../components/Newsletter';
import { ProductCard } from '../components/ProductCard';
import { QuickView } from '../components/QuickView';
import { Reveal } from '../components/Reveal';
import { ReviewCard } from '../components/ReviewCard';
import { Stars } from '../components/Stars';
import { Seal } from '../components/Seal';
import { Seo } from '../components/Seo';
import { useCatalog } from '../context/CatalogContext';
import { formatPrice, MIX_BOX_SLUG, packCount, type Product } from '../data/products';
import { useSite } from '../context/CatalogContext';
import { ratingSummary, useReviews } from '../hooks/useReviews';
import { useCopy } from '../i18n';
import { firstAvailable, formatDate } from '../lib/availability';

const testimonialNames = ['Isabella M.', 'Claire & Daniel', 'Natalia R.', 'Amara J.'];

const en = {
  packCopy: {
    2: { title: 'A treat for two', note: 'Or one, we won’t tell.' },
    4: { title: 'Share with friends', note: 'The most-ordered pack.' },
    6: { title: 'The party box', note: 'For birthdays, offices and cravings.' },
  } as Record<number, { title: string; note: string }>,
  testimonials: [
    {
      quote: 'The best cookies in Omaha, no contest. The Biscoff one is gooey in the middle and still warm when you pick it up.',
      occasion: 'Pack of 6',
    },
    {
      quote: 'Sweet Daisy turned a few Pinterest photos into the wedding cake of our dreams. Calm, thoughtful and so talented.',
      occasion: 'Wedding cake',
    },
    {
      quote: 'I built a box with every flavour for the office and it was gone in ten minutes. Already ordering the next one.',
      occasion: 'Build your own box',
    },
    {
      quote: 'Ordering was effortless and the box arrived tied with a ribbon, like a gift from a little Parisian boutique.',
      occasion: 'Gift box',
    },
  ],
  heroEyebrow: 'New York–style cookies · Omaha',
  heroTitle: (
    <>
      Big, gooey cookies baked <em>fresh</em> every day.
    </>
  ) as ReactNode,
  heroLead: 'Thick New York–style cookies with crisp edges and soft, melty centres — boxed in packs of 2, 4 and 6 for gifting, sharing or keeping.',
  shopCookies: 'Shop Cookies',
  buildYourBoxCta: 'Build Your Box',
  trustButter: 'Brown butter, real chocolate',
  trustPickup: 'Pickup & local delivery',
  heroImgAlt: 'A stack of thick New York–style chocolate chip cookies',
  nextPickup: 'Next pickup',
  viewAvailability: 'View availability',
  packsEyebrow: 'Pick your pack',
  packsTitle: 'However many you’re craving.',
  packsIntro: 'Every flavour comes in packs of 2, 4 and 6 — or mix them in a box you build yourself.',
  from: (price: string) => `From ${price}`,
  buildYourBox: 'Build your box',
  mixAny: 'Mix any flavours',
  mixNote: 'Choose exactly what goes in, cookie by cookie.',
  startBuilding: 'Start building',
  menuEyebrow: 'The cookie menu',
  menuTitle: 'Our sweetest favorites',
  menuAside: 'Baked fresh to order — order a day ahead for pickup or local delivery.',
  seeAllCookies: 'See all cookies',
  customEyebrow: 'Also by Sweet Daisy · Custom cakes',
  customTitle: (
    <>
      Your cake. <em>Your story.</em>
    </>
  ) as ReactNode,
  customLead: 'Tell us what you’re celebrating and we’ll create something as special as the moment itself.',
  steps: [
    { title: 'Share your idea', text: 'Size, flavours, colours and a few inspiration photos.' },
    { title: 'We design it together', text: 'A personal quote and sketch within 48 hours.' },
    { title: 'Celebrate', text: 'Collect from the studio or have it delivered with care.' },
  ],
  requestCustom: 'Request a Custom Cake',
  cfAlt1: 'Tiered custom wedding cake',
  cfAlt2: 'Custom floral birthday cake',
  cfAlt3: 'Custom pistachio and rose cake',
  studioAlt: 'Inside the Sweet Daisy cake studio',
  seal: 'Made by hand · Sweet Daisy · Omaha · ',
  storyEyebrow: 'Our story',
  storyTitle: 'A little sweetness, made by hand.',
  storyLead: 'Sweet Daisy is a small Omaha bakery best known for big New York–style cookies — thick, golden at the edges and gooey in the middle.',
  storyText:
    'Every batch is mixed and baked by hand with brown butter, real chocolate and plenty of patience, then boxed with a ribbon and a handwritten note. And when a celebration calls for something bigger, we design custom cakes made just for the moment.',
  factBoxes: 'Boxes baked and boxed',
  factScratch: 'Made from scratch',
  factReview: 'Average review',
  discoverStory: 'Discover Our Story',
  reviewsEyebrow: 'Reviews',
  reviewsTitle: 'Loved by sweet tooths.',
  stars: '5 out of 5 stars',
  ratingLine: (avg: string, n: number) => `${avg} average from ${n} ${n === 1 ? 'review' : 'reviews'}`,
  allReviews: 'Read all reviews',
  writeReview: 'Leave a review',
};
const es: typeof en = {
  packCopy: {
    2: { title: 'Un antojo para dos', note: 'O para uno, no le diremos a nadie.' },
    4: { title: 'Para compartir con amigos', note: 'El paquete más pedido.' },
    6: { title: 'La caja de fiesta', note: 'Para cumpleaños, oficinas y antojos.' },
  },
  testimonials: [
    {
      quote: 'Las mejores galletas de Omaha, sin duda. La de Biscoff es suave por dentro y todavía está tibia cuando la recoges.',
      occasion: 'Paquete de 6',
    },
    {
      quote: 'Sweet Daisy convirtió unas cuantas fotos de Pinterest en el pastel de bodas de nuestros sueños. Tranquilas, atentas y muy talentosas.',
      occasion: 'Pastel de bodas',
    },
    {
      quote: 'Armé una caja con todos los sabores para la oficina y desapareció en diez minutos. Ya estoy pidiendo la siguiente.',
      occasion: 'Arma tu propia caja',
    },
    {
      quote: 'Hacer el pedido fue facilísimo y la caja llegó atada con un listón, como un regalo de una pequeña boutique parisina.',
      occasion: 'Caja de regalo',
    },
  ],
  heroEyebrow: 'Galletas estilo New York · Omaha',
  heroTitle: (
    <>
      Galletas grandes y suaves, horneadas <em>frescas</em> cada día.
    </>
  ),
  heroLead: 'Galletas gruesas estilo New York, con bordes crujientes y centros suaves y derretidos, en paquetes de 2, 4 y 6 para regalar, compartir o quedártelas.',
  shopCookies: 'Ver galletas',
  buildYourBoxCta: 'Arma tu caja',
  trustButter: 'Mantequilla dorada, chocolate de verdad',
  trustPickup: 'Recogida y entrega a domicilio local',
  heroImgAlt: 'Una pila de galletas gruesas de chispas de chocolate estilo New York',
  nextPickup: 'Próxima recogida',
  viewAvailability: 'Ver disponibilidad',
  packsEyebrow: 'Elige tu paquete',
  packsTitle: 'Las que se te antojen.',
  packsIntro: 'Cada sabor viene en paquetes de 2, 4 y 6, o mézclalos en una caja que armas tú.',
  from: (price) => `Desde ${price}`,
  buildYourBox: 'Arma tu caja',
  mixAny: 'Mezcla los sabores que quieras',
  mixNote: 'Elige exactamente qué lleva, galleta por galleta.',
  startBuilding: 'Empieza a armarla',
  menuEyebrow: 'El menú de galletas',
  menuTitle: 'Nuestras favoritas',
  menuAside: 'Horneadas al momento: haz tu pedido con un día de anticipación para recoger o entrega a domicilio local.',
  seeAllCookies: 'Ver todas las galletas',
  customEyebrow: 'También de Sweet Daisy · Pasteles personalizados',
  customTitle: (
    <>
      Tu pastel. <em>Tu historia.</em>
    </>
  ),
  customLead: 'Cuéntanos qué celebras y crearemos algo tan especial como el momento.',
  steps: [
    { title: 'Comparte tu idea', text: 'Tamaño, sabores, colores y algunas fotos de inspiración.' },
    { title: 'Lo diseñamos juntos', text: 'Una cotización personalizada y un boceto en menos de 48 horas.' },
    { title: 'Celebra', text: 'Recógelo en el estudio o recíbelo en casa con todo cuidado.' },
  ],
  requestCustom: 'Pide un pastel personalizado',
  cfAlt1: 'Pastel de bodas personalizado de varios pisos',
  cfAlt2: 'Pastel de cumpleaños personalizado con flores',
  cfAlt3: 'Pastel personalizado de pistacho y rosa',
  studioAlt: 'Dentro del estudio de pasteles de Sweet Daisy',
  seal: 'Hecho a mano · Sweet Daisy · Omaha · ',
  storyEyebrow: 'Nuestra historia',
  storyTitle: 'Un poco de dulzura, hecha a mano.',
  storyLead: 'Sweet Daisy es una pequeña pastelería de Omaha conocida por sus grandes galletas estilo New York: gruesas, doradas en los bordes y suaves por dentro.',
  storyText:
    'Cada tanda se mezcla y se hornea a mano con mantequilla dorada, chocolate de verdad y mucha paciencia, y luego se empaca con un listón y una nota escrita a mano. Y cuando una celebración pide algo más grande, diseñamos pasteles personalizados hechos para ese momento.',
  factBoxes: 'Cajas horneadas y empacadas',
  factScratch: 'Hecho desde cero',
  factReview: 'Calificación promedio',
  discoverStory: 'Conoce nuestra historia',
  reviewsEyebrow: 'Reseñas',
  reviewsTitle: 'Amadas por los golosos.',
  stars: '5 de 5 estrellas',
  ratingLine: (avg, n) => `${avg} de promedio en ${n} ${n === 1 ? 'opinión' : 'opiniones'}`,
  allReviews: 'Ver todas las opiniones',
  writeReview: 'Deja tu opinión',
};

export default function Home() {
  const t = useCopy({ en, es });
  const real = useReviews() ?? [];
  const summary = ratingSummary(real);
  const { products, overrides, settings, getProduct } = useCatalog();
  const site = useSite();
  const [quick, setQuick] = useState<Product | null>(null);
  const cookies = products.filter((p) => p.category === 'cookies' && p.slug !== MIX_BOX_SLUG);
  const box = getProduct(MIX_BOX_SLUG);
  const packSizes = (box ?? cookies[0])?.sizes ?? [];
  const cookieLead = cookies.length ? Math.min(...cookies.map((p) => p.leadDays)) : 1;
  const nextDate = firstAvailable(overrides, cookieLead, settings.store.closedWeekdays);
  /** Cheapest price for a pack of n across the cookie menu. */
  const packFrom = (n: number) => {
    const prices = cookies.flatMap((p) => p.sizes.filter((x) => packCount(x.label) === n).map((x) => x.price));
    return prices.length ? Math.min(...prices) : null;
  };

  return (
    <>
      <Seo
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Bakery',
          name: 'Sweet Daisy — Cakes and Treats',
          description: site.description,
          telephone: site.phone,
          email: site.email,
          address: {
            '@type': 'PostalAddress',
            streetAddress: site.address.street,
            addressLocality: site.address.city,
            addressRegion: site.address.region,
            postalCode: site.address.postal,
            addressCountry: site.address.country,
          },
          sameAs: [site.instagram, site.facebook, site.tiktok],
          priceRange: '$$',
        }}
      />

      {/* HERO ------------------------------------------------------------ */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero__grid">
          <div className="hero__copy">
            <span className="eyebrow hero__eyebrow">{t.heroEyebrow}</span>
            <h1 id="hero-title" className="display hero__title">
              {t.heroTitle}
            </h1>
            <p className="lead hero__lead">
              {t.heroLead}
            </p>
            <div className="hero__ctas">
              <Link to="/cookies" className="btn">
                {t.shopCookies}
              </Link>
              <Link to={`/products/${MIX_BOX_SLUG}`} className="btn btn--outline">
                {t.buildYourBoxCta}
              </Link>
            </div>
            <ul className="hero__trust">
              <li>
                <Icon name="leaf" /> {t.trustButter}
              </li>
              <li>
                <Icon name="store" /> {t.trustPickup}
              </li>
            </ul>
          </div>

          <div className="hero__visual">
            <Img src="cookies" alt={t.heroImgAlt} ratio="4 / 5" width={1400} sizes="(min-width: 900px) 52vw, 100vw" priority className="hero__img" tint="#F6E7E3" />
            <div className="hero__inset" aria-hidden="true">
              <Img src="packaging" alt="" ratio="1 / 1" width={400} sizes="200px" tint="#EFEEE6" />
            </div>
            <Link to="/availability" className="hero__card">
              <span className="hero__card-label">
                <Icon name="calendar" /> {t.nextPickup}
              </span>
              <span className="hero__card-date serif">{formatDate(nextDate, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              <span className="hero__card-link">
                {t.viewAvailability} <Icon name="arrow" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* PACKS ------------------------------------------------------------ */}
      <section className="section packs" aria-labelledby="packs-title">
        <div className="container">
          <Reveal className="section-head section-head--center">
            <div className="section-head__text">
              <span className="eyebrow eyebrow--plain">{t.packsEyebrow}</span>
              <h2 id="packs-title">{t.packsTitle}</h2>
              <p className="muted">{t.packsIntro}</p>
            </div>
          </Reveal>
          <ul className="packs__grid">
            {packSizes.map((size, i) => {
              const n = packCount(size.label);
              const copy = t.packCopy[n];
              return (
                <Reveal as="li" key={size.id} delay={i * 90} className="pack">
                  <Link to="/cookies" className="pack__link">
                    <span className="pack__n serif" aria-hidden="true">
                      {n}
                    </span>
                    <span className="pack__label">{size.label}</span>
                    {copy && <span className="pack__title serif">{copy.title}</span>}
                    {copy && <span className="pack__note">{copy.note}</span>}
                    <span className="pack__price">{t.from(formatPrice(packFrom(n) ?? size.price))}</span>
                  </Link>
                </Reveal>
              );
            })}
            <Reveal as="li" delay={packSizes.length * 90} className="pack pack--mix">
              <Link to={`/products/${MIX_BOX_SLUG}`} className="pack__link">
                <span className="pack__n" aria-hidden="true">
                  <DaisyMark className="pack__daisy" />
                </span>
                <span className="pack__label">{t.buildYourBox}</span>
                <span className="pack__title serif">{t.mixAny}</span>
                <span className="pack__note">{t.mixNote}</span>
                <span className="pack__price">
                  {t.startBuilding} <Icon name="arrow" />
                </span>
              </Link>
            </Reveal>
          </ul>
        </div>
      </section>

      {/* BESTSELLERS ---------------------------------------------------------- */}
      <section className="section section--cream" aria-labelledby="bestsellers-title">
        <div className="container">
          <Reveal className="section-head">
            <div className="section-head__text">
              <span className="eyebrow">{t.menuEyebrow}</span>
              <h2 id="bestsellers-title">{t.menuTitle}</h2>
            </div>
            <p className="muted section-head__aside">{t.menuAside}</p>
          </Reveal>
          <div className="product-grid product-grid--rail">
            {cookies.map((p) => (
              <ProductCard key={p.slug} product={p} showOptions onQuickView={setQuick} />
            ))}
          </div>
          <div className="center-cta">
            <Link to="/cookies" className="btn btn--outline">
              {t.seeAllCookies}
            </Link>
          </div>
        </div>
      </section>

      {/* CUSTOM CAKES ------------------------------------------------------- */}
      <section className="custom-feature" aria-labelledby="custom-title">
        <div className="container custom-feature__grid">
          <Reveal className="custom-feature__copy">
            <span className="eyebrow">{t.customEyebrow}</span>
            <h2 id="custom-title">
              {t.customTitle}
            </h2>
            <p className="lead">{t.customLead}</p>
            <ol className="custom-feature__steps">
              {t.steps.map((step, i) => (
                <li key={i}>
                  <span className="serif">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link to="/custom-cakes#builder" className="btn btn--light">
              {t.requestCustom}
            </Link>
          </Reveal>

          <div className="custom-feature__gallery">
            <Reveal delay={0} className="cf-img cf-img--1">
              <Img src="wedding" alt={t.cfAlt1} ratio="3 / 4" width={900} sizes="(min-width: 900px) 26vw, 50vw" tint="#6d6a52" />
            </Reveal>
            <Reveal delay={120} className="cf-img cf-img--2">
              <Img src="floral" alt={t.cfAlt2} ratio="1 / 1" width={700} sizes="(min-width: 900px) 20vw, 45vw" tint="#6d6a52" />
            </Reveal>
            <Reveal delay={240} className="cf-img cf-img--3">
              <Img src="pistachio" alt={t.cfAlt3} ratio="4 / 5" width={700} sizes="(min-width: 900px) 20vw, 45vw" tint="#6d6a52" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* BRAND STORY --------------------------------------------------------- */}
      <section className="section story" aria-labelledby="story-title">
        <div className="container story__grid">
          <Reveal className="story__media">
            <Img src="studio" alt={t.studioAlt} ratio="4 / 5" width={1100} sizes="(min-width: 900px) 45vw, 100vw" tint="#EFEEE6" />
            <Seal text={t.seal} />
          </Reveal>
          <Reveal delay={120} className="story__copy">
            <span className="eyebrow">{t.storyEyebrow}</span>
            <h2 id="story-title">{t.storyTitle}</h2>
            <p className="lead">{t.storyLead}</p>
            <p className="muted">{t.storyText}</p>
            <dl className="story__facts">
              <div>
                <dt className="serif">2,400+</dt>
                <dd>{t.factBoxes}</dd>
              </div>
              <div>
                <dt className="serif">100%</dt>
                <dd>{t.factScratch}</dd>
              </div>
              <div>
                <dt className="serif">4.9</dt>
                <dd>{t.factReview}</dd>
              </div>
            </dl>
            <Link to="/about" className="link">
              {t.discoverStory} <Icon name="arrow" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* TESTIMONIALS -------------------------------------------------------- */}
      <section className="section section--sage testimonials" aria-labelledby="reviews-title">
        <div className="container">
          <Reveal className="section-head section-head--center">
            <div className="section-head__text">
              <span className="eyebrow eyebrow--plain">{t.reviewsEyebrow}</span>
              <h2 id="reviews-title">{t.reviewsTitle}</h2>
            </div>
          </Reveal>
          {real.length > 0 && (
            <p className="testimonials__rating">
              <Stars value={summary.average} className="quote__stars" /> <span className="small">{t.ratingLine(summary.average.toFixed(1), summary.count)}</span>
            </p>
          )}
          <div className="testimonials__grid">
            {real.length > 0
              ? real.slice(0, 4).map((r, i) => (
                  <Reveal key={r.id} delay={i * 90}>
                    <ReviewCard review={r} />
                  </Reveal>
                ))
              : t.testimonials.map((r, i) => (
                  <Reveal as="figure" key={testimonialNames[i]} delay={i * 90} className="quote">
                    <div className="quote__stars" aria-label={t.stars}>
                      {Array.from({ length: 5 }, (_, s) => (
                        <Icon key={s} name="star" />
                      ))}
                    </div>
                    <blockquote>“{r.quote}”</blockquote>
                    <figcaption>
                      <span className="quote__name">{testimonialNames[i]}</span>
                      <span className="quote__occasion">{r.occasion}</span>
                    </figcaption>
                  </Reveal>
                ))}
          </div>
          <div className="testimonials__ctas">
            {real.length > 0 && (
              <Link to="/reviews" className="btn btn--outline">
                {t.allReviews}
              </Link>
            )}
            <Link to="/reviews#write" className="link">
              {t.writeReview} <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>

      <Newsletter />

      <QuickView product={quick} onClose={() => setQuick(null)} />
    </>
  );
}
