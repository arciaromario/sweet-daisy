import { useState } from 'react';
import { Link } from 'react-router';
import { Icon } from '../components/Icon';
import { DaisyMark } from '../components/Logo';
import { Img } from '../components/Img';
import { Newsletter } from '../components/Newsletter';
import { ProductCard } from '../components/ProductCard';
import { QuickView } from '../components/QuickView';
import { Reveal } from '../components/Reveal';
import { Seal } from '../components/Seal';
import { Seo } from '../components/Seo';
import { useCatalog } from '../context/CatalogContext';
import { formatPrice, MIX_BOX_SLUG, packCount, type Product } from '../data/products';
import { useSite } from '../context/CatalogContext';
import { firstAvailable, formatDate } from '../lib/availability';

const packCopy: Record<number, { title: string; note: string }> = {
  2: { title: 'A treat for two', note: 'Or one, we won’t tell.' },
  4: { title: 'Share with friends', note: 'The most-ordered pack.' },
  6: { title: 'The party box', note: 'For birthdays, offices and cravings.' },
};

const gallery = [
  { image: 'floral', alt: 'Floral buttercream celebration cake', ratio: '4 / 5' },
  { image: 'packaging', alt: 'Sweet Daisy gift box tied with ribbon', ratio: '1 / 1' },
  { image: 'baking', alt: 'Behind the scenes in the Sweet Daisy studio', ratio: '3 / 4' },
  { image: 'sliced', alt: 'A slice of layered cake', ratio: '1 / 1' },
  { image: 'wedding', alt: 'Tiered wedding cake with fresh flowers', ratio: '3 / 4' },
  { image: 'macarons', alt: 'Pastel macarons', ratio: '4 / 5' },
  { image: 'celebrationTable', alt: 'Birthday celebration with candles', ratio: '1 / 1' },
  { image: 'hands', alt: 'Hands piping buttercream', ratio: '4 / 5' },
];

const testimonials = [
  {
    quote: 'The best cookies in Austin, no contest. The Biscoff one is gooey in the middle and still warm when you pick it up.',
    name: 'Isabella M.',
    occasion: 'Pack of 6',
  },
  {
    quote: 'Sweet Daisy turned a few Pinterest photos into the wedding cake of our dreams. Calm, thoughtful and so talented.',
    name: 'Claire & Daniel',
    occasion: 'Wedding cake',
  },
  {
    quote: 'I built a box with every flavour for the office and it was gone in ten minutes. Already ordering the next one.',
    name: 'Natalia R.',
    occasion: 'Build your own box',
  },
  {
    quote: 'Ordering was effortless and the box arrived tied with a ribbon, like a gift from a little Parisian boutique.',
    name: 'Amara J.',
    occasion: 'Gift box',
  },
];

export default function Home() {
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
            <span className="eyebrow hero__eyebrow">New York–style cookies · Austin</span>
            <h1 id="hero-title" className="display hero__title">
              Big, gooey cookies baked <em>fresh</em> every day.
            </h1>
            <p className="lead hero__lead">
              Thick New York–style cookies with crisp edges and soft, melty centres — boxed in packs of 2, 4 and 6 for gifting, sharing or keeping.
            </p>
            <div className="hero__ctas">
              <Link to="/cookies" className="btn">
                Shop Cookies
              </Link>
              <Link to={`/products/${MIX_BOX_SLUG}`} className="btn btn--outline">
                Build Your Box
              </Link>
            </div>
            <ul className="hero__trust">
              <li>
                <Icon name="leaf" /> Brown butter, real chocolate
              </li>
              <li>
                <Icon name="store" /> Pickup & local delivery
              </li>
            </ul>
          </div>

          <div className="hero__visual">
            <Img src="cookies" alt="A stack of thick New York–style chocolate chip cookies" ratio="4 / 5" width={1400} sizes="(min-width: 900px) 52vw, 100vw" priority className="hero__img" tint="#F6E7E3" />
            <div className="hero__inset" aria-hidden="true">
              <Img src="packaging" alt="" ratio="1 / 1" width={400} sizes="200px" tint="#EFEEE6" />
            </div>
            <Link to="/availability" className="hero__card">
              <span className="hero__card-label">
                <Icon name="calendar" /> Next pickup
              </span>
              <span className="hero__card-date serif">{formatDate(nextDate, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              <span className="hero__card-link">
                View availability <Icon name="arrow" />
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
              <span className="eyebrow eyebrow--plain">Pick your pack</span>
              <h2 id="packs-title">However many you’re craving.</h2>
              <p className="muted">Every flavour comes in packs of 2, 4 and 6 — or mix them in a box you build yourself.</p>
            </div>
          </Reveal>
          <ul className="packs__grid">
            {packSizes.map((size, i) => {
              const n = packCount(size.label);
              const copy = packCopy[n];
              return (
                <Reveal as="li" key={size.id} delay={i * 90} className="pack">
                  <Link to="/cookies" className="pack__link">
                    <span className="pack__n serif" aria-hidden="true">
                      {n}
                    </span>
                    <span className="pack__label">{size.label}</span>
                    {copy && <span className="pack__title serif">{copy.title}</span>}
                    {copy && <span className="pack__note">{copy.note}</span>}
                    <span className="pack__price">From {formatPrice(packFrom(n) ?? size.price)}</span>
                  </Link>
                </Reveal>
              );
            })}
            <Reveal as="li" delay={packSizes.length * 90} className="pack pack--mix">
              <Link to={`/products/${MIX_BOX_SLUG}`} className="pack__link">
                <span className="pack__n" aria-hidden="true">
                  <DaisyMark className="pack__daisy" />
                </span>
                <span className="pack__label">Build your box</span>
                <span className="pack__title serif">Mix any flavours</span>
                <span className="pack__note">Choose exactly what goes in, cookie by cookie.</span>
                <span className="pack__price">
                  Start building <Icon name="arrow" />
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
              <span className="eyebrow">The cookie menu</span>
              <h2 id="bestsellers-title">Our sweetest favorites</h2>
            </div>
            <p className="muted section-head__aside">Baked fresh to order — order a day ahead for pickup or local delivery.</p>
          </Reveal>
          <div className="product-grid product-grid--rail">
            {cookies.map((p) => (
              <ProductCard key={p.slug} product={p} showOptions onQuickView={setQuick} />
            ))}
          </div>
          <div className="center-cta">
            <Link to="/cookies" className="btn btn--outline">
              See all cookies
            </Link>
          </div>
        </div>
      </section>

      {/* CUSTOM CAKES ------------------------------------------------------- */}
      <section className="custom-feature" aria-labelledby="custom-title">
        <div className="container custom-feature__grid">
          <Reveal className="custom-feature__copy">
            <span className="eyebrow">Also by Sweet Daisy · Custom cakes</span>
            <h2 id="custom-title">
              Your cake. <em>Your story.</em>
            </h2>
            <p className="lead">Tell us what you’re celebrating and we’ll create something as special as the moment itself.</p>
            <ol className="custom-feature__steps">
              <li>
                <span className="serif">01</span>
                <div>
                  <strong>Share your idea</strong>
                  <p>Size, flavours, colours and a few inspiration photos.</p>
                </div>
              </li>
              <li>
                <span className="serif">02</span>
                <div>
                  <strong>We design it together</strong>
                  <p>A personal quote and sketch within 48 hours.</p>
                </div>
              </li>
              <li>
                <span className="serif">03</span>
                <div>
                  <strong>Celebrate</strong>
                  <p>Collect from the studio or have it delivered with care.</p>
                </div>
              </li>
            </ol>
            <Link to="/custom-cakes#builder" className="btn btn--light">
              Request a Custom Cake
            </Link>
          </Reveal>

          <div className="custom-feature__gallery">
            <Reveal delay={0} className="cf-img cf-img--1">
              <Img src="wedding" alt="Tiered custom wedding cake" ratio="3 / 4" width={900} sizes="(min-width: 900px) 26vw, 50vw" tint="#6d6a52" />
            </Reveal>
            <Reveal delay={120} className="cf-img cf-img--2">
              <Img src="floral" alt="Custom floral birthday cake" ratio="1 / 1" width={700} sizes="(min-width: 900px) 20vw, 45vw" tint="#6d6a52" />
            </Reveal>
            <Reveal delay={240} className="cf-img cf-img--3">
              <Img src="pistachio" alt="Custom pistachio and rose cake" ratio="4 / 5" width={700} sizes="(min-width: 900px) 20vw, 45vw" tint="#6d6a52" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* BRAND STORY --------------------------------------------------------- */}
      <section className="section story" aria-labelledby="story-title">
        <div className="container story__grid">
          <Reveal className="story__media">
            <Img src="studio" alt="Inside the Sweet Daisy cake studio" ratio="4 / 5" width={1100} sizes="(min-width: 900px) 45vw, 100vw" tint="#EFEEE6" />
            <Seal text="Made by hand · Sweet Daisy · Austin · " />
          </Reveal>
          <Reveal delay={120} className="story__copy">
            <span className="eyebrow">Our story</span>
            <h2 id="story-title">A little sweetness, made by hand.</h2>
            <p className="lead">
              Sweet Daisy is a small Austin bakery best known for big New York–style cookies — thick, golden at the edges and gooey in the middle.
            </p>
            <p className="muted">
              Every batch is mixed and baked by hand with brown butter, real chocolate and plenty of patience, then boxed with a ribbon and a handwritten
              note. And when a celebration calls for something bigger, we design custom cakes made just for the moment.
            </p>
            <dl className="story__facts">
              <div>
                <dt className="serif">2,400+</dt>
                <dd>Boxes baked and boxed</dd>
              </div>
              <div>
                <dt className="serif">100%</dt>
                <dd>Made from scratch</dd>
              </div>
              <div>
                <dt className="serif">4.9</dt>
                <dd>Average review</dd>
              </div>
            </dl>
            <Link to="/about" className="link">
              Discover Our Story <Icon name="arrow" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* SOCIAL GALLERY ------------------------------------------------------ */}
      <section className="section section--tight social" aria-labelledby="social-title">
        <div className="container">
          <Reveal className="section-head section-head--center">
            <div className="section-head__text">
              <span className="eyebrow eyebrow--plain">Instagram</span>
              <h2 id="social-title">
                Sweet moments <em>{site.handle}</em>
              </h2>
            </div>
          </Reveal>
          <div className="masonry">
            {gallery.map((g, i) => (
              <Reveal key={g.image + i} delay={(i % 4) * 80} className="masonry__item">
                <a href={site.instagram} target="_blank" rel="noreferrer" aria-label={`${g.alt} — view on Instagram`}>
                  <Img src={g.image} alt={g.alt} ratio={g.ratio} width={600} sizes="(min-width: 900px) 25vw, 50vw" />
                  <span className="masonry__overlay" aria-hidden="true">
                    <Icon name="instagram" />
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
          <div className="center-cta">
            <a href={site.instagram} target="_blank" rel="noreferrer" className="btn btn--outline">
              <Icon name="instagram" /> Follow Us
            </a>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS -------------------------------------------------------- */}
      <section className="section section--sage testimonials" aria-labelledby="reviews-title">
        <div className="container">
          <Reveal className="section-head section-head--center">
            <div className="section-head__text">
              <span className="eyebrow eyebrow--plain">Reviews</span>
              <h2 id="reviews-title">Loved by sweet tooths.</h2>
            </div>
          </Reveal>
          <div className="testimonials__grid">
            {testimonials.map((t, i) => (
              <Reveal as="figure" key={t.name} delay={i * 90} className="quote">
                <div className="quote__stars" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }, (_, s) => (
                    <Icon key={s} name="star" />
                  ))}
                </div>
                <blockquote>“{t.quote}”</blockquote>
                <figcaption>
                  <span className="quote__name">{t.name}</span>
                  <span className="quote__occasion">{t.occasion}</span>
                </figcaption>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Newsletter />

      <QuickView product={quick} onClose={() => setQuick(null)} />
    </>
  );
}
