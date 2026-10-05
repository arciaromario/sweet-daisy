import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { deleteMessage, deleteSubscriber, listMessages, listSubscribers } from '../../lib/adminApi';
import { Card, downloadFile, Empty, ErrorNote, fmtDateTime, Loading, PageTitle, toCsv, useLoad, useToast } from '../ui';

export default function Inbox() {
  const [tab, setTab] = useState<'messages' | 'subscribers'>('messages');
  const toast = useToast();
  const { data, setData, error, loading, reload } = useLoad(async () => {
    const [messages, subscribers] = await Promise.all([listMessages(), listSubscribers()]);
    return { messages, subscribers };
  });

  if (loading && !data) return <Loading />;
  if (error) return <ErrorNote message={error} onRetry={reload} />;
  if (!data) return null;

  return (
    <>
      <PageTitle title="Mensajes y newsletter" subtitle="Lo que llega desde el formulario de contacto y las suscripciones a la Sweet List." />

      <div className="adm-toolbar">
        <div className="adm-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'messages'} className={`adm-tab${tab === 'messages' ? ' is-active' : ''}`} onClick={() => setTab('messages')}>
            Mensajes <span className="adm-tab__count">{data.messages.length}</span>
          </button>
          <button role="tab" aria-selected={tab === 'subscribers'} className={`adm-tab${tab === 'subscribers' ? ' is-active' : ''}`} onClick={() => setTab('subscribers')}>
            Newsletter <span className="adm-tab__count">{data.subscribers.length}</span>
          </button>
        </div>
        {tab === 'subscribers' && data.subscribers.length > 0 && (
          <button className="btn btn--outline btn--sm" onClick={() => downloadFile('newsletter.csv', toCsv(data.subscribers.map((s) => ({ email: s.email, fecha: s.created_at }))))}>
            Exportar CSV
          </button>
        )}
      </div>

      {tab === 'messages' ? (
        data.messages.length === 0 ? (
          <Empty>No hay mensajes.</Empty>
        ) : (
          <div className="stack">
            {data.messages.map((m) => (
              <Card
                key={m.id}
                title={
                  <>
                    {m.name} <span className="adm-muted adm-small">· {m.topic ?? 'General'} · {fmtDateTime(m.created_at)}</span>
                  </>
                }
                actions={
                  <div className="adm-actions">
                    <a className="btn btn--outline btn--sm" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.topic ?? 'Tu mensaje'} — Sweet Daisy`)}`}>
                      <Icon name="mail" /> Responder
                    </a>
                    <button
                      className="icon-btn"
                      aria-label="Borrar mensaje"
                      onClick={async () => {
                        if (!confirm('¿Borrar este mensaje?')) return;
                        try {
                          await deleteMessage(m.id);
                          setData({ ...data, messages: data.messages.filter((x) => x.id !== m.id) });
                        } catch (e) {
                          toast(e instanceof Error ? e.message : 'Error', 'error');
                        }
                      }}
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                }
              >
                <p className="adm-pre">{m.message}</p>
                <p className="adm-muted adm-small">{m.email}</p>
              </Card>
            ))}
          </div>
        )
      ) : data.subscribers.length === 0 ? (
        <Empty>Aún no hay suscriptores.</Empty>
      ) : (
        <Card>
          <ul className="adm-mini-list">
            {data.subscribers.map((s) => (
              <li key={s.email}>
                <div>
                  <strong>{s.email}</strong>
                  <span className="adm-muted">{fmtDateTime(s.created_at)}</span>
                </div>
                <button
                  className="adm-link"
                  onClick={async () => {
                    if (!confirm(`¿Quitar ${s.email} de la lista?`)) return;
                    try {
                      await deleteSubscriber(s.email);
                      setData({ ...data, subscribers: data.subscribers.filter((x) => x.email !== s.email) });
                    } catch (e) {
                      toast(e instanceof Error ? e.message : 'Error', 'error');
                    }
                  }}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
