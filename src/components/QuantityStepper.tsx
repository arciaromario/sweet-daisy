import { useCopy } from '../i18n';
import { Icon } from './Icon';

const en = {
  quantity: 'Quantity',
  decrease: 'Decrease quantity',
  increase: 'Increase quantity',
};
const es: typeof en = {
  quantity: 'Cantidad',
  decrease: 'Disminuir cantidad',
  increase: 'Aumentar cantidad',
};

export function QuantityStepper({ value, onChange, label }: { value: number; onChange: (n: number) => void; label?: string }) {
  const t = useCopy({ en, es });
  return (
    <div className="qty" role="group" aria-label={label ?? t.quantity}>
      <button type="button" aria-label={t.decrease} onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1}>
        <Icon name="minus" />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label={t.increase} onClick={() => onChange(Math.min(50, value + 1))}>
        <Icon name="plus" />
      </button>
    </div>
  );
}
