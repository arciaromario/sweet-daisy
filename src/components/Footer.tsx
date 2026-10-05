import { Link } from 'react-router';
import { footerNav } from '../data/site';
import { useSite } from '../context/CatalogContext';
import { Icon } from './Icon';
import { DaisyMark } from './Logo';

export function Footer() {
  const year = new Date().getFullYear();
  const site = useSite();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__brand">
          <DaisyMark className="footer__mark" />
          <p className="footer__name">Sweet Daisy</p>
          <p className="footer__desc">Cakes and Treats</p>
        </div>

        <div className="footer__grid">
          <div className="footer__col">
            <h2 className="footer__title">Explore</h2>
            <ul>
              {footerNav.map((l) => (
                <li key={l.href}>
                  <Link to={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__col">
            <h2 className="footer__title">Visit the studio</h2>
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
            <h2 className="footer__title">Opening hours</h2>
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
            <h2 className="footer__title">Follow along</h2>
            <p className="footer__social-text">Behind the scenes, new bakes and sweet moments.</p>
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
          <p>© {year} Sweet Daisy — Cakes and Treats. Handmade in {site.address.city}.</p>
          <p className="footer__legal">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/shipping-delivery">Delivery</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
