import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { BoxBuilder, boxTotal, describeBox, fitBox, type BoxFill } from '../components/BoxBuilder';
import { Icon } from '../components/Icon';
import { Img } from '../components/Img';
import { OptionGroup } from '../components/OptionGroup';
import { ProductCard, toCartItem } from '../components/ProductCard';
import { QuantityStepper } from '../components/QuantityStepper';
import { Reveal } from '../components/Reveal';
import { ReviewCard } from '../components/ReviewCard';
import { Stars } from '../components/Stars';
import { Seo } from '../components/Seo';
import { useCart } from '../context/CartContext';
import { useCatalog, useSite } from '../context/CatalogContext';
import { img } from '../data/images';
import { categoryName, formatPrep, formatPrice, MIX_BOX_SLUG, packCount, relatedProducts } from '../data/products';
import { ratingSummary, useReviews } from '../hooks/useReviews';
import { useCopy } from '../i18n';
import { firstAvailable, formatDate } from '../lib/availability';
import NotFound from './NotFound';

const MESSAGE_MAX = 40;

const en = {
  breadcrumb: 'Breadcrumb',
  home: 'Home',
  productImages: 'Product images',
  imageOf: (i: number, n: number) => `Image ${i} of ${n}`,
  detailAlt: (name: string, i: number) => `${name} — detail ${i}`,
  avgPrep: (time: string) => `Average preparation time: ${time}`,
  madeFresh: ' · Each order is made fresh by hand.',
  availableFrom: (date: string) => `Available from ${date}`,
  sameDay: ' · Baked fresh daily, ready same day.',
  notice: (n: number) => ` · Needs ${n} ${n === 1 ? 'day' : 'days'} notice. Choose your date at checkout.`,
  size: 'Size',
  servingsHint: 'Servings are approximate',
  flavour: 'Flavour',
  decoration: 'Decoration',
  customMessage: 'Custom message',
  messageHint: 'Optional · piped or on a plaque',
  messagePlaceholder: 'e.g. Happy 30th, Sophie',
  characters: (n: number, max: number) => `${n}/${max} characters`,
  addNotes: 'Add order notes',
  orderNotes: 'Order notes',
  notesPlaceholder: 'Allergies, colour preferences, candles…',
  chooseMore: (n: number) => `Choose ${n} more ${n === 1 ? 'cookie' : 'cookies'}`,
  addedToBag: 'Added to bag',
  addToCart: 'Add to Cart',
  addToCartPrice: (price: string) => `Add to Cart · ${price}`,
  freePickup: (city: string) => `Free pickup from our ${city} studio`,
  localDelivery: (radius: string, price: string) => `Local delivery ${radius} — free over ${price}`,
  keepsakeBox: 'Presented in our signature keepsake box',
  pickupDelivery: 'Pickup & delivery',
  pickupText: (street: string, radius: string, link: (text: string) => ReactNode): ReactNode => (
    <>
      Collect from {street} at your chosen time, or choose local delivery {radius}. {link('Read our delivery guide')}.
    </>
  ),
  moreToLove: 'More to love',
  youMightLike: 'You might also like',
  reviewCount: (n: number) => `${n} ${n === 1 ? 'review' : 'reviews'}`,
  reviewsEyebrow: 'Reviews',
  reviewsTitle: 'What customers say',
  allReviews: 'All reviews',
  writeReview: 'Leave a review',
  chooseMoreShort: (n: number) => `Choose ${n} more`,
  added: 'Added',
};
const es: typeof en = {
  breadcrumb: 'Ruta de navegación',
  home: 'Inicio',
  productImages: 'Imágenes del producto',
  imageOf: (i, n) => `Imagen ${i} de ${n}`,
  detailAlt: (name, i) => `${name} — detalle ${i}`,
  avgPrep: (time) => `Tiempo promedio de preparación: ${time}`,
  madeFresh: ' · Cada pedido se hace a mano y al momento.',
  availableFrom: (date) => `Disponible desde el ${date}`,
  sameDay: ' · Horneado fresco cada día, listo el mismo día.',
  notice: (n) => ` · Requiere ${n} ${n === 1 ? 'día' : 'días'} de anticipación. Elige tu fecha al finalizar la compra.`,
  size: 'Tamaño',
  servingsHint: 'Las porciones son aproximadas',
  flavour: 'Sabor',
  decoration: 'Decoración',
  customMessage: 'Mensaje personalizado',
  messageHint: 'Opcional · escrito con manga o en una placa',
  messagePlaceholder: 'p. ej. Feliz 30, Sophie',
  characters: (n, max) => `${n}/${max} caracteres`,
  addNotes: 'Agregar notas al pedido',
  orderNotes: 'Notas del pedido',
  notesPlaceholder: 'Alergias, colores preferidos, velas…',
  chooseMore: (n) => `Elige ${n} ${n === 1 ? 'galleta' : 'galletas'} más`,
  addedToBag: 'Añadido a la bolsa',
  addToCart: 'Añadir a la bolsa',
  addToCartPrice: (price) => `Añadir a la bolsa · ${price}`,
  freePickup: (city) => `Recogida gratis en nuestro estudio de ${city}`,
  localDelivery: (radius, price) => `Entrega a domicilio local ${radius}: gratis en pedidos de más de ${price}`,
  keepsakeBox: 'Presentado en nuestra caja de recuerdo exclusiva',
  pickupDelivery: 'Recogida y entrega a domicilio',
  pickupText: (street, radius, link) => (
    <>
      Recoge tu pedido en {street} a la hora que elijas, o elige entrega a domicilio local {radius}. {link('Lee nuestra guía de entregas')}.
    </>
  ),
  moreToLove: 'Más para enamorarte',
  youMightLike: 'También te puede gustar',
  reviewCount: (n) => `${n} ${n === 1 ? 'opinión' : 'opiniones'}`,
  reviewsEyebrow: 'Opiniones',
  reviewsTitle: 'Lo que dicen nuestros clientes',
  allReviews: 'Todas las opiniones',
  writeReview: 'Deja tu opinión',
  chooseMoreShort: (n) => `Elige ${n} más`,
  added: 'Añadido',
};

export default function ProductPage() {
  const t = useCopy({ en, es });
  const { slug = '' } = useParams();
  const { getProduct, products, overrides, settings, ready } = useCatalog();
  const site = useSite();
  const { add } = useCart();
  const product = getProduct(slug);
  const productReviews = (useReviews() ?? []).filter((r) => r.products.includes(slug));
  const rating = ratingSummary(productReviews);

  const [active, setActive] = useState(0);
  const [sizeId, setSizeId] = useState('');
  const [flavor, setFlavor] = useState('');
  const [decorationId, setDecorationId] = useState('');
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [fill, setFill] = useState<BoxFill>({});

  useEffect(() => {
    if (!product) return;
    setActive(0);
    setSizeId(product.sizes[0].id);
    setFlavor(product.flavors?.[0]?.label ?? '');
    setDecorationId(product.decorations?.[0]?.id ?? '');
    setMessage('');
    setNotes('');
    setQty(1);
    setFill({});
  }, [product]);

  if (!product) return ready ? <NotFound /> : <div className="page-loading" aria-busy="true" />;

  const isMix = product.slug === MIX_BOX_SLUG;
  // The box offers every cookie on the menu, so new flavours added in /admin appear automatically.
  const mixFlavors = isMix
    ? products.filter((p) => p.category === product.category && p.slug !== product.slug).map((p) => p.name)
    : [];
  const size = product.sizes.find((s) => s.id === sizeId) ?? product.sizes[0];
  const capacity = packCount(size.label);
  const boxLeft = isMix ? capacity - boxTotal(fill) : 0;
  const item = toCartItem(product, { sizeId, flavor, mix: isMix ? describeBox(fill) : undefined, decorationId, message, notes, quantity: qty });
  const earliest = firstAvailable(overrides, product.leadDays, settings.store.closedWeekdays);
  const related = relatedProducts(product, products);

  const onAdd = () => {
    if (boxLeft > 0) {
      document.querySelector('.boxb')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
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
        <nav aria-label={t.breadcrumb} className="crumbs pdp__crumbs">
          <ol>
            <li>
              <Link to="/">{t.home}</Link>
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
            <div className="pdp__thumbs" role="tablist" aria-label={t.productImages}>
              {product.images.map((im, i) => (
                <button
                  key={im + i}
                  role="tab"
                  aria-selected={i === active}
                  aria-label={t.imageOf(i + 1, product.images.length)}
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
                    alt={i === 0 ? product.name : t.detailAlt(product.name, i + 1)}
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
            {rating.count > 0 && (
              <a href="#product-reviews" className="pdp__rating">
                <Stars value={rating.average} /> <span className="small">{rating.average.toFixed(1)} · {t.reviewCount(rating.count)}</span>
              </a>
            )}
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
                    <strong>{t.avgPrep(formatPrep(product.prepHours)!)}</strong>
                    <span className="muted">{t.madeFresh}</span>
                  </span>
                </p>
              )}
              <p>
                <Icon name="calendar" />
                <span>
                  <strong>{t.availableFrom(formatDate(earliest, { weekday: 'short', month: 'short', day: 'numeric' }))}</strong>
                  <span className="muted">
                    {product.leadDays === 0 ? t.sameDay : t.notice(product.leadDays)}
                  </span>
                </span>
              </p>
            </div>

            <div className="pdp__form">
              <OptionGroup
                name="size"
                legend={t.size}
                hint={t.servingsHint}
                value={sizeId}
                onChange={(id) => {
                  setSizeId(id);
                  // Keep a mixed box within the new pack size.
                  const next = product.sizes.find((s) => s.id === id);
                  if (isMix && next) setFill((f) => fitBox(f, packCount(next.label)));
                }}
                min={130}
                choices={product.sizes.map((s) => ({ value: s.id, title: s.label, meta: s.servings, price: s.price, priceMode: 'absolute' }))}
              />

              {isMix && (
                <BoxBuilder
                  flavors={mixFlavors.length ? mixFlavors : (product.flavors ?? []).map((f) => f.label)}
                  capacity={capacity}
                  fill={fill}
                  onChange={setFill}
                />
              )}

              {product.flavors && !isMix && (
                <OptionGroup
                  name="flavor"
                  legend={t.flavour}
                  value={flavor}
                  onChange={setFlavor}
                  min={180}
                  choices={product.flavors.map((f) => ({ value: f.label, title: f.label, price: f.price }))}
                />
              )}

              {product.decorations && (
                <OptionGroup
                  name="decoration"
                  legend={t.decoration}
                  value={decorationId}
                  onChange={setDecorationId}
                  min={200}
                  choices={product.decorations.map((d) => ({ value: d.id!, title: d.label, price: d.price }))}
                />
              )}

              {product.message && (
                <div className="field">
                  <label className="field__label" htmlFor="pdp-message">
                    {t.customMessage} <span className="opt-group__hint">{t.messageHint}</span>
                  </label>
                  <input
                    id="pdp-message"
                    className="input"
                    maxLength={MESSAGE_MAX}
                    placeholder={t.messagePlaceholder}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    aria-describedby="pdp-message-count"
                  />
                  <span id="pdp-message-count" className="field__hint">
                    {t.characters(message.length, MESSAGE_MAX)}
                  </span>
                </div>
              )}

              <details className="pdp__notes">
                <summary>{t.addNotes}</summary>
                <label htmlFor="pdp-notes" className="visually-hidden">
                  {t.orderNotes}
                </label>
                <textarea
                  id="pdp-notes"
                  className="textarea"
                  maxLength={500}
                  placeholder={t.notesPlaceholder}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </details>

              <div className="pdp__buy">
                <QuantityStepper value={qty} onChange={setQty} />
                <button className="btn pdp__add" onClick={onAdd} aria-disabled={boxLeft > 0}>
                  {boxLeft > 0 ? (
                    <>{t.chooseMore(boxLeft)}</>
                  ) : added ? (
                    <>
                      <Icon name="check" /> {t.addedToBag}
                    </>
                  ) : (
                    <>{t.addToCartPrice(formatPrice(item.unitPrice * qty))}</>
                  )}
                </button>
              </div>

              <ul className="pdp__perks">
                <li>
                  <Icon name="store" /> {t.freePickup(site.address.city)}
                </li>
                <li>
                  <Icon name="truck" /> {t.localDelivery(site.delivery.radius, formatPrice(site.delivery.freeOver))}
                </li>
                <li>
                  <Icon name="gift" /> {t.keepsakeBox}
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
                  {t.pickupDelivery}
                  <Icon name="plus" />
                </summary>
                <p>
                  {t.pickupText(site.address.street, site.delivery.radius, (text) => <Link to="/shipping-delivery">{text}</Link>)}
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>

      {productReviews.length > 0 && (
        <section id="product-reviews" className="section section--sage testimonials" aria-labelledby="product-reviews-title">
          <div className="container">
            <Reveal className="section-head">
              <div className="section-head__text">
                <span className="eyebrow">{t.reviewsEyebrow}</span>
                <h2 id="product-reviews-title">{t.reviewsTitle}</h2>
              </div>
            </Reveal>
            <div className="testimonials__grid">
              {productReviews.slice(0, 4).map((r, i) => (
                <Reveal key={r.id} delay={i * 90}>
                  <ReviewCard review={r} showProducts={false} />
                </Reveal>
              ))}
            </div>
            <div className="testimonials__ctas">
              <Link to="/reviews" className="btn btn--outline">
                {t.allReviews}
              </Link>
              <Link to="/reviews#write" className="link">
                {t.writeReview} <Icon name="arrow" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="section section--cream" aria-labelledby="related-title">
          <div className="container">
            <Reveal className="section-head">
              <div className="section-head__text">
                <span className="eyebrow">{t.moreToLove}</span>
                <h2 id="related-title">{t.youMightLike}</h2>
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
          {boxLeft > 0 ? t.chooseMoreShort(boxLeft) : added ? t.added : t.addToCart}
        </button>
      </div>
    </>
  );
}
