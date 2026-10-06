import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Icon } from '../components/Icon';
import { Img } from '../components/Img';
import { OptionGroup } from '../components/OptionGroup';
import { ProductCard, toCartItem } from '../components/ProductCard';
import { QuantityStepper } from '../components/QuantityStepper';
import { Reveal } from '../components/Reveal';
import { Seo } from '../components/Seo';
import { useCart } from '../context/CartContext';
import { useCatalog, useSite } from '../context/CatalogContext';
import { img } from '../data/images';
import { categoryName, formatPrep, formatPrice, relatedProducts } from '../data/products';
import { firstAvailable, formatDate } from '../lib/availability';
import NotFound from './NotFound';

const MESSAGE_MAX = 40;

export default function ProductPage() {
  const { slug = '' } = useParams();
  const { getProduct, products, overrides, settings, ready } = useCatalog();
  const site = useSite();
  const { add } = useCart();
  const product = getProduct(slug);

  const [active, setActive] = useState(0);
  const [sizeId, setSizeId] = useState('');
  const [flavor, setFlavor] = useState('');
  const [decorationId, setDecorationId] = useState('');
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!product) return;
    setActive(0);
    setSizeId(product.sizes[0].id);
    setFlavor(product.flavors?.[0]?.label ?? '');
    setDecorationId(product.decorations?.[0]?.id ?? '');
    setMessage('');
    setNotes('');
    setQty(1);
  }, [product]);

  if (!product) return ready ? <NotFound /> : <div className="page-loading" aria-busy="true" />;

  const item = toCartItem(product, { sizeId, flavor, decorationId, message, notes, quantity: qty });
  const size = product.sizes.find((s) => s.id === item.sizeId)!;
  const earliest = firstAvailable(overrides, product.leadDays, settings.store.closedWeekdays);
  const related = relatedProducts(product, products);

  const onAdd = () => {
    add(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 2400);
  };

  return (
    <>
      <Seo
        title={product.name}
        description={`${product.short} ${product.description}`.slice(0, 158)}
        path={`/products/${product.slug}`}
        image={img(product.images[0], 1200, 1200)}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.description,
          image: product.images.map((i) => img(i, 1200)),
          brand: { '@type': 'Brand', name: 'Sweet Daisy' },
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'USD',
            lowPrice: Math.min(...product.sizes.map((s) => s.price)),
            highPrice: Math.max(...product.sizes.map((s) => s.price)),
            availability: 'https://schema.org/InStock',
          },
        }}
      />

      <div className="container pdp">
        <nav aria-label="Breadcrumb" className="crumbs pdp__crumbs">
          <ol>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to={`/shop?category=${product.category}`}>{categoryName(product.category)}</Link>
            </li>
            <li>
              <span aria-current="page">{product.name}</span>
            </li>
          </ol>
        </nav>

        <div className="pdp__grid">
          {/* Gallery */}
          <div className="pdp__gallery">
            <div className="pdp__thumbs" role="tablist" aria-label="Product images">
              {product.images.map((im, i) => (
                <button
                  key={im + i}
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Image ${i + 1} of ${product.images.length}`}
                  className={`pdp__thumb${i === active ? ' is-active' : ''}`}
                  onClick={() => setActive(i)}
                >
                  <Img src={im} alt="" ratio="4 / 5" width={200} sizes="90px" tint={product.tint} />
                </button>
              ))}
            </div>
            <div className="pdp__main">
              {product.images.map((im, i) => (
                <div key={im + i} className={`pdp__slide${i === active ? ' is-active' : ''}`} aria-hidden={i !== active}>
                  <Img
                    src={im}
                    alt={i === 0 ? product.name : `${product.name} — detail ${i + 1}`}
                    ratio="4 / 5"
                    width={1400}
                    sizes="(min-width: 1000px) 55vw, 100vw"
                    tint={product.tint}
                    priority={i === 0}
                  />
                </div>
              ))}
              {product.badge && <span className="badge pdp__badge">{product.badge}</span>}
              <div className="pdp__dots" aria-hidden="true">
                {product.images.map((_, i) => (
                  <span key={i} className={i === active ? 'is-active' : ''} />
                ))}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="pdp__info">
            <span className="eyebrow">{categoryName(product.category)}</span>
            <h1 className="pdp__title">{product.name}</h1>
            <p className="pdp__price price">
              {formatPrice(item.unitPrice)}
              <span className="muted small"> · {size.servings}</span>
            </p>
            <p className="pdp__lead">{product.description}</p>

            <div className="pdp__availability">
              {formatPrep(product.prepHours) && (
                <p>
                  <Icon name="clock" />
                  <span>
                    <strong>Average preparation time: {formatPrep(product.prepHours)}</strong>
                    <span className="muted"> · Each order is made fresh by hand.</span>
                  </span>
                </p>
              )}
              <p>
                <Icon name="calendar" />
                <span>
                  <strong>Available from {formatDate(earliest, { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
                  <span className="muted">
                    {product.leadDays === 0
                      ? ' · Baked fresh daily, ready same day.'
                      : ` · Needs ${product.leadDays} ${product.leadDays === 1 ? 'day' : 'days'} notice. Choose your date at checkout.`}
                  </span>
                </span>
              </p>
            </div>

            <div className="pdp__form">
              <OptionGroup
                name="size"
                legend="Size"
                hint="Servings are approximate"
                value={sizeId}
                onChange={setSizeId}
                min={130}
                choices={product.sizes.map((s) => ({ value: s.id, title: s.label, meta: s.servings, price: s.price, priceMode: 'absolute' }))}
              />

              {product.flavors && (
                <OptionGroup
                  name="flavor"
                  legend="Flavour"
                  value={flavor}
                  onChange={setFlavor}
                  min={180}
                  choices={product.flavors.map((f) => ({ value: f.label, title: f.label, price: f.price }))}
                />
              )}

              {product.decorations && (
                <OptionGroup
                  name="decoration"
                  legend="Decoration"
                  value={decorationId}
                  onChange={setDecorationId}
                  min={200}
                  choices={product.decorations.map((d) => ({ value: d.id!, title: d.label, price: d.price }))}
                />
              )}

              {product.message && (
                <div className="field">
                  <label className="field__label" htmlFor="pdp-message">
                    Custom message <span className="opt-group__hint">Optional · piped or on a plaque</span>
                  </label>
                  <input
                    id="pdp-message"
                    className="input"
                    maxLength={MESSAGE_MAX}
                    placeholder="e.g. Happy 30th, Sophie"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    aria-describedby="pdp-message-count"
                  />
                  <span id="pdp-message-count" className="field__hint">
                    {message.length}/{MESSAGE_MAX} characters
                  </span>
                </div>
              )}

              <details className="pdp__notes">
                <summary>Add order notes</summary>
                <label htmlFor="pdp-notes" className="visually-hidden">
                  Order notes
                </label>
                <textarea
                  id="pdp-notes"
                  className="textarea"
                  maxLength={500}
                  placeholder="Allergies, colour preferences, candles…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </details>

              <div className="pdp__buy">
                <QuantityStepper value={qty} onChange={setQty} />
                <button className="btn pdp__add" onClick={onAdd}>
                  {added ? (
                    <>
                      <Icon name="check" /> Added to bag
                    </>
                  ) : (
                    <>Add to Cart · {formatPrice(item.unitPrice * qty)}</>
                  )}
                </button>
              </div>

              <ul className="pdp__perks">
                <li>
                  <Icon name="store" /> Free pickup from our {site.address.city} studio
                </li>
                <li>
                  <Icon name="truck" /> Local delivery {site.delivery.radius} — free over {formatPrice(site.delivery.freeOver)}
                </li>
                <li>
                  <Icon name="gift" /> Presented in our signature keepsake box
                </li>
              </ul>
            </div>

            <div className="accordion">
              {product.details.map((d, i) => (
                <details key={d.label} open={i === 0}>
                  <summary>
                    {d.label}
                    <Icon name="plus" />
                  </summary>
                  <p>{d.value}</p>
                </details>
              ))}
              <details>
                <summary>
                  Pickup & delivery
                  <Icon name="plus" />
                </summary>
                <p>
                  Collect from {site.address.street} at your chosen time, or choose local delivery {site.delivery.radius}.{' '}
                  <Link to="/shipping-delivery">Read our delivery guide</Link>.
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section section--cream" aria-labelledby="related-title">
          <div className="container">
            <Reveal className="section-head">
              <div className="section-head__text">
                <span className="eyebrow">More to love</span>
                <h2 id="related-title">You might also like</h2>
              </div>
            </Reveal>
            <div className="product-grid product-grid--four product-grid--rail">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="pdp-sticky" aria-hidden="true">
        <div>
          <span className="pdp-sticky__name">{product.name}</span>
          <span className="price">{formatPrice(item.unitPrice * qty)}</span>
        </div>
        <button className="btn btn--sm" tabIndex={-1} onClick={onAdd}>
          {added ? 'Added' : 'Add to Cart'}
        </button>
      </div>
    </>
  );
}
