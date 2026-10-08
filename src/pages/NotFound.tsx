import { Link } from 'react-router';
import { DaisyMark } from '../components/Logo';
import { Seo } from '../components/Seo';
import { useCopy } from '../i18n';

const en = {
  seoTitle: 'Page not found',
  title: 'This page has been eaten.',
  lead: 'The page you’re looking for doesn’t exist — but there’s plenty of cake elsewhere.',
  shop: 'Shop Cookies',
  home: 'Back home',
};
const es: typeof en = {
  seoTitle: 'Página no encontrada',
  title: 'Alguien se comió esta página.',
  lead: 'La página que buscas no existe, pero hay muchas cosas dulces esperándote en otro lugar.',
  shop: 'Ver la tienda',
  home: 'Volver al inicio',
};

export default function NotFound() {
  const t = useCopy({ en, es });
  return (
    <section className="notfound container">
      <Seo title={t.seoTitle} />
      <meta name="robots" content="noindex" />
      <DaisyMark className="notfound__mark" />
      <span className="eyebrow eyebrow--plain">404</span>
      <h1>{t.title}</h1>
      <p className="lead">{t.lead}</p>
      <div className="hero__ctas">
        <Link to="/shop" className="btn">
          {t.shop}
        </Link>
        <Link to="/" className="btn btn--outline">
          {t.home}
        </Link>
      </div>
    </section>
  );
}
