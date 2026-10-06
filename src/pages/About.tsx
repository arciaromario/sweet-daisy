import { Link } from 'react-router';
import { Icon } from '../components/Icon';
import { Img } from '../components/Img';
import { Newsletter } from '../components/Newsletter';
import { Reveal } from '../components/Reveal';
import { Seo } from '../components/Seo';

const values = [
  { icon: 'leaf', title: 'Honest ingredients', text: 'Real butter, free-range eggs, single-origin chocolate and fruit from growers we know by name.' },
  { icon: 'heart', title: 'Made by hand', text: 'Every layer is baked, filled and finished by hand in our studio — never frozen, never rushed.' },
  { icon: 'sparkle', title: 'Thoughtful details', text: 'From the first sketch to the ribbon on the box, we care about the little things you remember.' },
] as const;

export default function About() {
  return (
    <>
      <Seo title="Our Story" description="Sweet Daisy is a boutique cake studio focused on handcrafted cakes, thoughtful details and beautiful presentation." path="/about" />

      <section className="about-hero">
        <div className="container about-hero__inner">
          <span className="eyebrow">Our story</span>
          <h1 className="display">
            A little sweetness, <em>made by hand.</em>
          </h1>
          <p className="lead">
            Sweet Daisy began at a kitchen table with a single birthday cake and a simple belief: the cake should be as memorable as the moment.
          </p>
        </div>
        <div className="container">
          <Img src="studio" alt="The Sweet Daisy studio" ratio="21 / 9" width={1800} sizes="100vw" priority tint="#F6E7E3" className="about-hero__img" />
        </div>
      </section>

      <section className="section">
        <div className="container story__grid story__grid--reverse">
          <Reveal className="story__copy">
            <span className="eyebrow">The studio</span>
            <h2>Small batches. Big moments.</h2>
            <p className="lead">
              Today we’re a small team of bakers and decorators working from a light-filled studio on Magnolia Street. We still bake in small batches,
              still pipe every daisy by hand, and still get butterflies when a box leaves the door.
            </p>
            <p className="muted">
              Our cakes are inspired by the seasons and by the people we bake for — from intimate birthdays to weddings for two hundred. We believe in
              flavour first, beautiful restraint and a little touch of gold.
            </p>
          </Reveal>
          <Reveal delay={120} className="story__media">
            <Img src="hands" alt="Piping buttercream by hand" ratio="4 / 5" width={1000} sizes="(min-width: 900px) 45vw, 100vw" tint="#F6E7E3" />
          </Reveal>
        </div>
      </section>

      <section className="section section--cream">
        <div className="container">
          <Reveal className="section-head section-head--center">
            <div className="section-head__text">
              <span className="eyebrow eyebrow--plain">What we believe</span>
              <h2>Crafted with intention.</h2>
            </div>
          </Reveal>
          <div className="values">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 90} className="value">
                <Icon name={v.icon} />
                <h3>{v.title}</h3>
                <p className="muted">{v.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container story__grid">
          <Reveal className="story__media">
            <Img src="packaging" alt="Sweet Daisy signature box" ratio="4 / 5" width={1000} sizes="(min-width: 900px) 45vw, 100vw" tint="#F6E7E3" />
          </Reveal>
          <Reveal delay={120} className="story__copy">
            <span className="eyebrow">Presentation</span>
            <h2>Opening the box is part of the gift.</h2>
            <p className="muted">
              Every order leaves the studio in our signature ivory box, tied with sage ribbon and finished with a handwritten card. Because the
              anticipation is half the fun.
            </p>
            <div className="hero__ctas">
              <Link to="/shop" className="btn">
                Shop Cakes
              </Link>
              <Link to="/custom-cakes" className="btn btn--outline">
                Create a Custom Cake
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Newsletter />
    </>
  );
}
