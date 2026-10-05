import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { ProductCard } from '../components/ProductCard';
import { QuickView } from '../components/QuickView';
import { searchProducts } from '../components/SearchOverlay';
import { Seo } from '../components/Seo';
import { useCatalog } from '../context/CatalogContext';
import { formatPrice, fromPrice, type CategoryId, type Product } from '../data/products';

type Scope = 'all' | 'cakes' | 'treats';

const scopes: Record<Scope, { title: string; eyebrow: string; intro: string; categories?: CategoryId[]; path: string }> = {
  all: {
    title: 'The Shop',
    eyebrow: 'Cakes & treats',
    intro: 'Celebration cakes, mini cakes, cupcakes and treats — baked to order and finished by hand.',
    path: '/shop',
  },
  cakes: {
    title: 'Cakes',
    eyebrow: 'Celebration & mini cakes',
    intro: 'Layered, textured and finished by hand. Choose your size, flavour and finishing touches.',
    categories: ['cakes', 'mini-cakes', 'seasonal'],
    path: '/cakes',
  },
  treats: {
    title: 'Treats',
    eyebrow: 'Cupcakes, macarons & dessert boxes',
    intro: 'Little luxuries for gifting, sharing and keeping all to yourself.',
    categories: ['cupcakes', 'treats', 'seasonal'],
    path: '/treats',
  },
};

const sorts = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name: A–Z' },
];

export default function Shop({ scope = 'all' }: { scope?: Scope }) {
  const { products, categories } = useCatalog();
  const [params, setParams] = useSearchParams();
  const [quick, setQuick] = useState<Product | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const closeQuick = useCallback(() => setQuick(null), []);
  const conf = scopes[scope];

  const scoped = conf.categories ? products.filter((p) => conf.categories!.includes(p.category)) : products;
  const visibleCategories = categories.filter((c) => !conf.categories || conf.categories.includes(c.id));
  const ceiling = Math.ceil(Math.max(...scoped.map(fromPrice), 0) / 10) * 10;

  const category = params.get('category') ?? 'all';
  const q = params.get('q') ?? '';
  const sort = params.get('sort') ?? 'featured';
  const maxPrice = Number(params.get('max')) || ceiling;

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === '' || value === 'all' || (key === 'sort' && value === 'featured')) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true, preventScrollReset: true });
  };

  const results = useMemo(() => {
    let list = searchProducts(scoped, q);
    if (category !== 'all') list = list.filter((p) => p.category === category);
    list = list.filter((p) => fromPrice(p) <= maxPrice);
    if (sort === 'price-asc') list = [...list].sort((a, b) => fromPrice(a) - fromPrice(b));
    if (sort === 'price-desc') list = [...list].sort((a, b) => fromPrice(b) - fromPrice(a));
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [scoped, q, category, maxPrice, sort]);

  const activeFilters = (category !== 'all' ? 1 : 0) + (q ? 1 : 0) + (maxPrice < ceiling ? 1 : 0);

  return (
    <>
      <Seo title={conf.title} description={conf.intro} path={conf.path} />
      <PageHeader eyebrow={conf.eyebrow} title={conf.title} intro={conf.intro} crumbs={[{ label: conf.title }]} />

      <section className="shop container">
        <div className="shop__toolbar">
          <div className="shop__cats" role="group" aria-label="Filter by category">
            <button className="chip" aria-pressed={category === 'all'} onClick={() => update('category', 'all')}>
              All <span className="chip__count">{scoped.length}</span>
            </button>
            {visibleCategories.map((c) => (
              <button key={c.id} className="chip" aria-pressed={category === c.id} onClick={() => update('category', c.id)}>
                {c.name} <span className="chip__count">{scoped.filter((p) => p.category === c.id).length}</span>
              </button>
            ))}
          </div>

          <div className="shop__controls">
            <button className="btn btn--outline btn--sm shop__filter-toggle" aria-expanded={filtersOpen} aria-controls="shop-filters" onClick={() => setFiltersOpen((o) => !o)}>
              <Icon name="filter" /> Filters{activeFilters > 0 && ` (${activeFilters})`}
            </button>
            <label className="shop__sort">
              <span className="visually-hidden">Sort by</span>
              <select className="select" value={sort} onChange={(e) => update('sort', e.target.value)}>
                {sorts.map((s) => (
                  <option key={s.value} value={s.value}>
                    Sort: {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="shop__layout">
          <aside id="shop-filters" className={`shop__filters${filtersOpen ? ' is-open' : ''}`} aria-label="Filters">
            <div className="field">
              <label className="field__label" htmlFor="shop-search">
                Search
              </label>
              <div className="input-icon">
                <Icon name="search" />
                <input id="shop-search" className="input" type="search" placeholder="Flavour, cake, treat…" value={q} onChange={(e) => update('q', e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="shop-price">
                Price
              </label>
              <input
                id="shop-price"
                type="range"
                className="range"
                min={10}
                max={ceiling}
                step={5}
                value={maxPrice}
                onChange={(e) => update('max', Number(e.target.value) >= ceiling ? null : e.target.value)}
                aria-valuetext={`Up to ${formatPrice(maxPrice)}`}
              />
              <div className="range__labels">
                <span>{formatPrice(10)}</span>
                <span>Up to {formatPrice(maxPrice)}</span>
              </div>
            </div>

            <div className="shop__help">
              <p className="serif shop__help-title">Dreaming of something else?</p>
              <p className="small muted">We design one-of-a-kind cakes for birthdays, weddings and every celebration in between.</p>
              <Link to="/custom-cakes" className="link">
                Request a custom cake <Icon name="arrow" />
              </Link>
            </div>

            {activeFilters > 0 && (
              <button className="link shop__clear" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                Clear all filters
              </button>
            )}
          </aside>

          <div className="shop__results">
            <p className="shop__count muted small" aria-live="polite">
              {results.length} {results.length === 1 ? 'product' : 'products'}
            </p>
            {results.length > 0 ? (
              <div className="product-grid product-grid--shop">
                {results.map((p, i) => (
                  <ProductCard key={p.slug} product={p} onQuickView={setQuick} priority={i < 3} />
                ))}
              </div>
            ) : (
              <div className="empty">
                <p className="serif empty__title">Nothing sweet matches those filters.</p>
                <p className="muted">Try a different flavour or clear your filters.</p>
                <button className="btn btn--outline" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <QuickView product={quick} onClose={closeQuick} />
    </>
  );
}
