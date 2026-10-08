import { Link } from 'react-router';
import { CakeBuilder } from '../components/CakeBuilder';
import { Img } from '../components/Img';
import { Reveal } from '../components/Reveal';
import { Seo } from '../components/Seo';
import { useSettings } from '../context/CatalogContext';
import { useCopy } from '../i18n';

const en = {
  designs: [
    { image: 'wedding', title: 'The Garden Wedding', note: 'Three tiers · pressed flowers' },
    { image: 'floral', title: 'Blush Peony', note: 'Swiss meringue · fresh florals' },
    { image: 'birthday', title: 'Vintage Lambeth', note: 'Hand-piped heirloom borders' },
    { image: 'pistachio', title: 'Sage & Gold', note: 'Hand-painted · gold leaf' },
    { image: 'strawberry', title: 'Summer Berry Crown', note: 'Semi-naked · fresh fruit' },
    { image: 'chocolateAlt', title: 'Midnight Velvet', note: 'Ganache drip · sculpted' },
  ],
  seoTitle: 'Custom Cakes',
  seoDescription:
    "Request a one-of-a-kind custom cake for birthdays, weddings and celebrations. Choose size, flavour, filling, frosting and decoration — we'll design it with you.",
  breadcrumb: 'Breadcrumb',
  home: 'Home',
  crumb: 'Custom Cakes',
  eyebrow: 'Custom cakes',
  heading: (
    <>
      Your cake. <em>Your story.</em>
    </>
  ),
  lead: 'Tell us what you’re celebrating and we’ll create something as special as the moment itself — designed with you, baked from scratch and finished entirely by hand.',
  request: 'Request a Custom Cake',
  viewAvailability: 'View availability',
  heroAlt: 'A tiered custom celebration cake with fresh flowers',
  process: [
    ['01', 'Share your idea', 'Use the builder below to tell us about your celebration and share a few inspiration images.'],
    ['02', 'Receive your quote', 'Within 48 hours we send a personal quote and design notes — no commitment.'],
    ['03', 'Reserve your date', 'Approve the design and pay a 30% deposit to secure your date in our calendar.'],
    ['04', 'Celebrate', 'Collect from the studio or let us deliver and set up your cake with care.'],
  ],
  designsEyebrow: 'Recent designs',
  designsTitle: 'Made for someone special.',
  designsAside: 'A few of the cakes we’ve had the joy of creating. Every design begins with a conversation.',
  builderEyebrow: 'Custom cake request',
  builderTitle: 'Design your cake',
  builderIntro: (days: number) => `Ten simple steps — it takes about three minutes. Custom cakes need at least ${days} days notice ·`,
  seeAvailability: 'see availability',
};
const es: typeof en = {
  designs: [
    { image: 'wedding', title: 'Boda en el jardín', note: 'Tres pisos · flores prensadas' },
    { image: 'floral', title: 'Peonía rosada', note: 'Merengue suizo · flores frescas' },
    { image: 'birthday', title: 'Lambeth vintage', note: 'Bordes clásicos hechos a manga' },
    { image: 'pistachio', title: 'Salvia y oro', note: 'Pintado a mano · hoja de oro' },
    { image: 'strawberry', title: 'Corona de frutos rojos', note: 'Semidesnudo · fruta fresca' },
    { image: 'chocolateAlt', title: 'Terciopelo de medianoche', note: 'Goteo de ganache · esculpido' },
  ],
  seoTitle: 'Pasteles personalizados',
  seoDescription:
    'Pide un pastel personalizado único para cumpleaños, bodas y celebraciones. Elige tamaño, sabor, relleno, cobertura y decoración: lo diseñamos contigo.',
  breadcrumb: 'Ruta de navegación',
  home: 'Inicio',
  crumb: 'Pasteles personalizados',
  eyebrow: 'Pasteles personalizados',
  heading: (
    <>
      Tu pastel. <em>Tu historia.</em>
    </>
  ),
  lead: 'Cuéntanos qué celebras y crearemos algo tan especial como el momento mismo: diseñado contigo, horneado desde cero y terminado completamente a mano.',
  request: 'Pide un pastel personalizado',
  viewAvailability: 'Ver disponibilidad',
  heroAlt: 'Un pastel de celebración personalizado de varios pisos con flores frescas',
  process: [
    ['01', 'Comparte tu idea', 'Usa el diseñador de abajo para contarnos sobre tu celebración y compartir algunas imágenes de inspiración.'],
    ['02', 'Recibe tu presupuesto', 'En un plazo de 48 horas te enviamos un presupuesto personal y notas de diseño, sin compromiso.'],
    ['03', 'Reserva tu fecha', 'Aprueba el diseño y paga un anticipo del 30% para asegurar tu fecha en nuestro calendario.'],
    ['04', 'Celebra', 'Recógelo en el estudio o deja que lo entreguemos y montemos tu pastel con cuidado.'],
  ],
  designsEyebrow: 'Diseños recientes',
  designsTitle: 'Hechos para alguien especial.',
  designsAside: 'Algunos de los pasteles que hemos tenido la alegría de crear. Cada diseño empieza con una conversación.',
  builderEyebrow: 'Solicitud de pastel personalizado',
  builderTitle: 'Diseña tu pastel',
  builderIntro: (days) => `Diez pasos sencillos: toma unos tres minutos. Los pasteles personalizados requieren al menos ${days} días de anticipación ·`,
  seeAvailability: 'ver disponibilidad',
};

export default function CustomCakes() {
  const { custom } = useSettings();
  const t = useCopy({ en, es });
  const designs = t.designs;
  return (
    <>
      <Seo
        title={t.seoTitle}
        description={t.seoDescription}
        path="/custom-cakes"
      />

      <section className="custom-hero">
        <div className="container custom-hero__grid">
          <div className="custom-hero__copy">
            <nav aria-label={t.breadcrumb} className="crumbs">
              <ol>
                <li>
                  <Link to="/">{t.home}</Link>
                </li>
                <li>
                  <span aria-current="page">{t.crumb}</span>
                </li>
              </ol>
            </nav>
            <span className="eyebrow">{t.eyebrow}</span>
            <h1 className="display">{t.heading}</h1>
            <p className="lead">{t.lead}</p>
            <div className="hero__ctas">
              <a href="#builder" className="btn">
                {t.request}
              </a>
              <Link to="/availability" className="btn btn--outline">
                {t.viewAvailability}
              </Link>
            </div>
          </div>
          <div className="custom-hero__media">
            <Img src="wedding" alt={t.heroAlt} ratio="4 / 5" width={1200} sizes="(min-width: 900px) 45vw, 100vw" priority tint="#F6E7E3" />
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <ol className="process">
            {t.process.map(([n, title, d], i) => (
              <Reveal as="li" key={n} delay={i * 80}>
                <span className="process__n serif">{n}</span>
                <h2 className="process__t">{title}</h2>
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
              <span className="eyebrow">{t.designsEyebrow}</span>
              <h2 id="designs-title">{t.designsTitle}</h2>
            </div>
            <p className="muted section-head__aside">{t.designsAside}</p>
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

      <section id="builder" className="section section--sage" aria-labelledby="builder-title">
        <div className="container">
          <Reveal className="section-head section-head--center">
            <div className="section-head__text">
              <span className="eyebrow eyebrow--plain">{t.builderEyebrow}</span>
              <h2 id="builder-title">{t.builderTitle}</h2>
              <p className="muted">
                {t.builderIntro(custom.leadDays)}{' '}
                <Link to="/availability" className="link-inline">
                  {t.seeAvailability}
                </Link>
              </p>
            </div>
          </Reveal>
          <CakeBuilder />
        </div>
      </section>
    </>
  );
}
