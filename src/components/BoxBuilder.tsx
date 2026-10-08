import type { CSSProperties } from 'react';
import { Icon } from './Icon';

export type BoxFill = Record<string, number>;

/** "2 × Classic Chocolate Chip, 1 × Biscoff Crumble" — what the bag and the order record. */
export const describeBox = (fill: BoxFill) =>
  Object.entries(fill)
    .filter(([, n]) => n > 0)
    .map(([name, n]) => `${n} × ${name}`)
    .join(', ');

export const boxTotal = (fill: BoxFill) => Object.values(fill).reduce((a, b) => a + b, 0);

/** Keeps a fill within a smaller box by trimming from the last flavours added. */
export function fitBox(fill: BoxFill, capacity: number): BoxFill {
  const next: BoxFill = {};
  let room = capacity;
  for (const [name, n] of Object.entries(fill)) {
    const take = Math.min(n, room);
    if (take > 0) next[name] = take;
    room -= take;
  }
  return next;
}

/**
 * Lets the customer fill a cookie box of a given size with any mix of flavours,
 * with a row of cookie slots that fill up as they choose.
 */
export function BoxBuilder({ flavors, capacity, fill, onChange }: { flavors: string[]; capacity: number; fill: BoxFill; onChange: (f: BoxFill) => void }) {
  const total = boxTotal(fill);
  const left = capacity - total;
  const slots = Object.entries(fill).flatMap(([name, n]) => Array.from({ length: n }, () => name));

  const change = (name: string, delta: number) => {
    const n = Math.max(0, (fill[name] ?? 0) + delta);
    if (delta > 0 && left <= 0) return;
    const next = { ...fill, [name]: n };
    if (!n) delete next[name];
    onChange(next);
  };

  const fillEvenly = () => {
    const next: BoxFill = {};
    for (let i = 0; i < capacity; i++) {
      const name = flavors[i % flavors.length];
      next[name] = (next[name] ?? 0) + 1;
    }
    onChange(next);
  };

  return (
    <fieldset className="boxb">
      <legend className="field__label boxb__legend">
        Fill your box
        <span className={`boxb__status${left === 0 ? ' is-full' : ''}`} aria-live="polite">
          {left === 0 ? 'Box full' : `${left} ${left === 1 ? 'cookie' : 'cookies'} to choose`}
        </span>
      </legend>

      <div className="boxb__slots" aria-hidden="true">
        {Array.from({ length: capacity }, (_, i) => (
          <span key={i} className={`boxb__slot${slots[i] ? ' is-filled' : ''}`} title={slots[i]}>
            {slots[i] && <span key={`${i}-${slots[i]}`} className="boxb__cookie" style={{ '--h': hue(slots[i]) } as CSSProperties} />}
          </span>
        ))}
      </div>

      <ul className="boxb__list">
        {flavors.map((name) => {
          const n = fill[name] ?? 0;
          return (
            <li key={name} className={`boxb__row${n ? ' is-picked' : ''}`}>
              <span className="boxb__dot" style={{ '--h': hue(name) } as CSSProperties} aria-hidden="true" />
              <span className="boxb__name">{name}</span>
              <span className="boxb__stepper">
                <button type="button" className="icon-btn" onClick={() => change(name, -1)} disabled={!n} aria-label={`One less ${name}`}>
                  <Icon name="minus" />
                </button>
                <span className="boxb__count" aria-label={`${n} ${name}`}>
                  {n}
                </span>
                <button type="button" className="icon-btn" onClick={() => change(name, 1)} disabled={left <= 0} aria-label={`One more ${name}`}>
                  <Icon name="plus" />
                </button>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="boxb__actions">
        <button type="button" className="link-inline" onClick={fillEvenly}>
          Mix it for me
        </button>
        {total > 0 && (
          <button type="button" className="link-inline" onClick={() => onChange({})}>
            Start over
          </button>
        )}
      </div>
    </fieldset>
  );
}

/** A stable warm tone per flavour for the little cookie dots. */
function hue(name: string) {
  const n = name.toLowerCase();
  if (/double|fudge|cocoa|dark/.test(n)) return '#6b4430';
  if (/red velvet/.test(n)) return '#a8414a';
  if (/biscoff|caramel|lotus/.test(n)) return '#c4874a';
  if (/funfetti|birthday|vanilla/.test(n)) return '#f0d9a8';
  if (/s.?mores|marshmallow|graham/.test(n)) return '#d9a66a';
  return '#c99a5e';
}
