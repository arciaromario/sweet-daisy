import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { useCart } from '../context/CartContext';
import { useCopy } from '../i18n';
import { categoryName, formatPrep, formatPrice, type Product } from '../data/products';
import { Icon } from './Icon';
import { Img } from './Img';
import { OptionGroup } from './OptionGroup';
import { toCartItem } from './ProductCard';
import { QuantityStepper } from './QuantityStepper';
import { useScrollLock } from '../lib/scrollLock';

const en = {
  close: 'Close quick view',
  avgPrep: 'Average preparation time:',
  size: 'Size',
  flavour: 'Flavour',
  addToBag: (price: string) => `Add to bag · ${price}`,
  fullDetails: 'Full details & personalisation',
};
const es: typeof en = {
  close: 'Cerrar vista rápida',
  avgPrep: 'Tiempo promedio de preparación:',
  size: 'Tamaño',
  flavour: 'Sabor',
  addToBag: (price) => `Añadir a la bolsa · ${price}`,
  fullDetails: 'Detalles completos y personalización',
};

export function QuickView({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const t = useCopy({ en, es });
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

  // Rendered into <body>: inside the page wrapper its entry animation creates a stacking
  // context, which would keep the dialog under the sticky header.
  return createPortal(
    <div className="modal is-open">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__dialog quickview" role="dialog" aria-modal="true" aria-labelledby="qv-title" tabIndex={-1} ref={dialogRef}>
        <button className="icon-btn modal__close" aria-label={t.close} onClick={onClose}>
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
              <Icon name="clock" /> {t.avgPrep} <strong>{formatPrep(product.prepHours)}</strong>
            </p>
          )}

          <OptionGroup
            name="qv-size"
            legend={t.size}
            value={sizeId}
            onChange={setSizeId}
            min={120}
            choices={product.sizes.map((s) => ({ value: s.id, title: s.label, meta: s.servings }))}
          />
          {product.flavors && (
            <div className="field">
              <label className="field__label" htmlFor="qv-flavor">
                {t.flavour}
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
              {t.addToBag(formatPrice(item.unitPrice * qty))}
            </button>
          </div>
          <Link to={`/products/${product.slug}`} className="link" onClick={onClose}>
            {t.fullDetails} <Icon name="arrow" />
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
