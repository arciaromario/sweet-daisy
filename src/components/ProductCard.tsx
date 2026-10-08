import { useState } from 'react';
import { Link } from 'react-router';
import { useCart } from '../context/CartContext';
import { formatPrep, formatPrice, fromPrice, MIX_BOX_SLUG, type Product } from '../data/products';
import { Icon } from './Icon';
import { Img } from './Img';

export function toCartItem(
  p: Product,
  opts: { sizeId?: string; flavor?: string; mix?: string; decorationId?: string; message?: string; notes?: string; quantity?: number } = {},
) {
  const size = p.sizes.find((s) => s.id === opts.sizeId) ?? p.sizes[0];
  // A mixed box records its cookies ("2 × Biscoff Crumble, …") instead of a priced flavour option.
  const flavor = opts.mix ? undefined : (p.flavors?.find((f) => f.label === opts.flavor) ?? p.flavors?.[0]);
  const deco = p.decorations?.find((d) => d.id === opts.decorationId) ?? p.decorations?.[0];
  return {
    slug: p.slug,
    name: p.name,
    image: p.images[0],
    tint: p.tint,
    sizeId: size.id,
    sizeLabel: size.label,
    servings: size.servings,
    flavor: opts.mix ?? flavor?.label,
    decorationId: deco?.id,
    decorationLabel: deco && deco.price > 0 ? deco.label : undefined,
    message: opts.message?.trim() || undefined,
    notes: opts.notes?.trim() || undefined,
    unitPrice: size.price + (flavor?.price ?? 0) + (deco?.price ?? 0),
    quantity: opts.quantity ?? 1,
    leadDays: p.leadDays,
    prepHours: p.prepHours,
  };
}

export function ProductCard({
  product,
  onQuickView,
  showOptions = false,
  priority = false,
}: {
  product: Product;
  onQuickView?: (p: Product) => void;
  showOptions?: boolean;
  priority?: boolean;
}) {
  const { add } = useCart();
  const [sizeId, setSizeId] = useState(product.sizes[0].id);
  const size = product.sizes.find((s) => s.id === sizeId)!;
  const href = `/products/${product.slug}`;
  const isMix = product.slug === MIX_BOX_SLUG;

  return (
    <article className="pcard">
      <div className="pcard__media">
        <Link to={href} aria-label={product.name} className="pcard__imglink">
          <Img src={product.images[0]} alt={product.name} ratio="4 / 5" width={800} sizes="(min-width: 1100px) 30vw, (min-width: 640px) 45vw, 75vw" tint={product.tint} priority={priority} />
          {product.images[1] && (
            <Img src={product.images[1]} alt="" ratio="4 / 5" width={800} sizes="(min-width: 1100px) 30vw, 45vw" tint={product.tint} className="pcard__alt" />
          )}
        </Link>
        {product.badge && <span className={`badge pcard__badge${product.badge === 'Limited' ? ' badge--blush' : ''}`}>{product.badge}</span>}
        {onQuickView && !isMix && (
          <button type="button" className="pcard__quick" onClick={() => onQuickView(product)}>
            <Icon name="eye" /> <span>Quick view</span>
          </button>
        )}
      </div>

      <div className="pcard__body">
        <div className="pcard__row">
          <h3 className="pcard__name">
            <Link to={href}>{product.name}</Link>
          </h3>
          <span className="price pcard__price">{showOptions ? formatPrice(size.price) : `From ${formatPrice(fromPrice(product))}`}</span>
        </div>
        <p className="pcard__desc">{product.short}</p>
        {formatPrep(product.prepHours, 'short') && (
          <p className="pcard__prep">
            <Icon name="clock" /> Prep time {formatPrep(product.prepHours, 'short')}
          </p>
        )}

        {showOptions ? (
          <>
            <div className="pcard__sizes" role="radiogroup" aria-label={`Size for ${product.name}`}>
              {product.sizes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={s.id === sizeId}
                  className={`pcard__size${s.id === sizeId ? ' is-active' : ''}`}
                  onClick={() => setSizeId(s.id)}
                  title={s.servings}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {isMix ? (
              <Link to={href} className="btn btn--outline btn--sm pcard__add">
                <Icon name="plus" /> Choose your cookies
              </Link>
            ) : (
              <button type="button" className="btn btn--outline btn--sm pcard__add" onClick={() => add(toCartItem(product, { sizeId }))}>
                <Icon name="plus" /> Add to bag
              </button>
            )}
          </>
        ) : (
          <p className="pcard__meta">{product.sizes.map((s) => s.label).join(' · ')}</p>
        )}
      </div>
    </article>
  );
}
