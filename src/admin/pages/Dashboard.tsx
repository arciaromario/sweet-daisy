import { Link } from 'react-router';
import { Icon } from '../../components/Icon';
import { listMessages, listOrders, listProducts, listRequests } from '../../lib/adminApi';
import { toISO, addDays } from '../../lib/availability';
import { Badge, Card, Empty, ErrorNote, fmtDate, Loading, money, orderStatus, PageTitle, requestStatus, useLoad } from '../ui';

export default function Dashboard() {
  const { data, error, loading, reload } = useLoad(async () => {
    const [orders, requests, messages, products] = await Promise.all([listOrders(), listRequests(), listMessages(), listProducts()]);
    return { orders, requests, messages, products };
  });

  if (loading && !data) return <Loading />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;
  if (!data) return null;

  const today = toISO(new Date());
  const in7 = toISO(addDays(new Date(), 7));
  const monthStart = today.slice(0, 8) + '01';
  const active = data.orders.filter((o) => o.status !== 'cancelled');
  const upcoming = active
    .filter((o) => o.fulfillment_date >= today && o.fulfillment_date <= in7 && o.status !== 'completed')
    .sort((a, b) => a.fulfillment_date.localeCompare(b.fulfillment_date) || a.time_slot.localeCompare(b.time_slot));
  const newOrders = data.orders.filter((o) => o.status === 'received');
  const newRequests = data.requests.filter((r) => r.status === 'new');
  const monthRevenue = active.filter((o) => o.created_at.slice(0, 10) >= monthStart).reduce((n, o) => n + o.total, 0);

  const stats = [
    { label: 'Pedidos por confirmar', value: newOrders.length, to: 'pedidos', icon: 'bag' as const },
    { label: 'Solicitudes nuevas', value: newRequests.length, to: 'solicitudes', icon: 'gift' as const },
    { label: 'Entregas próximos 7 días', value: upcoming.length, to: 'pedidos', icon: 'calendar' as const },
    { label: 'Ventas este mes', value: money(monthRevenue), to: 'pedidos', icon: 'sparkle' as const },
  ];

  return (
    <>
      <PageTitle title="Resumen" subtitle={new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} />

      <div className="adm-stats">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="adm-stat">
            <Icon name={s.icon} />
            <span className="adm-stat__value">{s.value}</span>
            <span className="adm-stat__label">{s.label}</span>
          </Link>
        ))}
      </div>

      <div className="adm-grid-2">
        <Card title="Próximas recogidas y entregas" actions={<Link to="pedidos" className="adm-link">Ver pedidos</Link>}>
          {upcoming.length === 0 ? (
            <Empty>No hay entregas en los próximos 7 días.</Empty>
          ) : (
            <ul className="adm-mini-list">
              {upcoming.slice(0, 8).map((o) => (
                <li key={o.id}>
                  <div>
                    <strong>{fmtDate(o.fulfillment_date)}</strong> · {o.time_slot}
                    <span className="adm-muted">
                      {o.customer_name} · {o.order_items.map((i) => `${i.quantity}× ${i.product_name}`).join(', ')}
                    </span>
                  </div>
                  <Badge tone={o.fulfillment === 'delivery' ? 'blush' : 'sage'}>{o.fulfillment === 'delivery' ? 'Envío' : 'Recogida'}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Solicitudes de pasteles" actions={<Link to="solicitudes" className="adm-link">Ver todas</Link>}>
          {data.requests.length === 0 ? (
            <Empty>Aún no hay solicitudes.</Empty>
          ) : (
            <ul className="adm-mini-list">
              {data.requests.slice(0, 6).map((r) => (
                <li key={r.id}>
                  <div>
                    <strong>{r.name}</strong> · {r.occasion ?? 'Evento'} el {fmtDate(r.event_date)}
                    <span className="adm-muted">
                      {r.size} · {r.flavor} · {r.decoration_style}
                    </span>
                  </div>
                  <Badge tone={r.status === 'new' ? 'blush' : 'neutral'}>{requestStatus[r.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Últimos pedidos">
          {data.orders.length === 0 ? (
            <Empty>Aún no hay pedidos. Aparecerán aquí en cuanto alguien compre en la tienda.</Empty>
          ) : (
            <ul className="adm-mini-list">
              {data.orders.slice(0, 6).map((o) => (
                <li key={o.id}>
                  <div>
                    <strong>{o.order_number}</strong> · {o.customer_name}
                    <span className="adm-muted">
                      {money(o.total)} · para el {fmtDate(o.fulfillment_date)}
                    </span>
                  </div>
                  <Badge tone={o.status === 'received' ? 'blush' : o.status === 'cancelled' ? 'danger' : 'neutral'}>{orderStatus[o.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Accesos rápidos">
          <div className="adm-quick">
            <Link to="productos/nuevo" className="btn btn--outline btn--sm">
              <Icon name="plus" /> Nuevo producto
            </Link>
            <Link to="disponibilidad" className="btn btn--outline btn--sm">
              <Icon name="calendar" /> Bloquear un día
            </Link>
            <Link to="configuracion-pasteles" className="btn btn--outline btn--sm">
              <Icon name="heart" /> Precios de pasteles
            </Link>
            <Link to="mensajes" className="btn btn--outline btn--sm">
              <Icon name="mail" /> Mensajes ({data.messages.length})
            </Link>
          </div>
          <p className="adm-muted adm-small">
            {data.products.filter((p) => p.active !== false).length} productos visibles en la tienda ·{' '}
            {data.products.filter((p) => p.active === false).length} ocultos
          </p>
        </Card>
      </div>
    </>
  );
}
