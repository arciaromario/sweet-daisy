import { useId } from 'react';
import { useCopy } from '../i18n';
import { Icon } from './Icon';

const en = {
  outOf: (n: number) => `${n} out of 5 stars`,
  pick: (n: number) => `${n} ${n === 1 ? 'star' : 'stars'}`,
};
const es: typeof en = {
  outOf: (n) => `${n} de 5 estrellas`,
  pick: (n) => `${n} ${n === 1 ? 'estrella' : 'estrellas'}`,
};

/** Five stars filled to the nearest half of `value`. */
export function Stars({ value, className = '' }: { value: number; className?: string }) {
  const t = useCopy({ en, es });
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={`stars ${className}`} role="img" aria-label={t.outOf(Number(rounded.toFixed(1)))}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`stars__star${n <= rounded ? ' is-on' : ''}`}>
          <Icon name="star" />
          {n - 0.5 === rounded && (
            <span className="stars__half">
              <Icon name="star" />
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

/** A 1–5 star picker built on radio buttons, so it works with the keyboard. */
export function StarInput({ value, onChange, legend, invalid }: { value: number; onChange: (n: number) => void; legend: string; invalid?: boolean }) {
  const t = useCopy({ en, es });
  const name = useId();
  return (
    <fieldset className={`star-input${invalid ? ' is-invalid' : ''}`}>
      <legend className="field__label">{legend}</legend>
      <div className="star-input__row">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={`star-input__star${n <= value ? ' is-on' : ''}`}>
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="visually-hidden" />
            <Icon name="star" />
            <span className="visually-hidden">{t.pick(n)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
