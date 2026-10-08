import { useSite } from '../context/CatalogContext';
import { formatPrice } from '../data/products';
import { useCopy } from '../i18n';

const en = {
  unlocked: (
    <>
      You’ve unlocked <strong>free local delivery</strong>.
    </>
  ),
  away: (amount: string) => (
    <>
      You’re <strong>{amount}</strong> away from free local delivery.
    </>
  ),
};
const es: typeof en = {
  unlocked: (
    <>
      ¡Desbloqueaste la <strong>entrega a domicilio gratis</strong>!
    </>
  ),
  away: (amount) => (
    <>
      Te faltan <strong>{amount}</strong> para la entrega a domicilio gratis.
    </>
  ),
};

export function FreeDeliveryMeter({ subtotal }: { subtotal: number }) {
  const site = useSite();
  const t = useCopy({ en, es });
  const goal = site.delivery.freeOver;
  const pct = Math.min(100, (subtotal / goal) * 100);
  return (
    <div className="meter">
      <p className="small">
        {subtotal >= goal ? t.unlocked : t.away(formatPrice(goal - subtotal))}
      </p>
      <div className="meter__track" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
