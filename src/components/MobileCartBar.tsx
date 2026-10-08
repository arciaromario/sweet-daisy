import { useLocation } from 'react-router';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../data/products';
import { Icon } from './Icon';
import { useCopy } from '../i18n';

const en = {
  view: (n: number, total: string) => `View bag: ${n} ${n === 1 ? 'item' : 'items'}, ${total}`,
};
const es: typeof en = {
  view: (n, total) => `Ver bolsa: ${n} ${n === 1 ? 'artículo' : 'artículos'}, ${total}`,
};

/** Small floating bag button on phones, shown once something is in the bag. */
export function MobileCartBar() {
  const { count, subtotal, open, isOpen } = useCart();
  const { pathname } = useLocation();
  const t = useCopy({ en, es });
  const hidden = count === 0 || isOpen || ['/cart', '/checkout'].includes(pathname) || pathname.startsWith('/products/');

  return (
    <div className={`mobile-bar${hidden ? '' : ' is-visible'}`} aria-hidden={hidden} inert={hidden}>
      <button className="mobile-bar__btn" onClick={open} aria-label={t.view(count, formatPrice(subtotal))}>
        <Icon name="bag" />
        {/* Keyed by count so the badge bounces each time something is added. */}
        <span key={count} className="mobile-bar__count" aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      </button>
    </div>
  );
}
