import { useEffect, useMemo, useState } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { deleteRequest, inspirationUrls, listRequests, updateRequest } from '../../lib/adminApi';
import type { CustomRequestRecord, RequestStatus } from '../../lib/types';
import { Badge, Drawer, Empty, ErrorNote, fmtDate, fmtDateTime, Loading, money, PageTitle, requestStatus, useLoad, useToast } from '../ui';

const tone = (s: RequestStatus) => (s === 'new' ? 'gold' : s === 'confirmed' ? 'sage' : s === 'declined' ? 'danger' : 'neutral');

export default function Requests() {
  const { data, setData, error, loading, reload } = useLoad(listRequests);
  const [filter, setFilter] = useState<RequestStatus | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => (data ?? []).filter((r) => filter === 'all' || r.status === filter), [data, filter]);
  const open = data?.find((r) => r.id === openId) ?? null;

  return (
    <>
      <PageTitle title="Pasteles personalizados" subtitle="Solicitudes enviadas desde el diseñador de pasteles. Responde con un presupuesto y confirma la fecha." />

      <div className="adm-toolbar">
        <div className="adm-tabs" role="tablist">
          {(['all', 'new', 'quoted', 'confirmed', 'declined'] as const).map((s) => (
            <button key={s} role="tab" aria-selected={filter === s} className={`adm-tab${filter === s ? ' is-active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? 'Todas' : requestStatus[s]}
              {s === 'new' && data && <span className="adm-tab__count">{data.filter((r) => r.status === 'new').length}</span>}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <Loading />
      ) : error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <Empty>No hay solicitudes en esta vista.</Empty>
      ) : (
        <div className="adm-cards">
          {list.map((r) => (
            <button key={r.id} className="adm-req" onClick={() => setOpenId(r.id)}>
              <div className="adm-req__top">
                <strong>{r.name}</strong>
                <Badge tone={tone(r.status)}>{requestStatus[r.status]}</Badge>
              </div>
              <p className="adm-req__event">
                {r.occasion ?? 'Evento'} · {fmtDate(r.event_date, { weekday: 'short', day: 'numeric', month: 'long' })}
              </p>
              <p className="adm-muted adm-small">
                {r.size} · {r.flavor} · {r.filling} · {r.frosting} · {r.decoration_style}
              </p>
              <p className="adm-small adm-muted">
                Recibida {fmtDateTime(r.created_at)}
                {r.quote_amount != null && ` · Presupuesto ${money(r.quote_amount)}`}
                {r.inspiration_paths.length > 0 && ` · ${r.inspiration_paths.length} foto(s)`}
              </p>
            </button>
          ))}
        </div>
      )}

      <RequestDrawer
        request={open}
        onClose={() => setOpenId(null)}
        onChange={(id, p) => setData((prev) => prev?.map((r) => (r.id === id ? { ...r, ...p } : r)) ?? null)}
        onDelete={(id) => {
          setOpenId(null);
          setData((prev) => prev?.filter((r) => r.id !== id) ?? null);
        }}
      />
    </>
  );
}

function RequestDrawer({
  request,
  onClose,
  onChange,
  onDelete,
}: {
  request: CustomRequestRecord | null;
  onClose: () => void;
  onChange: (id: string, p: Partial<CustomRequestRecord>) => void;
  onDelete: (id: string) => void;
}) {
  const toast = useToast();
  const { demo, settings } = useCatalog();
  const [quote, setQuote] = useState('');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!request) return;
    setQuote(request.quote_amount != null ? String(request.quote_amount) : '');
    setNotes(request.admin_notes ?? '');
    setImages([]);
    inspirationUrls(request.inspiration_paths)
      .then(setImages)
      .catch(() => setImages([]));
  }, [request?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!request) return null;

  const save = async (p: Partial<Pick<CustomRequestRecord, 'status' | 'quote_amount' | 'admin_notes'>>, msg = 'Solicitud actualizada') => {
    try {
      await updateRequest(request.id, p);
      onChange(request.id, p);
      toast(msg);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo guardar', 'error');
    }
  };

  const amount = Number(quote);
  const deposit = amount ? Math.round(amount * settings.custom.depositPercent) / 100 : 0;
  const body = encodeURIComponent(
    `Hola ${request.name.split(' ')[0]},\n\n¡Gracias por pensar en Sweet Daisy para tu ${request.occasion?.toLowerCase() ?? 'celebración'}!\n\n` +
      `Tu pastel: ${request.size}, bizcocho ${request.flavor}, relleno de ${request.filling}, cobertura ${request.frosting}, estilo ${request.decoration_style}.\n` +
      (amount ? `Presupuesto: ${money(amount)}. Para reservar la fecha (${fmtDate(request.event_date, { day: 'numeric', month: 'long' })}) pedimos un depósito del ${settings.custom.depositPercent}% (${money(deposit)}).\n\n` : '\n') +
      `Un abrazo,\nSweet Daisy`,
  );

  return (
    <Drawer open title={`Solicitud de ${request.name}`} onClose={onClose}>
      <dl className="adm-dl">
        <div>
          <dt>Evento</dt>
          <dd>
            {request.occasion ?? '—'} · {fmtDate(request.event_date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </dd>
        </div>
        <div>
          <dt>Pastel</dt>
          <dd>
            {request.size}
            <br />
            Bizcocho: {request.flavor}
            <br />
            Relleno: {request.filling}
            <br />
            Cobertura: {request.frosting}
            <br />
            Decoración: {request.decoration_style}
          </dd>
        </div>
        {request.instructions && (
          <div>
            <dt>Instrucciones</dt>
            <dd className="adm-pre">{request.instructions}</dd>
          </div>
        )}
        <div>
          <dt>Contacto</dt>
          <dd>
            <a href={`mailto:${request.email}?subject=${encodeURIComponent('Tu pastel personalizado de Sweet Daisy')}&body=${body}`}>{request.email}</a>
            {request.phone && (
              <>
                {' '}
                · <a href={`tel:${request.phone}`}>{request.phone}</a>
              </>
            )}
          </dd>
        </div>
      </dl>

      {request.inspiration_paths.length > 0 && (
        <>
          <h3 className="adm-h3">Fotos de inspiración</h3>
          {demo ? (
            <p className="adm-muted adm-small">En modo demo solo se guardan los nombres: {request.inspiration_paths.join(', ')}</p>
          ) : (
            <div className="adm-thumbs">
              {images.map((src, i) => (
                <a key={src} href={src} target="_blank" rel="noreferrer">
                  <img src={src} alt={`Inspiración ${i + 1}`} />
                </a>
              ))}
            </div>
          )}
        </>
      )}

      <div className="adm-form-grid">
        <label className="adm-field">
          <span className="adm-field__label">Estado</span>
          <select className="select" value={request.status} onChange={(e) => save({ status: e.target.value as RequestStatus })}>
            {Object.entries(requestStatus).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="adm-field">
          <span className="adm-field__label">Presupuesto (USD)</span>
          <input className="input" type="number" min={0} step="any" value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Ej. 180" />
          {deposit > 0 && (
            <span className="adm-field__hint">
              Depósito {settings.custom.depositPercent}%: {money(deposit)}
            </span>
          )}
        </label>
        <label className="adm-field adm-field--wide">
          <span className="adm-field__label">Notas internas</span>
          <textarea className="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ideas de diseño, conversación con el cliente…" />
        </label>
      </div>

      <div className="adm-actions">
        <button
          className="btn btn--sm"
          onClick={() =>
            save(
              { quote_amount: quote === '' ? null : amount, admin_notes: notes || null, status: quote !== '' && request.status === 'new' ? 'quoted' : request.status },
              'Guardado',
            )
          }
        >
          Guardar
        </button>
        <a className="btn btn--outline btn--sm" href={`mailto:${request.email}?subject=${encodeURIComponent('Tu pastel personalizado de Sweet Daisy')}&body=${body}`}>
          Responder por email
        </a>
        <button
          className="adm-link adm-danger"
          onClick={async () => {
            if (!confirm('¿Borrar esta solicitud definitivamente?')) return;
            try {
              await deleteRequest(request.id);
              onDelete(request.id);
              toast('Solicitud borrada');
            } catch (e) {
              toast(e instanceof Error ? e.message : 'No se pudo borrar', 'error');
            }
          }}
        >
          Borrar
        </button>
      </div>
    </Drawer>
  );
}
