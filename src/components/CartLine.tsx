import { Link } from 'react-router';
import { useCart, type CartItem } from '../context/CartContext';
import { formatPrice } from '../data/products';
import { Icon } from './Icon';
import { Img } from './Img';
import { useCopy } from '../i18n';

const en = {
  message: 'Message:',
  notes: 'Notes:',
  quantityFor: (name: string) => `Quantity for ${name}`,
  decrease: 'Decrease quantity',
  increase: 'Increase quantity',
  remove: 'Remove',
};
const es: typeof en = {
  message: 'Mensaje:',
  notes: 'Notas:',
  quantityFor: (name) => `Cantidad de ${name}`,
  decrease: 'Disminuir cantidad',
  increase: 'Aumentar cantidad',
  remove: 'Eliminar',
};

export function CartLine({ item, onNavigate, large = false }: { item: CartItem; onNavigate?: () => void; large?: boolean }) {
  const { setQuantity, remove } = useCart();
  const t = useCopy({ en, es });
  const options = [item.sizeLabel, item.flavor, item.decorationLabel].filter(Boolean);

  return (
    <li className={`cart-line${large ? ' cart-line--large' : ''}`}>
      <Link to={`/products/${item.slug}`} className="cart-line__img" onClick={onNavigate} tabIndex={-1} aria-hidden="true">
        <Img src={item.image} alt="" ratio="4 / 5" width={240} sizes="120px" tint={item.tint} />
      </Link>
      <div className="cart-line__body">
        <div className="cart-line__top">
          <Link to={`/products/${item.slug}`} className="cart-line__name" onClick={onNavigate}>
            {item.name}
          </Link>
          <span className="price">{formatPrice(item.unitPrice * item.quantity)}</span>
        </div>
        <ul className="cart-line__opts">
          {options.map((o) => (
            <li key={o}>{o}</li>
          ))}
          {item.message && <li>{t.message} “{item.message}”</li>}
          {item.notes && <li>{t.notes} {item.notes}</li>}
        </ul>
        <div className="cart-line__bottom">
          <div className="qty qty--sm" role="group" aria-label={t.quantityFor(item.name)}>
            <button type="button" aria-label={t.decrease} onClick={() => setQuantity(item.key, item.quantity - 1)}>
              <Icon name="minus" />
            </button>
            <output aria-live="polite">{item.quantity}</output>
            <button type="button" aria-label={t.increase} onClick={() => setQuantity(item.key, item.quantity + 1)}>
              <Icon name="plus" />
            </button>
          </div>
          <button type="button" className="cart-line__remove" onClick={() => remove(item.key)}>
            {t.remove}<span className="visually-hidden"> {item.name}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
