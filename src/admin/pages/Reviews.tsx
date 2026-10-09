import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { Stars } from '../../components/Stars';
import { deleteReview, listReviews, setReviewStatus } from '../../lib/adminApi';
import type { ReviewRecord, ReviewStatus } from '../../lib/types';
import { Card, Empty, ErrorNote, fmtDateTime, Loading, PageTitle, useLoad, useToast } from '../ui';

const tabs: { id: ReviewStatus; label: string; empty: string }[] = [
  { id: 'pending', label: 'Por revisar', empty: 'No hay opiniones nuevas por revisar.' },
  { id: 'approved', label: 'Publicadas', empty: 'Aún no has publicado ninguna opinión.' },
  { id: 'hidden', label: 'Ocultas', empty: 'No hay opiniones ocultas.' },
];

export default function ReviewsAdmin() {
  const [tab, setTab] = useState<ReviewStatus>('pending');
  const toast = useToast();
  const { data, setData, error, loading, reload } = useLoad(listReviews);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;
  if (!data) return null;

  const shown = data.filter((r) => r.status === tab);

  async function move(r: ReviewRecord, status: ReviewStatus) {
    try {
      await setReviewStatus(r.id, status);
      setData(data!.map((x) => (x.id === r.id ? { ...x, status } : x)));
      toast(status === 'approved' ? 'Opinión publicada en la tienda' : status === 'hidden' ? 'Opinión ocultada' : 'Opinión movida a “Por revisar”');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  async function remove(r: ReviewRecord) {
    if (!confirm('¿Borrar esta opinión para siempre? El cliente podrá dejar otra para el mismo pedido.')) return;
    try {
      await deleteReview(r.id);
      setData(data!.filter((x) => x.id !== r.id));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  return (
    <>
      <PageTitle
        title="Opiniones"
        subtitle="Los clientes las dejan con su número de pedido y su correo. Solo aparecen en la tienda (inicio, página de opiniones y la ficha de cada producto) cuando las publicas."
      />

      <div className="adm-toolbar">
        <div className="adm-tabs" role="tablist">
          {tabs.map((x) => (
            <button key={x.id} role="tab" aria-selected={tab === x.id} className={`adm-tab${tab === x.id ? ' is-active' : ''}`} onClick={() => setTab(x.id)}>
              {x.label} <span className="adm-tab__count">{data.filter((r) => r.status === x.id).length}</span>
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <Empty>{tabs.find((x) => x.id === tab)!.empty}</Empty>
      ) : (
        <div className="stack">
          {shown.map((r) => (
            <Card
              key={r.id}
              title={
                <>
                  <Stars value={r.rating} className="adm-stars" /> {r.name}{' '}
                  <span className="adm-muted adm-small">
                    · {r.orders?.order_number ?? 'Pedido'} · {fmtDateTime(r.created_at)} · {r.lang === 'es' ? 'Español' : 'Inglés'}
                  </span>
                </>
              }
              actions={
                <div className="adm-actions">
                  {r.status !== 'approved' && (
                    <button className="btn btn--sm" onClick={() => move(r, 'approved')}>
                      <Icon name="check" /> Publicar
                    </button>
                  )}
                  {r.status !== 'hidden' && (
                    <button className="btn btn--outline btn--sm" onClick={() => move(r, 'hidden')}>
                      Ocultar
                    </button>
                  )}
                  <button className="icon-btn" aria-label="Borrar opinión" onClick={() => remove(r)}>
                    <Icon name="trash" />
                  </button>
                </div>
              }
            >
              <p className="adm-pre">{r.comment}</p>
              {r.orders && (
                <p className="adm-muted adm-small">
                  {r.orders.customer_name} · {r.orders.email}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
