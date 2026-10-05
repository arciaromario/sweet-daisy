import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../components/Icon';
import type { OrderStatus, PaymentStatus, RequestStatus } from '../lib/types';

/* ----------------------------------------------------------------------- labels */

export const orderStatus: Record<OrderStatus, string> = {
  received: 'Recibido',
  confirmed: 'Confirmado',
  baking: 'En preparación',
  ready: 'Listo',
  completed: 'Entregado',
  cancelled: 'Cancelado',
};

export const paymentStatus: Record<PaymentStatus, string> = {
  pending: 'Pago pendiente',
  paid: 'Pagado',
  refunded: 'Reembolsado',
};

export const requestStatus: Record<RequestStatus, string> = {
  new: 'Nueva',
  quoted: 'Presupuestada',
  confirmed: 'Confirmada',
  declined: 'Rechazada',
};

export const money = (n: number) => new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) => {
  const d = iso.length === 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return d.toLocaleDateString('es-ES', opts);
};

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/* ----------------------------------------------------------------------- toasts */

interface Toast {
  id: number;
  text: string;
  kind: 'ok' | 'error';
}

const ToastContext = createContext<(text: string, kind?: 'ok' | 'error') => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: 'ok' | 'error' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 6000 : 3000);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="adm-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`adm-toast adm-toast--${t.kind}`}>
            <Icon name={t.kind === 'ok' ? 'check' : 'info'} /> {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/* ------------------------------------------------------------------------ hooks */

/** Load data with loading/error state and a reload function. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fnRef.current());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, setData, error, loading, reload };
}

/* ------------------------------------------------------------------- primitives */

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="adm-title">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="adm-muted">{subtitle}</p>}
      </div>
      {actions && <div className="adm-title__actions">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = '' }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`adm-card ${className}`}>
      {(title || actions) && (
        <header className="adm-card__head">
          {title && <h2>{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function Badge({ tone = 'neutral', children }: { tone?: string; children: ReactNode }) {
  return <span className={`adm-badge adm-badge--${tone}`}>{children}</span>;
}

export function Loading() {
  return (
    <div className="adm-loading">
      <span className="spinner" /> Cargando…
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <p className="notice notice--error" role="alert">
      <Icon name="info" /> {message}{' '}
      {onRetry && (
        <button className="adm-link" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </p>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="adm-empty">{children}</p>;
}

export function Field({ label, hint, children, wide = false }: { label: string; hint?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`adm-field${wide ? ' adm-field--wide' : ''}`}>
      <span className="adm-field__label">{label}</span>
      {children}
      {hint && <span className="adm-field__hint">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="adm-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="adm-toggle__track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

/** Slide-over panel for details/editing. */
export function Drawer({ open, title, onClose, children, footer }: { open: boolean; title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (!open) return null;
  return (
    <div className="adm-drawer">
      <div className="adm-drawer__backdrop" onClick={onClose} />
      <div className="adm-drawer__panel" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        <header className="adm-drawer__head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </header>
        <div className="adm-drawer__body">{children}</div>
        {footer && <footer className="adm-drawer__foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function SaveBar({ dirty, saving, onSave, onReset }: { dirty: boolean; saving: boolean; onSave: () => void; onReset?: () => void }) {
  return (
    <div className={`adm-savebar${dirty ? ' is-dirty' : ''}`}>
      <span>{dirty ? 'Tienes cambios sin guardar' : 'Todo guardado'}</span>
      <div>
        {onReset && dirty && (
          <button className="btn btn--outline btn--sm" onClick={onReset} disabled={saving}>
            Descartar
          </button>
        )}
        <button className="btn btn--sm" onClick={onSave} disabled={!dirty || saving}>
          {saving ? <span className="spinner" aria-label="Guardando" /> : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- list editors */

/** Editable list of strings (flavours, fillings, time slots…). */
export function StringListEditor({ value, onChange, placeholder, addLabel = 'Añadir' }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; addLabel?: string }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
    setDraft('');
  };
  return (
    <div className="adm-list">
      <ul>
        {value.map((item, i) => (
          <li key={item + i}>
            <input className="input" value={item} onChange={(e) => onChange(value.map((v, j) => (j === i ? e.target.value : v)))} aria-label={`Elemento ${i + 1}`} />
            <MoveButtons index={i} length={value.length} onMove={(to) => onChange(move(value, i, to))} />
            <button type="button" className="icon-btn" aria-label={`Quitar ${item}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>
              <Icon name="trash" />
            </button>
          </li>
        ))}
      </ul>
      <div className="adm-list__add">
        <input
          className="input"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="btn btn--outline btn--sm" onClick={add}>
          <Icon name="plus" /> {addLabel}
        </button>
      </div>
    </div>
  );
}

export interface Column<T> {
  key: keyof T;
  label: string;
  type?: 'text' | 'number';
  width?: string;
  placeholder?: string;
  render?: (row: T, set: (patch: Partial<T>) => void) => ReactNode;
}

/** Editable table of objects (sizes, decorations, hours…). */
export function RowsEditor<T extends object>({ rows, columns, onChange, blank, addLabel = 'Añadir fila' }: { rows: T[]; columns: Column<T>[]; onChange: (rows: T[]) => void; blank: () => T; addLabel?: string }) {
  const setRow = (i: number, patch: Partial<T>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="adm-rows">
      <div className="adm-rows__head" style={{ gridTemplateColumns: gridCols(columns) }}>
        {columns.map((c) => (
          <span key={String(c.key)}>{c.label}</span>
        ))}
        <span />
      </div>
      {rows.map((row, i) => (
        <div key={i} className="adm-rows__row" style={{ gridTemplateColumns: gridCols(columns) }}>
          {columns.map((c) => (
            <div key={String(c.key)} className="adm-rows__cell" data-label={c.label}>
              {c.render ? (
                c.render(row, (patch) => setRow(i, patch))
              ) : (
                <input
                  className="input"
                  type={c.type === 'number' ? 'number' : 'text'}
                  step={c.type === 'number' ? 'any' : undefined}
                  min={c.type === 'number' ? 0 : undefined}
                  placeholder={c.placeholder}
                  value={String(row[c.key] ?? '')}
                  aria-label={c.label}
                  onChange={(e) => setRow(i, { [c.key]: c.type === 'number' ? Number(e.target.value) : e.target.value } as Partial<T>)}
                />
              )}
            </div>
          ))}
          <div className="adm-rows__actions">
            <MoveButtons index={i} length={rows.length} onMove={(to) => onChange(move(rows, i, to))} />
            <button type="button" className="icon-btn" aria-label="Quitar fila" onClick={() => onChange(rows.filter((_, j) => j !== i))}>
              <Icon name="trash" />
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn--outline btn--sm adm-rows__add" onClick={() => onChange([...rows, blank()])}>
        <Icon name="plus" /> {addLabel}
      </button>
    </div>
  );
}

const gridCols = (columns: { width?: string }[]) => `${columns.map((c) => c.width ?? '1fr').join(' ')} auto`;

export function MoveButtons({ index, length, onMove }: { index: number; length: number; onMove: (to: number) => void }) {
  return (
    <span className="adm-move">
      <button type="button" className="icon-btn" aria-label="Subir" disabled={index === 0} onClick={() => onMove(index - 1)}>
        <Icon name="chevronLeft" className="rot-90" />
      </button>
      <button type="button" className="icon-btn" aria-label="Bajar" disabled={index === length - 1} onClick={() => onMove(index + 1)}>
        <Icon name="chevronRight" className="rot-90" />
      </button>
    </span>
  );
}

export function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n');
}

export function downloadFile(name: string, content: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
