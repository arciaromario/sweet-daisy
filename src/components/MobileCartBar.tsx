import { useLocation } from 'react-router';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../data/products';
import { Icon } from './Icon';

/** Bottom bag indicator on small screens, shown once something is in the bag. */
export function MobileCartBar() {
  const { count, subtotal, open, isOpen } = useCart();
  const { pathname } = useLocation();
  const hidden = count === 0 || isOpen || ['/cart', '/checkout'].includes(pathname) || pathname.startsWith('/products/');

  return (
    <div className={`mobile-bar${hidden ? '' : ' is-visible'}`} aria-hidden={hidden} inert={hidden}>
      <button className="mobile-bar__btn" onClick={open}>
        <span className="mobile-bar__left">
          <Icon name="bag" />
          {count} {count === 1 ? 'item' : 'items'}
        </span>
        <span className="mobile-bar__right">
          {formatPrice(subtotal)} <Icon name="arrow" />
        </span>
      </button>
    </div>
  );
}
