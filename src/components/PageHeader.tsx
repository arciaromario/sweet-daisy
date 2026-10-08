import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useLang } from '../i18n';

export function PageHeader({
  eyebrow,
  title,
  intro,
  crumbs,
  children,
  align = 'left',
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  crumbs?: { label: string; href?: string }[];
  children?: ReactNode;
  align?: 'left' | 'center';
}) {
  const lang = useLang();
  return (
    <header className={`page-header page-header--${align}`}>
      <div className="container">
        {crumbs && (
          <nav aria-label="Breadcrumb" className="crumbs">
            <ol>
              <li>
                <Link to="/">{lang === 'es' ? 'Inicio' : 'Home'}</Link>
              </li>
              {crumbs.map((c) => (
                <li key={c.label}>{c.href ? <Link to={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {intro && <p className="lead page-header__intro">{intro}</p>}
        {children}
      </div>
    </header>
  );
}
