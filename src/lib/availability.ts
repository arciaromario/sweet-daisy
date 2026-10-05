import type { DayStatus } from './types';

export type Status = 'available' | 'limited' | 'booked' | 'closed' | 'too-soon';

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

export function dayStatus(date: Date, overrides: Record<string, DayStatus>, leadDays: number, closedWeekdays: number[]): Status {
  const iso = toISO(date);
  if (date < addDays(new Date(), leadDays)) return 'too-soon';
  const override = overrides[iso];
  if (override === 'open') return 'available';
  if (override) return override;
  if (closedWeekdays.includes(date.getDay())) return 'closed';
  return 'available';
}

export const isBookable = (s: Status) => s === 'available' || s === 'limited';

export function firstAvailable(overrides: Record<string, DayStatus>, leadDays: number, closedWeekdays: number[]): string {
  for (let i = leadDays; i < leadDays + 90; i++) {
    const d = addDays(new Date(), i);
    if (isBookable(dayStatus(d, overrides, leadDays, closedWeekdays))) return toISO(d);
  }
  return toISO(addDays(new Date(), leadDays));
}
