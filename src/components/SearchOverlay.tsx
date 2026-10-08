import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useCatalog } from '../context/CatalogContext';
import { categoryName, formatPrice, fromPrice } from '../data/products';
import { useCopy } from '../i18n';
import { Icon } from './Icon';
import { Img } from './Img';
import { useScrollLock } from '../lib/scrollLock';

const en = {
  suggestions: ['Strawberry', 'Chocolate', 'Mini cakes', 'Cupcakes', 'Macarons', 'Gluten-free'],
  search: 'Search',
  searchLabel: 'Search cakes and treats',
  placeholder: 'Search cakes, flavours, treats…',
  close: 'Close search',
  popular: 'Popular',
  nothingFound: (q: string, link: (text: string) => ReactNode): ReactNode => (
    <>
      Nothing found for “{q}”. Try another flavour, or {link('request a custom cake')}.
    </>
  ),
  from: (price: string) => `from ${price}`,
};
const es: typeof en = {
  suggestions: ['Fresa', 'Chocolate', 'Mini pasteles', 'Cupcakes', 'Macarons', 'Sin gluten'],
  search: 'Buscar',
  searchLabel: 'Buscar pasteles y dulces',
  placeholder: 'Busca pasteles, sabores, dulces…',
  close: 'Cerrar búsqueda',
  popular: 'Populares',
  nothingFound: (q, link) => (
    <>
      No encontramos nada para “{q}”. Prueba otro sabor o {link('pide un pastel personalizado')}.
    </>
  ),
  from: (price) => `desde ${price}`,
};

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useCopy({ en, es });
  const { products } = useCatalog();
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const results = useMemo(() => searchProducts(products, q).slice(0, 6), [products, q]);

  return (
    <div className={`search${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label={t.search} inert={!open}>
      <div className="search__backdrop" onClick={onClose} />
      <div className="search__panel">
        <div className="container">
          <form
            className="search__form"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <Icon name="search" />
            <label htmlFor="site-search" className="visually-hidden">
              {t.searchLabel}
            </label>
            <input
              ref={inputRef}
              id="site-search"
              type="search"
              placeholder={t.placeholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
            />
            <button type="button" className="icon-btn" aria-label={t.close} onClick={onClose}>
              <Icon name="close" />
            </button>
          </form>

          {!q && (
            <div className="search__suggest">
              <span className="eyebrow eyebrow--plain">{t.popular}</span>
              <div className="search__chips">
                {t.suggestions.map((s) => (
                  <button key={s} className="chip" onClick={() => setQ(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {q && (
            <div className="search__results" aria-live="polite">
              {results.length === 0 ? (
                <p className="muted">
                  {t.nothingFound(q, (text) => <Link to="/custom-cakes">{text}</Link>)}
                </p>
              ) : (
                <ul>
                  {results.map((p) => (
                    <li key={p.slug}>
                      <Link to={`/products/${p.slug}`} className="search__item">
                        <Img src={p.images[0]} alt="" ratio="1 / 1" width={160} sizes="72px" tint={p.tint} />
                        <span>
                          <span className="search__name">{p.name}</span>
                          <span className="muted small">
                            {categoryName(p.category)} · {t.from(formatPrice(fromPrice(p)))}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function searchProducts<T extends { name: string; short: string; description: string; category: string; flavors?: { label: string }[] }>(
  list: T[],
  query: string,
): T[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return list;
  return list.filter((p) => {
    const hay = [p.name, p.short, p.description, p.category.replace('-', ' '), ...(p.flavors?.map((f) => f.label) ?? [])].join(' ').toLowerCase();
    return terms.every((t) => hay.includes(t.replace(/s$/, '')));
  });
}
