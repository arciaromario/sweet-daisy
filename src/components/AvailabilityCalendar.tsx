import { useMemo, useState } from 'react';
import { useCatalog } from '../context/CatalogContext';
import { addDays, dayStatus, isBookable, toISO, type Status } from '../lib/availability';
import { Icon } from './Icon';

const labels: Record<Status, string> = {
  available: 'Available',
  limited: 'Limited',
  booked: 'Fully booked',
  closed: 'Closed',
  'too-soon': 'Not enough notice',
};

/**
 * Month calendar showing upcoming availability. Optionally acts as a date picker.
 */
export function AvailabilityCalendar({
  leadDays = 0,
  value,
  onChange,
  label = 'Upcoming availability',
}: {
  leadDays?: number;
  value?: string;
  onChange?: (iso: string) => void;
  label?: string;
}) {
  const { overrides, demo } = useCatalog();
  const today = new Date();
  const [offset, setOffset] = useState(0);
  const month = new Date(today.getFullYear(), today.getMonth() + offset, 1);

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7; // Monday-first grid
    const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: ({ date: Date; status: Status } | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= total; d++) {
      const date = new Date(month.getFullYear(), month.getMonth(), d);
      const past = date < addDays(today, 0);
      cells.push({ date, status: past ? 'too-soon' : dayStatus(date, overrides, leadDays, demo) });
    }
    return cells;
  }, [month.getTime(), overrides, leadDays, demo]); // eslint-disable-line react-hooks/exhaustive-deps

  const title = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectable = Boolean(onChange);

  return (
    <div className={`cal${selectable ? ' cal--picker' : ''}`}>
      <div className="cal__head">
        <p className="cal__title">
          <span className="visually-hidden">{label}: </span>
          {title}
        </p>
        <div className="cal__nav">
          <button type="button" className="icon-btn" aria-label="Previous month" disabled={offset === 0} onClick={() => setOffset((o) => o - 1)}>
            <Icon name="chevronLeft" />
          </button>
          <button type="button" className="icon-btn" aria-label="Next month" disabled={offset >= 3} onClick={() => setOffset((o) => o + 1)}>
            <Icon name="chevronRight" />
          </button>
        </div>
      </div>
      <div className="cal__grid" role="grid" aria-label={`${label}, ${title}`}>
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <span key={d} className="cal__dow" role="columnheader">
            {d}
          </span>
        ))}
        {days.map((cell, i) => {
          if (!cell) return <span key={`e${i}`} aria-hidden="true" />;
          const iso = toISO(cell.date);
          const bookable = isBookable(cell.status);
          const selected = value === iso;
          const name = `${cell.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, ${labels[cell.status]}`;
          return selectable ? (
            <button
              type="button"
              key={iso}
              role="gridcell"
              className={`cal__day is-${cell.status}${selected ? ' is-selected' : ''}`}
              disabled={!bookable}
              aria-pressed={selected}
              aria-label={name}
              onClick={() => onChange?.(iso)}
            >
              {cell.date.getDate()}
            </button>
          ) : (
            <span key={iso} role="gridcell" className={`cal__day is-${cell.status}`} aria-label={name} title={labels[cell.status]}>
              {cell.date.getDate()}
            </span>
          );
        })}
      </div>
      <ul className="cal__legend">
        <li>
          <span className="dot dot--available" /> Available
        </li>
        <li>
          <span className="dot dot--limited" /> Limited
        </li>
        <li>
          <span className="dot dot--booked" /> Fully booked
        </li>
      </ul>
    </div>
  );
}
