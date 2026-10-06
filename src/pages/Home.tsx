import { useState } from 'react';
import { Link } from 'react-router';
import { Icon } from '../components/Icon';
import { Img } from '../components/Img';
import { Newsletter } from '../components/Newsletter';
import { ProductCard } from '../components/ProductCard';
import { QuickView } from '../components/QuickView';
import { Reveal } from '../components/Reveal';
import { Seo } from '../components/Seo';
import { useCatalog } from '../context/CatalogContext';
import { pickBestsellers, type Product } from '../data/products';
import { useSite } from '../context/CatalogContext';
import { firstAvailable, formatDate } from '../lib/availability';

const collections = [
  { title: 'Celebration Cakes', note: 'Tiered & layered', image: 'celebration', href: '/shop?category=cakes', tint: '#F6E7E3' },
  { title: 'Birthday Cakes', note: 'Made to be wished upon', image: 'birthday', href: '/shop?category=cakes', tint: '#EFEEE6' },
  { title: 'Mini Cakes', note: 'Little & lovely', image: 'mini', href: '/shop?category=mini-cakes', tint: '#F6E7E3' },
  { title: 'Cupcakes', note: 'Boxed to gift', image: 'cupcakes', href: '/shop?category=cupcakes', tint: '#EFEEE6' },
  { title: 'Dessert Boxes', note: 'For sharing', image: 'dessertBox', href: '/shop?category=treats', tint: '#F6E7E3' },
  { title: 'Seasonal Treats', note: 'Here for a moment', image: 'seasonal', href: '/shop?category=seasonal', tint: '#EFEEE6' },
];

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
    quote: 'The most beautiful cake I have ever ordered — and it tasted even better than it looked. Every guest asked where it was from.',
    name: 'Isabella M.',
    occasion: 'Birthday celebration',
  },
  {
    quote: 'Sweet Daisy turned a few Pinterest photos into the wedding cake of our dreams. Calm, thoughtful and so talented.',
    name: 'Claire & Daniel',
    occasion: 'Wedding cake',
  },
  {
    quote: 'Our go-to for every family moment. The Strawberry Dream Cake is perfection — light, fresh and not too sweet.',
    name: 'Natalia R.',
    occasion: 'Regular customer',
  },
  {
    quote: 'Ordering was effortless and the cupcake box arrived looking like a gift from a Parisian boutique.',
    name: 'Amara J.',
    occasion: 'Office celebration',
  },
];

export default function Home() {
  const { products, overrides, settings } = useCatalog();
  const site = useSite();
  const [quick, setQuick] = useState<Product | null>(null);
  const bestsellers = pickBestsellers(products);
  const nextDate = firstAvailable(overrides, 2, settings.store.closedWeekdays);

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
            <span className="eyebrow hero__eyebrow">Boutique cake studio · Est. 2019</span>
            <h1 id="hero-title" className="display hero__title">
              Cakes made for your <em>sweetest</em> moments.
            </h1>
            <p className="lead hero__lead">
              Handcrafted cakes and treats, made with love for birthdays, celebrations and every moment worth making sweeter.
            </p>
            <div className="hero__ctas">
              <Link to="/shop" className="btn">
                Shop Cakes
              </Link>
              <Link to="/custom-cakes" className="btn btn--outline">
                Create a Custom Cake
              </Link>
            </div>
            <ul className="hero__trust">
              <li>
                <Icon name="leaf" /> Real butter, seasonal fruit
              </li>
              <li>
                <Icon name="store" /> Pickup & local delivery
              </li>
            </ul>
          </div>

          <div className="hero__visual">
            <Img src="hero" alt="A tall vanilla layer cake finished with fresh berries and flowers" ratio="4 / 5" width={1400} sizes="(min-width: 900px) 52vw, 100vw" priority className="hero__img" tint="#F6E7E3" />
            <div className="hero__inset" aria-hidden="true">
              <Img src="mini" alt="" ratio="1 / 1" width={400} sizes="200px" tint="#EFEEE6" />
            </div>
            <Link to="/custom-cakes#availability" className="hero__card">
              <span className="hero__card-label">
                <Icon name="calendar" /> Next available
              </span>
              <span className="hero__card-date serif">{formatDate(nextDate, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              <span className="hero__card-link">
                View availability <Icon name="arrow" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED COLLECTION ------------------------------------------------- */}
      <section className="section collections" aria-labelledby="collections-title">
        <div className="container">
          <Reveal className="section-head">
            <div className="section-head__text">
              <span className="eyebrow">The collection</span>
              <h2 id="collections-title">Made to be remembered.</h2>
            </div>
            <Link to="/shop" className="link">
              Shop all <Icon name="arrow" />
            </Link>
          </Reveal>

          <div className="collections__grid">
            {collections.map((c, i) => (
              <Reveal key={c.title} delay={(i % 3) * 90} className={`ctile ctile--${i + 1}`}>
                <Link to={c.href} className="ctile__link">
                  <Img src={c.image} alt="" ratio={i < 2 ? '4 / 5' : '1 / 1'} width={i < 2 ? 1000 : 700} sizes="(min-width: 900px) 33vw, 70vw" tint={c.tint} />
                  <span className="ctile__caption">
                    <span>
                      <span className="ctile__title">{c.title}</span>
                      <span className="ctile__note">{c.note}</span>
                    </span>
                    <span className="ctile__arrow" aria-hidden="true">
                      <Icon name="arrow" />
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BESTSELLERS ---------------------------------------------------------- */}
      <section className="section section--cream" aria-labelledby="bestsellers-title">
        <div className="container">
          <Reveal className="section-head">
            <div className="section-head__text">
              <span className="eyebrow">Bestsellers</span>
              <h2 id="bestsellers-title">Our sweetest favorites</h2>
            </div>
            <p className="muted section-head__aside">Order from 24–48 hours ahead for pickup or local delivery.</p>
          </Reveal>
          <div className="product-grid product-grid--rail">
            {bestsellers.map((p) => (
              <ProductCard key={p.slug} product={p} showOptions onQuickView={setQuick} />
            ))}
          </div>
          <div className="center-cta">
            <Link to="/shop" className="btn btn--outline">
              View all cakes & treats
            </Link>
          </div>
        </div>
      </section>

      {/* CUSTOM CAKES ------------------------------------------------------- */}
      <section className="custom-feature" aria-labelledby="custom-title">
        <div className="container custom-feature__grid">
          <Reveal className="custom-feature__copy">
            <span className="eyebrow">Custom cakes</span>
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
            <span className="story__stamp serif" aria-hidden="true">
              made
              <br />
              by hand
            </span>
          </Reveal>
          <Reveal delay={120} className="story__copy">
            <span className="eyebrow">Our story</span>
            <h2 id="story-title">A little sweetness, made by hand.</h2>
            <p className="lead">
              Sweet Daisy is a boutique cake studio where every cake is baked from scratch, layered by hand and finished with the kind of detail you
              notice the moment the box opens.
            </p>
            <p className="muted">
              We bake in small batches with real butter, free-range eggs and fruit from local growers — then take our time with the finishing touches: a
              ribbon of buttercream, a scattering of petals, a handwritten note. Because the cake is never just a cake. It’s the centre of the table and
              the start of a memory.
            </p>
            <dl className="story__facts">
              <div>
                <dt className="serif">2,400+</dt>
                <dd>Celebrations baked for</dd>
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
