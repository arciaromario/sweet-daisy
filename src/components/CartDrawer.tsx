import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { formatPrep, formatPrice } from '../data/products';
import { CartLine } from './CartLine';
import { FreeDeliveryMeter } from './FreeDeliveryMeter';
import { Icon } from './Icon';
import { useScrollLock } from '../lib/scrollLock';
import { useCopy } from '../i18n';

const en = {
  title: 'Your bag',
  close: 'Close bag',
  empty: 'Your bag is empty.',
  emptyText: 'Something sweet is waiting for you.',
  shop: 'Shop Cookies',
  subtotal: 'Subtotal',
  pickupFree: 'Pickup is free. Delivery and date are chosen at checkout.',
  prep: (time: string) => `Average preparation time: ${time}.`,
  checkout: 'Continue to Checkout',
  view: 'View bag',
};
const es: typeof en = {
  title: 'Tu bolsa',
  close: 'Cerrar bolsa',
  empty: 'Tu bolsa está vacía.',
  emptyText: 'Algo dulce te está esperando.',
  shop: 'Ver galletas',
  subtotal: 'Subtotal',
  pickupFree: 'La recogida es gratis. La entrega a domicilio y la fecha se eligen al finalizar la compra.',
  prep: (time) => `Tiempo promedio de preparación: ${time}.`,
  checkout: 'Finalizar compra',
  view: 'Ver bolsa',
};

export function CartDrawer() {
  const { items, isOpen, close, subtotal, count, maxPrepHours } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const t = useCopy({ en, es });

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
            {t.title} <span className="muted">({count})</span>
          </h2>
          <button className="icon-btn" aria-label={t.close} onClick={close}>
            <Icon name="close" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="drawer__empty">
            <p className="serif drawer__empty-title">{t.empty}</p>
            <p className="muted">{t.emptyText}</p>
            <Link to="/shop" className="btn" onClick={close}>
              {t.shop}
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
                <span>{t.subtotal}</span>
                <span className="price">{formatPrice(subtotal)}</span>
              </div>
              <p className="small muted">
                <Icon name="store" className="inline-icon" /> {t.pickupFree}
              </p>
              {formatPrep(maxPrepHours) && (
                <p className="small muted">
                  <Icon name="clock" className="inline-icon" /> {t.prep(formatPrep(maxPrepHours) ?? '')}
                </p>
              )}
              <button className="btn btn--block" onClick={() => {
                  close();
                  navigate('/checkout');
                }}>
                {t.checkout}
              </button>
              <Link to="/cart" className="link drawer__view" onClick={close}>
                {t.view}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
