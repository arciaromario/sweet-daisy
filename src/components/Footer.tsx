import { Link } from 'react-router';
import { footerNav } from '../data/site';
import { useSite } from '../context/CatalogContext';
import { Icon } from './Icon';
import { Wordmark } from './Logo';
import { useCopy, useLang } from '../i18n';

const en = {
  explore: 'Explore',
  visit: 'Visit the studio',
  hours: 'Opening hours',
  follow: 'Follow along',
  social: 'Behind the scenes, new bakes and sweet moments.',
  rights: (year: number, city: string) => `© ${year} Sweet Daisy — Cakes and Treats. Handmade in ${city}.`,
  terms: 'Terms',
  privacy: 'Privacy',
  delivery: 'Delivery',
};
const es: typeof en = {
  explore: 'Explora',
  visit: 'Visita el estudio',
  hours: 'Horario',
  follow: 'Síguenos',
  social: 'Detrás de cámaras, nuevas recetas y momentos dulces.',
  rights: (year, city) => `© ${year} Sweet Daisy — Cakes and Treats. Hecho a mano en ${city}.`,
  terms: 'Términos',
  privacy: 'Privacidad',
  delivery: 'Entregas',
};

export function Footer() {
  const t = useCopy({ en, es });
  const lang = useLang();
  const year = new Date().getFullYear();
  const site = useSite();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__brand">
          <Wordmark className="wordmark--footer" />
        </div>

        <div className="footer__grid">
          <div className="footer__col">
            <h2 className="footer__title">{t.explore}</h2>
            <ul>
              {footerNav.map((l) => (
                <li key={l.href}>
                  <Link to={l.href}>{lang === 'es' ? l.es : l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__col">
            <h2 className="footer__title">{t.visit}</h2>
            <address>
              {site.address.street}
              <br />
              {site.address.city}, {site.address.region} {site.address.postal}
            </address>
            <p>
              <a href={site.phoneHref}>{site.phone}</a>
              <br />
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </p>
          </div>

          <div className="footer__col">
            <h2 className="footer__title">{t.hours}</h2>
            <dl className="footer__hours">
              {site.hours.map((h) => (
                <div key={h.days}>
                  <dt>{h.days}</dt>
                  <dd>{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="footer__col">
            <h2 className="footer__title">{t.follow}</h2>
            <p className="footer__social-text">{t.social}</p>
            <ul className="footer__social">
              <li>
                <a href={site.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <Icon name="instagram" />
                </a>
              </li>
              <li>
                <a href={site.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                  <Icon name="facebook" />
                </a>
              </li>
              <li>
                <a href={site.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">
                  <Icon name="tiktok" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p>{t.rights(year, site.address.city)}</p>
          <p className="footer__legal">
            <Link to="/terms">{t.terms}</Link>
            <Link to="/privacy">{t.privacy}</Link>
            <Link to="/shipping-delivery">{t.delivery}</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
