import { Link, useNavigate } from 'react-router';
import { CartLine } from '../components/CartLine';
import { FreeDeliveryMeter } from '../components/FreeDeliveryMeter';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { Seo } from '../components/Seo';
import { useCart } from '../context/CartContext';
import { formatPrep, formatPrice } from '../data/products';
import { useSite } from '../context/CatalogContext';
import { useCopy } from '../i18n';

const en = {
  title: 'Your bag',
  crumb: 'Bag',
  intro: (n: number) => `${n} ${n === 1 ? 'item' : 'items'}, baked to order.`,
  empty: 'Your bag is empty.',
  emptyText: 'Discover our cakes and treats, or design something entirely your own.',
  shop: 'Shop Cookies',
  custom: 'Create a Custom Cake',
  continueShopping: 'Continue shopping',
  summaryLabel: 'Order summary',
  summary: 'Summary',
  subtotal: 'Subtotal',
  pickup: 'Pickup',
  free: 'Free',
  delivery: 'Local delivery',
  estimated: 'Estimated total',
  checkout: 'Continue to Checkout',
  prep: 'Average preparation time:',
  lead: (n: number) => `Your bag needs ${n} ${n === 1 ? 'day' : 'days'} notice — choose your date at checkout.`,
  today: 'Ready as soon as today.',
  pickupAt: 'Pickup at',
  deliveryArea: 'Delivery',
  secure: 'Secure checkout',
};
const es: typeof en = {
  title: 'Tu bolsa',
  crumb: 'Bolsa',
  intro: (n) => `${n} ${n === 1 ? 'artículo' : 'artículos'}, horneados por encargo.`,
  empty: 'Tu bolsa está vacía.',
  emptyText: 'Descubre nuestros pasteles y dulces, o diseña algo totalmente a tu gusto.',
  shop: 'Ver galletas',
  custom: 'Crea un pastel personalizado',
  continueShopping: 'Seguir comprando',
  summaryLabel: 'Resumen del pedido',
  summary: 'Resumen',
  subtotal: 'Subtotal',
  pickup: 'Recogida',
  free: 'Gratis',
  delivery: 'Entrega a domicilio',
  estimated: 'Total estimado',
  checkout: 'Finalizar compra',
  prep: 'Tiempo promedio de preparación:',
  lead: (n) => `Tu bolsa necesita ${n} ${n === 1 ? 'día' : 'días'} de anticipación: elige tu fecha al finalizar la compra.`,
  today: 'Listo desde hoy mismo.',
  pickupAt: 'Recogida en',
  deliveryArea: 'Entrega a domicilio',
  secure: 'Pago seguro',
};

export default function Cart() {
  const { items, subtotal, count, maxLeadDays, maxPrepHours } = useCart();
  const navigate = useNavigate();
  const site = useSite();
  const t = useCopy({ en, es });

  return (
    <>
      <Seo title={t.title} path="/cart" />
      <meta name="robots" content="noindex" />
      <PageHeader title={t.title} crumbs={[{ label: t.crumb }]} intro={count ? t.intro(count) : undefined} />

      <section className="container cart-page">
        {items.length === 0 ? (
          <div className="empty">
            <p className="serif empty__title">{t.empty}</p>
            <p className="muted">{t.emptyText}</p>
            <div className="hero__ctas">
              <Link to="/shop" className="btn">
                {t.shop}
              </Link>
              <Link to="/custom-cakes" className="btn btn--outline">
                {t.custom}
              </Link>
            </div>
          </div>
        ) : (
          <div className="cart-page__grid">
            <div>
              <ul className="cart-lines cart-lines--page">
                {items.map((i) => (
                  <CartLine key={i.key} item={i} large />
                ))}
              </ul>
              <Link to="/shop" className="link">
                <Icon name="arrowLeft" /> {t.continueShopping}
              </Link>
            </div>

            <aside className="summary-card" aria-label={t.summaryLabel}>
              <h2 className="summary-card__title">{t.summary}</h2>
              <FreeDeliveryMeter subtotal={subtotal} />
              <div className="summary-row">
                <span>{t.subtotal}</span>
                <span className="price">{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>{t.pickup}</span>
                <span>{t.free}</span>
              </div>
              <div className="summary-row">
                <span>{t.delivery}</span>
                <span>{subtotal >= site.delivery.freeOver ? t.free : formatPrice(site.delivery.fee)}</span>
              </div>
              <hr className="divider" />
              <div className="summary-row summary-row--total">
                <span>{t.estimated}</span>
                <span className="price">{formatPrice(subtotal)}</span>
              </div>
              <button className="btn btn--block" onClick={() => navigate('/checkout')}>
                {t.checkout}
              </button>
              <ul className="summary-card__info">
                {formatPrep(maxPrepHours) && (
                  <li>
                    <Icon name="clock" /> {t.prep} {formatPrep(maxPrepHours)}
                  </li>
                )}
                <li>
                  <Icon name="calendar" />
                  {maxLeadDays > 0 ? t.lead(maxLeadDays) : t.today}
                </li>
                <li>
                  <Icon name="store" /> {t.pickupAt} {site.address.street}, {site.address.city}
                </li>
                <li>
                  <Icon name="truck" /> {t.deliveryArea} {site.delivery.radius}
                </li>
                <li>
                  <Icon name="lock" /> {t.secure}
                </li>
              </ul>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
