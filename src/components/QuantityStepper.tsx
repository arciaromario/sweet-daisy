import { Icon } from './Icon';

export function QuantityStepper({ value, onChange, label = 'Quantity' }: { value: number; onChange: (n: number) => void; label?: string }) {
  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" aria-label="Decrease quantity" onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1}>
        <Icon name="minus" />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label="Increase quantity" onClick={() => onChange(Math.min(50, value + 1))}>
        <Icon name="plus" />
      </button>
    </div>
  );
}
