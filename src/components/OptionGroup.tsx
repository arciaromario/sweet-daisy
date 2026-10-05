import type { CSSProperties } from 'react';
import { formatPrice } from '../data/products';

export interface Choice {
  value: string;
  title: string;
  meta?: string;
  price?: number;
  priceMode?: 'absolute' | 'extra';
}

export function OptionGroup({
  name,
  legend,
  choices,
  value,
  onChange,
  min = 140,
  hint,
}: {
  name: string;
  legend: string;
  choices: Choice[];
  value: string;
  onChange: (v: string) => void;
  min?: number;
  hint?: string;
}) {
  return (
    <fieldset className="opt-group">
      <legend className="field__label">
        {legend} {hint && <span className="opt-group__hint">{hint}</span>}
      </legend>
      <div className="options" style={{ '--opt-min': `${min}px` } as CSSProperties}>
        {choices.map((c) => (
          <label key={c.value} className="option">
            <input type="radio" name={name} value={c.value} checked={value === c.value} onChange={() => onChange(c.value)} />
            <span className="option__title">{c.title}</span>
            {c.meta && <span className="option__meta">{c.meta}</span>}
            {c.price !== undefined && (c.priceMode === 'absolute' || c.price > 0) && (
              <span className="option__price">{c.priceMode === 'absolute' ? formatPrice(c.price) : `+ ${formatPrice(c.price)}`}</span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
