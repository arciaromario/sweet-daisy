import { useEffect, useState, type CSSProperties } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { mainNav } from '../data/site';
import { useSite } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { SearchOverlay } from './SearchOverlay';
import { useScrollLock } from '../lib/scrollLock';
import { useCopy, useLang } from '../i18n';
import { LanguageSwitch } from './LanguageSwitch';

const en = {
  freeDelivery: (amount: number) => `Free local delivery on orders over $${amount}`,
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  main: 'Main',
  mobile: 'Mobile',
  search: 'Search',
  account: 'Account',
  bag: (n: number) => `Shopping bag, ${n} ${n === 1 ? 'item' : 'items'}`,
  order: 'Order Cookies',
};
const es: typeof en = {
  freeDelivery: (amount) => `Entrega local gratis en pedidos de más de $${amount}`,
  openMenu: 'Abrir menú',
  closeMenu: 'Cerrar menú',
  main: 'Principal',
  mobile: 'Móvil',
  search: 'Buscar',
  account: 'Cuenta',
  bag: (n) => `Bolsa de compras, ${n} ${n === 1 ? 'producto' : 'productos'}`,
  order: 'Pedir galletas',
};

export function Header() {
  const { count, open } = useCart();
  const site = useSite();
  const t = useCopy({ en, es });
  const lang = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { pathname } = useLocation();
  const overHero = pathname === '/' && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useScrollLock(menuOpen);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <>
      <div className="announce">
        <p>
          {t.freeDelivery(site.delivery.freeOver)}
          {site.announcement && <span className="announce__extra"> · {site.announcement}</span>}
        </p>
      </div>

      <header className={`header${scrolled ? ' is-scrolled' : ''}${overHero ? ' is-transparent' : ''}`}>
        <div className="container header__inner">
          <button
            className="icon-btn header__burger"
            aria-label={t.openMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" />
          </button>

          <Logo />

          <nav className="header__nav" aria-label={t.main}>
            <ul>
              {mainNav.slice(1).map((item) => (
                <li key={item.href}>
                  <NavLink to={item.href} className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
                    {lang === 'es' ? item.es : item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header__actions">
            <LanguageSwitch className="header__lang" />
            <button className="icon-btn" aria-label={t.search} onClick={() => setSearchOpen(true)}>
              <Icon name="search" />
            </button>
            <Link to="/account" className="icon-btn header__account" aria-label={t.account}>
              <Icon name="user" />
            </Link>
            <button className="icon-btn header__bag" aria-label={t.bag(count)} onClick={open}>
              <Icon name="bag" />
              {count > 0 && (
                <span className="header__count" aria-hidden="true">
                  {count}
                </span>
              )}
            </button>
            <Link to="/cookies" className="btn btn--sm header__cta">
              {t.order}
            </Link>
          </div>
        </div>
      </header>

      <div id="mobile-menu" className={`mobile-menu${menuOpen ? ' is-open' : ''}`} aria-hidden={!menuOpen} inert={!menuOpen}>
        <div className="mobile-menu__top container">
          <Logo />
          <button className="icon-btn" aria-label={t.closeMenu} onClick={() => setMenuOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        <nav className="container mobile-menu__nav" aria-label={t.mobile}>
          <ul>
            {mainNav.map((item, i) => (
              <li key={item.href} style={{ '--i': i } as CSSProperties}>
                <NavLink to={item.href} end={item.href === '/'}>
                  {lang === 'es' ? item.es : item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="container mobile-menu__foot">
          <Link to="/cookies" className="btn btn--block">
            {t.order}
          </Link>
          <LanguageSwitch className="mobile-menu__lang" />
          <div className="mobile-menu__links">
            <Link to="/account">
              <Icon name="user" /> {t.account}
            </Link>
            <a href={site.instagram} target="_blank" rel="noreferrer">
              <Icon name="instagram" /> {site.handle}
            </a>
          </div>
        </div>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
