import { site } from '../data/site';
import { formatPrice } from '../data/products';

export function FreeDeliveryMeter({ subtotal }: { subtotal: number }) {
  const goal = site.delivery.freeOver;
  const pct = Math.min(100, (subtotal / goal) * 100);
  return (
    <div className="meter">
      <p className="small">
        {subtotal >= goal ? (
          <>You’ve unlocked <strong>free local delivery</strong>.</>
        ) : (
          <>
            You’re <strong>{formatPrice(goal - subtotal)}</strong> away from free local delivery.
          </>
        )}
      </p>
      <div className="meter__track" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
