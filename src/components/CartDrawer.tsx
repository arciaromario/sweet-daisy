import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { formatPrep, formatPrice } from '../data/products';
import { CartLine } from './CartLine';
import { FreeDeliveryMeter } from './FreeDeliveryMeter';
import { Icon } from './Icon';
import { useScrollLock } from '../lib/scrollLock';

export function CartDrawer() {
  const { items, isOpen, close, subtotal, count, maxPrepHours } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => close(), [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [isOpen, close]);

  return (
    <div className={`drawer${isOpen ? ' is-open' : ''}`} inert={!isOpen}>
      <div className="drawer__backdrop" onClick={close} />
      <div className="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title" tabIndex={-1} ref={panelRef}>
        <div className="drawer__head">
          <h2 id="drawer-title" className="drawer__title">
            Your bag <span className="muted">({count})</span>
          </h2>
          <button className="icon-btn" aria-label="Close bag" onClick={close}>
            <Icon name="close" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="drawer__empty">
            <p className="serif drawer__empty-title">Your bag is empty.</p>
            <p className="muted">Something sweet is waiting for you.</p>
            <Link to="/shop" className="btn" onClick={close}>
              Shop Cakes
            </Link>
          </div>
        ) : (
          <>
            <div className="drawer__body">
              <FreeDeliveryMeter subtotal={subtotal} />
              <ul className="cart-lines">
                {items.map((item) => (
                  <CartLine key={item.key} item={item} onNavigate={close} />
                ))}
              </ul>
            </div>
            <div className="drawer__foot">
              <div className="summary-row summary-row--total">
                <span>Subtotal</span>
                <span className="price">{formatPrice(subtotal)}</span>
              </div>
              <p className="small muted">
                <Icon name="store" className="inline-icon" /> Pickup is free. Delivery and date are chosen at checkout.
              </p>
              {formatPrep(maxPrepHours) && (
                <p className="small muted">
                  <Icon name="clock" className="inline-icon" /> Average preparation time: {formatPrep(maxPrepHours)}.
                </p>
              )}
              <button className="btn btn--block" onClick={() => {
                  close();
                  navigate('/checkout');
                }}>
                Continue to Checkout
              </button>
              <Link to="/cart" className="link drawer__view" onClick={close}>
                View bag
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
