import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useCart } from '../context/CartContext';
import { categoryName, formatPrep, formatPrice, type Product } from '../data/products';
import { Icon } from './Icon';
import { Img } from './Img';
import { OptionGroup } from './OptionGroup';
import { toCartItem } from './ProductCard';
import { QuantityStepper } from './QuantityStepper';
import { useScrollLock } from '../lib/scrollLock';

export function QuickView({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { add } = useCart();
  const [sizeId, setSizeId] = useState('');
  const [flavor, setFlavor] = useState('');
  const [qty, setQty] = useState(1);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useScrollLock(Boolean(product));

  useEffect(() => {
    if (!product) return;
    setSizeId(product.sizes[0].id);
    setFlavor(product.flavors?.[0]?.label ?? '');
    setQty(1);
    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [product]);

  if (!product) return null;
  const item = toCartItem(product, { sizeId, flavor, quantity: qty });

  return (
    <div className="modal is-open">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__dialog quickview" role="dialog" aria-modal="true" aria-labelledby="qv-title" tabIndex={-1} ref={dialogRef}>
        <button className="icon-btn modal__close" aria-label="Close quick view" onClick={onClose}>
          <Icon name="close" />
        </button>
        <Img src={product.images[0]} alt={product.name} ratio="4 / 5" width={900} sizes="(min-width: 800px) 420px, 100vw" tint={product.tint} className="quickview__img" />
        <div className="quickview__body">
          <span className="eyebrow eyebrow--plain">{categoryName(product.category)}</span>
          <h2 id="qv-title" className="quickview__title">
            {product.name}
          </h2>
          <p className="price quickview__price">{formatPrice(item.unitPrice)}</p>
          <p className="muted">{product.short}</p>
          {formatPrep(product.prepHours) && (
            <p className="prep-note">
              <Icon name="clock" /> Average preparation time: <strong>{formatPrep(product.prepHours)}</strong>
            </p>
          )}

          <OptionGroup
            name="qv-size"
            legend="Size"
            value={sizeId}
            onChange={setSizeId}
            min={120}
            choices={product.sizes.map((s) => ({ value: s.id, title: s.label, meta: s.servings }))}
          />
          {product.flavors && (
            <div className="field">
              <label className="field__label" htmlFor="qv-flavor">
                Flavour
              </label>
              <select id="qv-flavor" className="select" value={flavor} onChange={(e) => setFlavor(e.target.value)}>
                {product.flavors.map((f) => (
                  <option key={f.label} value={f.label}>
                    {f.label}
                    {f.price ? ` (+${formatPrice(f.price)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="quickview__actions">
            <QuantityStepper value={qty} onChange={setQty} />
            <button
              className="btn quickview__add"
              onClick={() => {
                add(item);
                onClose();
              }}
            >
              Add to bag · {formatPrice(item.unitPrice * qty)}
            </button>
          </div>
          <Link to={`/products/${product.slug}`} className="link" onClick={onClose}>
            Full details & personalisation <Icon name="arrow" />
          </Link>
        </div>
      </div>
    </div>
  );
}
