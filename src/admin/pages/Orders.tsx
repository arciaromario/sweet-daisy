import { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { listOrders, updateOrder } from '../../lib/adminApi';
import { toISO } from '../../lib/availability';
import type { OrderRecord, OrderStatus, PaymentStatus } from '../../lib/types';
import { Badge, downloadFile, Drawer, Empty, ErrorNote, fmtDate, fmtDateTime, Loading, money, orderStatus, PageTitle, paymentStatus, toCsv, useLoad, useToast } from '../ui';

type View = 'upcoming' | 'new' | 'all' | 'past';

const views: { id: View; label: string }[] = [
  { id: 'upcoming', label: 'Próximos' },
  { id: 'new', label: 'Por confirmar' },
  { id: 'past', label: 'Pasados' },
  { id: 'all', label: 'Todos' },
];

const statusTone = (s: OrderStatus) => (s === 'received' ? 'blush' : s === 'cancelled' ? 'danger' : s === 'completed' ? 'neutral' : 'sage');

export default function Orders() {
  const { data, setData, error, loading, reload } = useLoad(listOrders);
  const [view, setView] = useState<View>('upcoming');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const today = toISO(new Date());
  const list = useMemo(() => {
    let l = data ?? [];
    if (view === 'upcoming') l = l.filter((o) => o.fulfillment_date >= today && !['completed', 'cancelled'].includes(o.status)).sort((a, b) => a.fulfillment_date.localeCompare(b.fulfillment_date));
    if (view === 'new') l = l.filter((o) => o.status === 'received');
    if (view === 'past') l = l.filter((o) => o.fulfillment_date < today || o.status === 'completed');
    const t = q.trim().toLowerCase();
    if (t) l = l.filter((o) => [o.order_number, o.customer_name, o.email, o.phone].join(' ').toLowerCase().includes(t));
    return l;
  }, [data, view, q, today]);

  const open = data?.find((o) => o.id === openId) ?? null;

  const patch = (id: string, p: Partial<OrderRecord>) => setData((prev) => prev?.map((o) => (o.id === id ? { ...o, ...p } : o)) ?? null);

  return (
    <>
      <PageTitle
        title="Pedidos"
        subtitle="Confirma pedidos, marca su avance y registra los pagos."
        actions={
          <button
            className="btn btn--outline btn--sm"
            disabled={!data?.length}
            onClick={() =>
              downloadFile(
                `pedidos-${today}.csv`,
                toCsv(
                  (data ?? []).map((o) => ({
                    pedido: o.order_number,
                    fecha: o.fulfillment_date,
                    hora: o.time_slot,
                    tipo: o.fulfillment === 'pickup' ? 'Recogida' : 'Envío',
                    cliente: o.customer_name,
                    email: o.email,
                    telefono: o.phone,
                    productos: o.order_items.map((i) => `${i.quantity}x ${i.product_name} (${i.size_label})`).join('; '),
                    total: o.total,
                    estado: orderStatus[o.status],
                    pago: paymentStatus[o.payment_status],
                  })),
                ),
              )
            }
          >
            <Icon name="upload" className="rot-180" /> Exportar CSV
          </button>
        }
      />

      <div className="adm-toolbar">
        <div className="adm-tabs" role="tablist">
          {views.map((v) => (
            <button key={v.id} role="tab" aria-selected={view === v.id} className={`adm-tab${view === v.id ? ' is-active' : ''}`} onClick={() => setView(v.id)}>
              {v.label}
              {v.id === 'new' && data && <span className="adm-tab__count">{data.filter((o) => o.status === 'received').length}</span>}
            </button>
          ))}
        </div>
        <input className="input adm-search" type="search" placeholder="Buscar por cliente, email o nº de pedido" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading && !data ? (
        <Loading />
      ) : error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <Empty>No hay pedidos en esta vista.</Empty>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Para</th>
                <th>Cliente</th>
                <th>Productos</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} onClick={() => setOpenId(o.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpenId(o.id)}>
                  <td data-label="Pedido">
                    <strong>{o.order_number}</strong>
                    <span className="adm-muted adm-small">{fmtDateTime(o.created_at)}</span>
                  </td>
                  <td data-label="Para">
                    {fmtDate(o.fulfillment_date)}
                    <span className="adm-muted adm-small">
                      {o.fulfillment === 'pickup' ? 'Recogida' : 'Envío'} · {o.time_slot}
                    </span>
                  </td>
                  <td data-label="Cliente">
                    {o.customer_name}
                    <span className="adm-muted adm-small">{o.phone}</span>
                  </td>
                  <td data-label="Productos" className="adm-small">
                    {o.order_items.map((i) => `${i.quantity}× ${i.product_name}`).join(', ')}
                  </td>
                  <td data-label="Total">
                    {money(o.total)}
                    <span className={`adm-small ${o.payment_status === 'paid' ? 'adm-ok' : 'adm-muted'}`}>{paymentStatus[o.payment_status]}</span>
                  </td>
                  <td data-label="Estado">
                    <Badge tone={statusTone(o.status)}>{orderStatus[o.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <OrderDrawer order={open} onClose={() => setOpenId(null)} onChange={patch} />
    </>
  );
}

function OrderDrawer({ order, onClose, onChange }: { order: OrderRecord | null; onClose: () => void; onChange: (id: string, p: Partial<OrderRecord>) => void }) {
  const toast = useToast();
  const [notes, setNotes] = useState('');
  const [notesFor, setNotesFor] = useState<string | null>(null);
  if (order && notesFor !== order.id) {
    setNotesFor(order.id);
    setNotes(order.admin_notes ?? '');
  }

  if (!order) return null;

  const save = async (p: Partial<Pick<OrderRecord, 'status' | 'payment_status' | 'admin_notes'>>, msg = 'Pedido actualizado') => {
    try {
      await updateOrder(order.id, p);
      onChange(order.id, p);
      toast(msg);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    }
  };

  const steps: OrderStatus[] = ['received', 'confirmed', 'baking', 'ready', 'completed'];
  const greeting = encodeURIComponent(`Hola ${order.customer_name.split(' ')[0]},\n\nGracias por tu pedido ${order.order_number} en Sweet Daisy.\n\n`);

  return (
    <Drawer open title={`Pedido ${order.order_number}`} onClose={onClose}>
      <div className="adm-steps">
        {steps.map((s) => (
          <button key={s} className={`adm-step${order.status === s ? ' is-active' : ''}${steps.indexOf(order.status) > steps.indexOf(s) ? ' is-done' : ''}`} onClick={() => save({ status: s })}>
            {orderStatus[s]}
          </button>
        ))}
      </div>

      <dl className="adm-dl">
        <div>
          <dt>{order.fulfillment === 'pickup' ? 'Recogida' : 'Envío'}</dt>
          <dd>
            {fmtDate(order.fulfillment_date, { weekday: 'long', day: 'numeric', month: 'long' })} · {order.time_slot}
          </dd>
        </div>
        {order.address && (
          <div>
            <dt>Dirección</dt>
            <dd>
              {order.address.line1}
              {order.address.line2 ? `, ${order.address.line2}` : ''}, {order.address.city} {order.address.postal}
            </dd>
          </div>
        )}
        <div>
          <dt>Cliente</dt>
          <dd>
            {order.customer_name}
            <br />
            <a href={`mailto:${order.email}?subject=${encodeURIComponent(`Tu pedido ${order.order_number}`)}&body=${greeting}`}>{order.email}</a> ·{' '}
            <a href={`tel:${order.phone}`}>{order.phone}</a>
          </dd>
        </div>
        {order.instructions && (
          <div>
            <dt>Instrucciones del cliente</dt>
            <dd>{order.instructions}</dd>
          </div>
        )}
      </dl>

      <h3 className="adm-h3">Productos</h3>
      <ul className="adm-items">
        {order.order_items.map((i, k) => (
          <li key={k}>
            <div>
              <strong>
                {i.quantity}× {i.product_name}
              </strong>
              <span className="adm-muted adm-small">{[i.size_label, i.flavor, i.decoration].filter(Boolean).join(' · ')}</span>
              {i.message && <span className="adm-small">Mensaje: “{i.message}”</span>}
              {i.notes && <span className="adm-small">Notas: {i.notes}</span>}
            </div>
            <span>{money(i.line_total)}</span>
          </li>
        ))}
        <li className="adm-items__total">
          <span>Subtotal {order.delivery_fee > 0 && `+ envío ${money(order.delivery_fee)}`}</span>
          <strong>{money(order.total)}</strong>
        </li>
      </ul>

      <div className="adm-form-grid">
        <label className="adm-field">
          <span className="adm-field__label">Estado</span>
          <select className="select" value={order.status} onChange={(e) => save({ status: e.target.value as OrderStatus })}>
            {Object.entries(orderStatus).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Pago ({order.payment_method === 'card' ? 'tarjeta / enlace' : 'en persona'})</span>
          <select className="select" value={order.payment_status} onChange={(e) => save({ payment_status: e.target.value as PaymentStatus })}>
            {Object.entries(paymentStatus).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="adm-field adm-field--wide">
          <span className="adm-field__label">Notas internas</span>
          <textarea className="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Solo las ve tu equipo" />
        </label>
      </div>
      <button className="btn btn--sm" disabled={notes === (order.admin_notes ?? '')} onClick={() => save({ admin_notes: notes || null }, 'Notas guardadas')}>
        Guardar notas
      </button>
    </Drawer>
  );
}
