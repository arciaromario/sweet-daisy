import { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { useCatalog } from '../../context/CatalogContext';
import { weekdayNames } from '../../data/settings';
import { getSettings, listOrders, listOverrides, listRequests, saveSettings, setOverride } from '../../lib/adminApi';
import { toISO } from '../../lib/availability';
import type { DayStatus } from '../../lib/types';
import { Card, ErrorNote, fmtDate, Loading, PageTitle, useLoad, useToast } from '../ui';

const statusLabel: Record<DayStatus | 'available', string> = {
  available: 'Disponible',
  open: 'Abierto (excepción)',
  limited: 'Pocas plazas',
  booked: 'Completo',
  closed: 'Cerrado',
};

const weekdaysEs = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function AvailabilityAdmin() {
  const toast = useToast();
  const { reload: reloadStore } = useCatalog();
  const { data, setData, error, loading, reload } = useLoad(async () => {
    const [overrides, orders, requests, settings] = await Promise.all([listOverrides(), listOrders(), listRequests(), getSettings()]);
    return { overrides, orders, requests, settings };
  });
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const byDay = useMemo(() => {
    const map: Record<string, { orders: number; events: number }> = {};
    for (const o of data?.orders ?? []) {
      if (o.status === 'cancelled') continue;
      (map[o.fulfillment_date] ??= { orders: 0, events: 0 }).orders++;
    }
    for (const r of data?.requests ?? []) {
      if (r.status === 'declined') continue;
      (map[r.event_date] ??= { orders: 0, events: 0 }).events++;
    }
    return map;
  }, [data]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;
  if (!data) return null;

  const overrideMap = Object.fromEntries(data.overrides.map((o) => [o.day, o]));
  const closed = data.settings.store.closedWeekdays;
  const today = toISO(new Date());

  async function applyStatus(day: string, status: DayStatus | null) {
    try {
      await setOverride(day, status, note);
      setData((d) => d && { ...d, overrides: [...d.overrides.filter((o) => o.day !== day), ...(status ? [{ day, status, note: note || null }] : [])] });
      reloadStore();
      toast(status ? `${fmtDate(day)}: ${statusLabel[status]}` : `${fmtDate(day)}: cambios guardados`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    }
  }

  async function toggleWeekday(d: number) {
    const next = closed.includes(d) ? closed.filter((x) => x !== d) : [...closed, d].sort();
    const store = { ...data!.settings.store, closedWeekdays: next };
    try {
      await saveSettings('store', store);
      setData((x) => x && { ...x, settings: { ...x.settings, store } });
      reloadStore();
      toast('Días de cierre actualizados');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    }
  }

  const months = [0, 1].map((i) => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + offset + i, 1);
  });

  const sel = selected ? overrideMap[selected] : null;
  const selOrders = selected ? data.orders.filter((o) => o.fulfillment_date === selected && o.status !== 'cancelled') : [];
  const selEvents = selected ? data.requests.filter((r) => r.event_date === selected && r.status !== 'declined') : [];

  return (
    <>
      <PageTitle title="Disponibilidad" subtitle="Marca los días completos, con pocas plazas o cerrados. Los clientes no podrán elegir días completos ni cerrados." />

      <div className="adm-avail">
        <Card
          title="Calendario"
          actions={
            <div className="adm-cal-nav">
              <button className="icon-btn" aria-label="Meses anteriores" disabled={offset === 0} onClick={() => setOffset(offset - 1)}>
                <Icon name="chevronLeft" />
              </button>
              <button className="icon-btn" aria-label="Meses siguientes" disabled={offset >= 10} onClick={() => setOffset(offset + 1)}>
                <Icon name="chevronRight" />
              </button>
            </div>
          }
        >
          <div className="adm-cals">
            {months.map((m) => (
              <div key={m.toISOString()} className="adm-cal">
                <p className="adm-cal__title">{m.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
                <div className="adm-cal__grid">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                    <span key={d} className="adm-cal__dow">
                      {d}
                    </span>
                  ))}
                  {Array.from({ length: (m.getDay() + 6) % 7 }, (_, i) => (
                    <span key={`e${i}`} />
                  ))}
                  {Array.from({ length: new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate() }, (_, i) => {
                    const date = new Date(m.getFullYear(), m.getMonth(), i + 1);
                    const iso = toISO(date);
                    const ov = overrideMap[iso];
                    const status: DayStatus | 'available' = ov?.status === 'open' ? 'available' : ov?.status ?? (closed.includes(date.getDay()) ? 'closed' : 'available');
                    const counts = byDay[iso];
                    const past = iso < today;
                    return (
                      <button
                        key={iso}
                        className={`adm-day is-${status}${past ? ' is-past' : ''}${selected === iso ? ' is-selected' : ''}${ov ? ' has-override' : ''}`}
                        disabled={past}
                        onClick={() => {
                          setSelected(iso);
                          setNote(ov?.note ?? '');
                        }}
                        aria-label={`${fmtDate(iso, { weekday: 'long', day: 'numeric', month: 'long' })}: ${statusLabel[status]}${counts ? `, ${counts.orders} pedidos, ${counts.events} eventos` : ''}`}
                      >
                        <span>{i + 1}</span>
                        {counts && (
                          <span className="adm-day__counts">
                            {counts.orders > 0 && <i title="Pedidos">{counts.orders}</i>}
                            {counts.events > 0 && <i className="ev" title="Pasteles personalizados">{counts.events}</i>}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <ul className="adm-legend">
            <li>
              <span className="adm-swatch is-available" /> Disponible
            </li>
            <li>
              <span className="adm-swatch is-limited" /> Pocas plazas
            </li>
            <li>
              <span className="adm-swatch is-booked" /> Completo
            </li>
            <li>
              <span className="adm-swatch is-closed" /> Cerrado
            </li>
            <li>
              <i className="adm-dot" /> pedidos · <i className="adm-dot ev" /> pasteles personalizados
            </li>
          </ul>
        </Card>

        <div className="stack">
          <Card title={selected ? fmtDate(selected, { weekday: 'long', day: 'numeric', month: 'long' }) : 'Elige un día'}>
            {!selected ? (
              <p className="adm-muted">Toca un día del calendario para cambiar su disponibilidad.</p>
            ) : (
              <div className="stack">
                <div className="adm-status-btns">
                  {(['available', 'limited', 'booked', 'closed'] as const).map((s) => {
                    const weeklyClosed = closed.includes(new Date(`${selected}T12:00:00`).getDay());
                    const current = sel?.status === 'open' ? 'available' : sel?.status ?? (weeklyClosed ? 'closed' : 'available');
                    // On a normally-closed weekday, "available" needs an explicit "open" exception.
                    const target: DayStatus | null = s === 'available' ? (weeklyClosed ? 'open' : null) : s === 'closed' && weeklyClosed ? null : s;
                    return (
                      <button key={s} className={`adm-status-btn is-${s}${current === s ? ' is-active' : ''}`} onClick={() => applyStatus(selected, target)}>
                        {statusLabel[s]}
                      </button>
                    );
                  })}
                </div>
                <label className="adm-field">
                  <span className="adm-field__label">Nota (solo para ti)</span>
                  <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej. boda Martínez, vacaciones…" />
                </label>
                {sel && note !== (sel.note ?? '') && (
                  <button className="btn btn--sm" onClick={() => applyStatus(selected, sel.status)}>
                    Guardar nota
                  </button>
                )}
                {closed.includes(new Date(`${selected}T12:00:00`).getDay()) && (
                  <p className="adm-muted adm-small">Este día de la semana está cerrado por defecto. Pulsa “Disponible” para abrirlo solo esta fecha.</p>
                )}
                <div>
                  <p className="adm-field__label">Ese día</p>
                  {selOrders.length + selEvents.length === 0 ? (
                    <p className="adm-muted adm-small">Sin pedidos ni eventos.</p>
                  ) : (
                    <ul className="adm-mini-list">
                      {selOrders.map((o) => (
                        <li key={o.id}>
                          <div>
                            <strong>{o.order_number}</strong> · {o.time_slot}
                            <span className="adm-muted">{o.order_items.map((i) => `${i.quantity}× ${i.product_name}`).join(', ')}</span>
                          </div>
                        </li>
                      ))}
                      {selEvents.map((r) => (
                        <li key={r.id}>
                          <div>
                            <strong>Pastel personalizado</strong> · {r.name}
                            <span className="adm-muted">
                              {r.size} · {r.decoration_style}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card title="Días de cierre semanal">
            <div className="adm-weekdays">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <button key={d} className={`adm-weekday${closed.includes(d) ? ' is-closed' : ''}`} onClick={() => toggleWeekday(d)} aria-pressed={closed.includes(d)} title={weekdayNames[d]}>
                  {weekdaysEs[d].slice(0, 3)}
                </button>
              ))}
            </div>
            <p className="adm-muted adm-small">Los días marcados están cerrados todas las semanas.</p>
          </Card>

          <Card title="Días marcados">
            {data.overrides.length === 0 ? (
              <p className="adm-muted adm-small">No hay días marcados.</p>
            ) : (
              <ul className="adm-mini-list">
                {[...data.overrides]
                  .sort((a, b) => a.day.localeCompare(b.day))
                  .map((o) => (
                    <li key={o.day}>
                      <div>
                        <strong>{fmtDate(o.day)}</strong> · {statusLabel[o.status]}
                        {o.note && <span className="adm-muted">{o.note}</span>}
                      </div>
                      <button className="adm-link" onClick={() => applyStatus(o.day, null)}>
                        Quitar
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
