import { availability } from '../data/site';
import type { DayStatus } from './api';

export type Status = 'available' | DayStatus | 'too-soon';

export const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const addDays = (d: Date, n: number) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
};

export const parseISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const formatDate = (s: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }) =>
  parseISO(s).toLocaleDateString('en-US', opts);

/** Small, stable pseudo-random pattern so the demo calendar looks realistic without a backend. */
function demoStatus(iso: string): DayStatus | undefined {
  let h = 0;
  for (const c of iso) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const r = h % 10;
  if (r === 0) return 'booked';
  if (r <= 2) return 'limited';
  return undefined;
}

export function dayStatus(date: Date, overrides: Record<string, DayStatus>, leadDays = 0, demo = false): Status {
  const iso = toISO(date);
  const today = addDays(new Date(), 0);
  if (date < addDays(today, leadDays)) return 'too-soon';
  if (availability.closedWeekdays.includes(date.getDay())) return 'closed';
  if (overrides[iso]) return overrides[iso];
  if (availability.blocked.includes(iso)) return 'booked';
  if (availability.limited.includes(iso)) return 'limited';
  if (demo && availability.demoPattern) return demoStatus(iso) ?? 'available';
  return 'available';
}

export const isBookable = (s: Status) => s === 'available' || s === 'limited';

export function firstAvailable(overrides: Record<string, DayStatus>, leadDays: number, demo: boolean): string {
  for (let i = leadDays; i < leadDays + 60; i++) {
    const d = addDays(new Date(), i);
    if (isBookable(dayStatus(d, overrides, leadDays, demo))) return toISO(d);
  }
  return toISO(addDays(new Date(), leadDays));
}
