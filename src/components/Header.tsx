import { useEffect, useState, type CSSProperties } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { mainNav } from '../data/site';
import { useSite } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { SearchOverlay } from './SearchOverlay';
import { useScrollLock } from '../lib/scrollLock';

export function Header() {
  const { count, open } = useCart();
  const site = useSite();
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
          Free local delivery on orders over ${site.delivery.freeOver}
          {site.announcement && <span className="announce__extra"> · {site.announcement}</span>}
        </p>
      </div>

      <header className={`header${scrolled ? ' is-scrolled' : ''}${overHero ? ' is-transparent' : ''}`}>
        <div className="container header__inner">
          <button
            className="icon-btn header__burger"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" />
          </button>

          <Logo />

          <nav className="header__nav" aria-label="Main">
            <ul>
              {mainNav.slice(1).map((item) => (
                <li key={item.href}>
                  <NavLink to={item.href} className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header__actions">
            <button className="icon-btn" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <Icon name="search" />
            </button>
            <Link to="/account" className="icon-btn header__account" aria-label="Account">
              <Icon name="user" />
            </Link>
            <button className="icon-btn header__bag" aria-label={`Shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`} onClick={open}>
              <Icon name="bag" />
              {count > 0 && (
                <span className="header__count" aria-hidden="true">
                  {count}
                </span>
              )}
            </button>
            <Link to="/cookies" className="btn btn--sm header__cta">
              Order Cookies
            </Link>
          </div>
        </div>
      </header>

      <div id="mobile-menu" className={`mobile-menu${menuOpen ? ' is-open' : ''}`} aria-hidden={!menuOpen} inert={!menuOpen}>
        <div className="mobile-menu__top container">
          <Logo />
          <button className="icon-btn" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        <nav className="container mobile-menu__nav" aria-label="Mobile">
          <ul>
            {mainNav.map((item, i) => (
              <li key={item.href} style={{ '--i': i } as CSSProperties}>
                <NavLink to={item.href} end={item.href === '/'}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="container mobile-menu__foot">
          <Link to="/cookies" className="btn btn--block">
            Order Cookies
          </Link>
          <div className="mobile-menu__links">
            <Link to="/account">
              <Icon name="user" /> Account
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
