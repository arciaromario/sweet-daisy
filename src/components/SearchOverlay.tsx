import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useCatalog } from '../context/CatalogContext';
import { categoryName, formatPrice, fromPrice } from '../data/products';
import { Icon } from './Icon';
import { Img } from './Img';
import { useScrollLock } from '../lib/scrollLock';

const suggestions = ['Strawberry', 'Chocolate', 'Mini cakes', 'Cupcakes', 'Macarons', 'Gluten-free'];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
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
    <div className={`search${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Search" inert={!open}>
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
              Search cakes and treats
            </label>
            <input
              ref={inputRef}
              id="site-search"
              type="search"
              placeholder="Search cakes, flavours, treats…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
            />
            <button type="button" className="icon-btn" aria-label="Close search" onClick={onClose}>
              <Icon name="close" />
            </button>
          </form>

          {!q && (
            <div className="search__suggest">
              <span className="eyebrow eyebrow--plain">Popular</span>
              <div className="search__chips">
                {suggestions.map((s) => (
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
                  Nothing found for “{q}”. Try another flavour, or <Link to="/custom-cakes">request a custom cake</Link>.
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
                            {categoryName(p.category)} · from {formatPrice(fromPrice(p))}
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
