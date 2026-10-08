import { Link } from 'react-router';
import { Icon } from '../components/Icon';
import { Img } from '../components/Img';
import { Newsletter } from '../components/Newsletter';
import { Reveal } from '../components/Reveal';
import { Seo } from '../components/Seo';
import { useCopy } from '../i18n';

const icons = ['leaf', 'heart', 'sparkle'] as const;

const en = {
  values: [
    { title: 'Honest ingredients', text: 'Real butter, free-range eggs, single-origin chocolate and fruit from growers we know by name.' },
    { title: 'Made by hand', text: 'Every layer is baked, filled and finished by hand in our studio — never frozen, never rushed.' },
    { title: 'Thoughtful details', text: 'From the first sketch to the ribbon on the box, we care about the little things you remember.' },
  ],
  seoTitle: 'Our Story',
  seoDescription: 'Sweet Daisy is a boutique cake studio focused on handcrafted cakes, thoughtful details and beautiful presentation.',
  eyebrow: 'Our story',
  heading: (
    <>
      A little sweetness, <em>made by hand.</em>
    </>
  ),
  lead: 'Sweet Daisy began at a kitchen table with a single birthday cake and a simple belief: the cake should be as memorable as the moment.',
  studioAlt: 'The Sweet Daisy studio',
  studioEyebrow: 'The studio',
  studioTitle: 'Small batches. Big moments.',
  studioLead:
    'Today we’re a small team of bakers and decorators working from a light-filled studio on Magnolia Street. We still bake in small batches, still pipe every daisy by hand, and still get butterflies when a box leaves the door.',
  studioText:
    'Our cakes are inspired by the seasons and by the people we bake for — from intimate birthdays to weddings for two hundred. We believe in flavour first, beautiful restraint and a little touch of gold.',
  handsAlt: 'Piping buttercream by hand',
  believeEyebrow: 'What we believe',
  believeTitle: 'Crafted with intention.',
  boxAlt: 'Sweet Daisy signature box',
  presentationEyebrow: 'Presentation',
  presentationTitle: 'Opening the box is part of the gift.',
  presentationText:
    'Every order leaves the studio in our signature ivory box, tied with sage ribbon and finished with a handwritten card. Because the anticipation is half the fun.',
  shop: 'Shop Cookies',
  custom: 'Create a Custom Cake',
};
const es: typeof en = {
  values: [
    { title: 'Ingredientes honestos', text: 'Mantequilla de verdad, huevos de gallinas libres, chocolate de origen único y fruta de productores que conocemos por su nombre.' },
    { title: 'Hecho a mano', text: 'Cada capa se hornea, se rellena y se termina a mano en nuestro estudio: nunca congelada, nunca con prisas.' },
    { title: 'Detalles con cariño', text: 'Desde el primer boceto hasta el listón de la caja, cuidamos esos pequeños detalles que se recuerdan.' },
  ],
  seoTitle: 'Nuestra historia',
  seoDescription: 'Sweet Daisy es un estudio de repostería boutique dedicado a pasteles artesanales, detalles cuidados y una presentación preciosa.',
  eyebrow: 'Nuestra historia',
  heading: (
    <>
      Un poco de dulzura, <em>hecha a mano.</em>
    </>
  ),
  lead: 'Sweet Daisy nació en la mesa de una cocina, con un solo pastel de cumpleaños y una idea sencilla: el pastel debe ser tan memorable como el momento.',
  studioAlt: 'El estudio de Sweet Daisy',
  studioEyebrow: 'El estudio',
  studioTitle: 'Lotes pequeños. Grandes momentos.',
  studioLead:
    'Hoy somos un pequeño equipo de reposteros y decoradores que trabaja en un estudio lleno de luz en Magnolia Street. Seguimos horneando en lotes pequeños, seguimos decorando cada margarita a mano y seguimos sintiendo mariposas cada vez que una caja sale por la puerta.',
  studioText:
    'Nuestros pasteles se inspiran en las estaciones y en las personas para quienes horneamos: desde cumpleaños íntimos hasta bodas para doscientos invitados. Creemos en el sabor ante todo, en la elegancia sencilla y en un toque de dorado.',
  handsAlt: 'Decorando con crema de mantequilla a mano',
  believeEyebrow: 'En qué creemos',
  believeTitle: 'Hecho con intención.',
  boxAlt: 'La caja distintiva de Sweet Daisy',
  presentationEyebrow: 'Presentación',
  presentationTitle: 'Abrir la caja es parte del regalo.',
  presentationText:
    'Cada pedido sale del estudio en nuestra caja color marfil, atada con un listón verde salvia y con una tarjeta escrita a mano. Porque la emoción de la espera es la mitad de la diversión.',
  shop: 'Ver galletas',
  custom: 'Crea un pastel personalizado',
};

export default function About() {
  const t = useCopy({ en, es });
  const values = t.values.map((v, i) => ({ ...v, icon: icons[i] }));
  return (
    <>
      <Seo title={t.seoTitle} description={t.seoDescription} path="/about" />

      <section className="about-hero">
        <div className="container about-hero__inner">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1 className="display">{t.heading}</h1>
          <p className="lead">{t.lead}</p>
        </div>
        <div className="container">
          <Img src="studio" alt={t.studioAlt} ratio="21 / 9" width={1800} sizes="100vw" priority tint="#F6E7E3" className="about-hero__img" />
        </div>
      </section>

      <section className="section">
        <div className="container story__grid story__grid--reverse">
          <Reveal className="story__copy">
            <span className="eyebrow">{t.studioEyebrow}</span>
            <h2>{t.studioTitle}</h2>
            <p className="lead">{t.studioLead}</p>
            <p className="muted">{t.studioText}</p>
          </Reveal>
          <Reveal delay={120} className="story__media">
            <Img src="hands" alt={t.handsAlt} ratio="4 / 5" width={1000} sizes="(min-width: 900px) 45vw, 100vw" tint="#F6E7E3" />
          </Reveal>
        </div>
      </section>

      <section className="section section--cream">
        <div className="container">
          <Reveal className="section-head section-head--center">
            <div className="section-head__text">
              <span className="eyebrow eyebrow--plain">{t.believeEyebrow}</span>
              <h2>{t.believeTitle}</h2>
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
            <Img src="packaging" alt={t.boxAlt} ratio="4 / 5" width={1000} sizes="(min-width: 900px) 45vw, 100vw" tint="#F6E7E3" />
          </Reveal>
          <Reveal delay={120} className="story__copy">
            <span className="eyebrow">{t.presentationEyebrow}</span>
            <h2>{t.presentationTitle}</h2>
            <p className="muted">{t.presentationText}</p>
            <div className="hero__ctas">
              <Link to="/shop" className="btn">
                {t.shop}
              </Link>
              <Link to="/custom-cakes" className="btn btn--outline">
                {t.custom}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Newsletter />
    </>
  );
}
