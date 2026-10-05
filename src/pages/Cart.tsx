import { Link, useNavigate } from 'react-router';
import { CartLine } from '../components/CartLine';
import { FreeDeliveryMeter } from '../components/FreeDeliveryMeter';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { Seo } from '../components/Seo';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../data/products';
import { useSite } from '../context/CatalogContext';

export default function Cart() {
  const { items, subtotal, count, maxLeadDays } = useCart();
  const navigate = useNavigate();
  const site = useSite();

  return (
    <>
      <Seo title="Your bag" path="/cart" />
      <meta name="robots" content="noindex" />
      <PageHeader title="Your bag" crumbs={[{ label: 'Bag' }]} intro={count ? `${count} ${count === 1 ? 'item' : 'items'}, baked to order.` : undefined} />

      <section className="container cart-page">
        {items.length === 0 ? (
          <div className="empty">
            <p className="serif empty__title">Your bag is empty.</p>
            <p className="muted">Discover our cakes and treats, or design something entirely your own.</p>
            <div className="hero__ctas">
              <Link to="/shop" className="btn">
                Shop Cakes
              </Link>
              <Link to="/custom-cakes" className="btn btn--outline">
                Create a Custom Cake
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
                <Icon name="arrowLeft" /> Continue shopping
              </Link>
            </div>

            <aside className="summary-card" aria-label="Order summary">
              <h2 className="summary-card__title">Summary</h2>
              <FreeDeliveryMeter subtotal={subtotal} />
              <div className="summary-row">
                <span>Subtotal</span>
                <span className="price">{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Pickup</span>
                <span>Free</span>
              </div>
              <div className="summary-row">
                <span>Local delivery</span>
                <span>{subtotal >= site.delivery.freeOver ? 'Free' : formatPrice(site.delivery.fee)}</span>
              </div>
              <hr className="divider" />
              <div className="summary-row summary-row--total">
                <span>Estimated total</span>
                <span className="price">{formatPrice(subtotal)}</span>
              </div>
              <button className="btn btn--block" onClick={() => navigate('/checkout')}>
                Continue to Checkout
              </button>
              <ul className="summary-card__info">
                <li>
                  <Icon name="calendar" />
                  {maxLeadDays > 0 ? `Your bag needs ${maxLeadDays} ${maxLeadDays === 1 ? 'day' : 'days'} notice — choose your date at checkout.` : 'Ready as soon as today.'}
                </li>
                <li>
                  <Icon name="store" /> Pickup at {site.address.street}, {site.address.city}
                </li>
                <li>
                  <Icon name="truck" /> Delivery {site.delivery.radius}
                </li>
                <li>
                  <Icon name="lock" /> Secure checkout
                </li>
              </ul>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
