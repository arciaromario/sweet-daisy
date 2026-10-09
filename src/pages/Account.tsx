import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import type { User } from '@supabase/supabase-js';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { Seo } from '../components/Seo';
import { formatPrice } from '../data/products';
import { fetchMyOrders, sendMagicLink, type OrderSummary } from '../lib/api';
import { formatDate, toISO } from '../lib/availability';
import { supabase } from '../lib/supabase';
import { useCopy } from '../i18n';

const en = {
  account: 'Account',
  welcome: 'Welcome back.',
  yourAccount: 'Your account',
  signedInAs: 'Signed in as',
  signOut: 'Sign out',
  orders: 'Your orders',
  loading: 'Loading…',
  noOrders: 'No orders yet. Orders placed with this email while signed in will appear here.',
  shop: 'Shop Cookies',
  status: {} as Record<string, string>,
  pickup: 'Pickup',
  delivery: 'Delivery',
  signinLead: 'Sign in with a secure link — no password needed. Track your orders and check out faster.',
  sent: (email: string) => `Check your inbox — we’ve sent a sign-in link to ${email}.`,
  email: 'Email address',
  sending: 'Sending',
  send: 'Email me a link',
  error: 'Something went wrong.',
  review: 'Leave a review',
};
const es: typeof en = {
  account: 'Cuenta',
  welcome: 'Qué gusto verte de nuevo.',
  yourAccount: 'Tu cuenta',
  signedInAs: 'Sesión iniciada como',
  signOut: 'Cerrar sesión',
  orders: 'Tus pedidos',
  loading: 'Cargando…',
  noOrders: 'Aún no tienes pedidos. Aquí aparecerán los pedidos que hagas con este correo mientras tengas la sesión iniciada.',
  shop: 'Ver galletas',
  status: {
    received: 'recibido',
    confirmed: 'confirmado',
    baking: 'en el horno',
    ready: 'listo',
    completed: 'completado',
    cancelled: 'cancelado',
  },
  pickup: 'Recogida',
  delivery: 'Entrega a domicilio',
  signinLead: 'Inicia sesión con un enlace seguro, sin contraseña. Sigue tus pedidos y finaliza tus compras más rápido.',
  sent: (email) => `Revisa tu bandeja de entrada: te enviamos un enlace para iniciar sesión a ${email}.`,
  email: 'Correo electrónico',
  sending: 'Enviando',
  send: 'Envíame un enlace',
  error: 'Algo salió mal.',
  review: 'Deja tu opinión',
};

export default function Account() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const t = useCopy({ en, es });

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) fetchMyOrders().then(setOrders).catch(() => setOrders([]));
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setState('sending');
    try {
      await sendMagicLink(email);
      setState('sent');
    } catch (err) {
      setState('idle');
      setError(err instanceof Error ? err.message : t.error);
    }
  }

  return (
    <>
      <Seo title={t.account} path="/account" />
      <meta name="robots" content="noindex" />
      <PageHeader eyebrow={t.account} title={user ? t.welcome : t.yourAccount} crumbs={[{ label: t.account }]} />
      <section className="container container--narrow account">
        {user ? (
          <>
            <div className="account__bar">
              <p className="muted">
                {t.signedInAs} <strong>{user.email}</strong>
              </p>
              <button className="link" onClick={() => supabase?.auth.signOut()}>
                {t.signOut}
              </button>
            </div>
            <h2 className="account__title">{t.orders}</h2>
            {orders === null ? (
              <p className="muted">{t.loading}</p>
            ) : orders.length === 0 ? (
              <div className="empty empty--left">
                <p className="muted">{t.noOrders}</p>
                <Link to="/shop" className="btn">
                  {t.shop}
                </Link>
              </div>
            ) : (
              <ul className="orders">
                {orders.map((o) => (
                  <li key={o.order_number} className="order">
                    <div className="order__head">
                      <span className="serif order__no">{o.order_number}</span>
                      <span className={`order__status is-${o.status}`}>{t.status[o.status] ?? o.status}</span>
                    </div>
                    <p className="small muted">
                      {o.fulfillment === 'pickup' ? t.pickup : t.delivery} · {formatDate(o.fulfillment_date)} · {formatPrice(Number(o.total))}
                    </p>
                    <p className="small">{o.order_items.map((i) => `${i.quantity}× ${i.product_name} (${i.size_label})`).join(', ')}</p>
                    {o.status !== 'cancelled' && o.fulfillment_date <= toISO(new Date()) && (
                      <Link to={`/reviews?order=${encodeURIComponent(o.order_number)}&email=${encodeURIComponent(user.email ?? '')}#write`} className="link order__review">
                        <Icon name="star" /> {t.review}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div className="account__signin">
            <p className="lead">{t.signinLead}</p>
            {state === 'sent' ? (
              <p className="notice" role="status">
                <Icon name="mail" /> {t.sent(email)}
              </p>
            ) : (
              <form className="newsletter__form" onSubmit={onSubmit}>
                <label htmlFor="acc-email" className="visually-hidden">
                  {t.email}
                </label>
                <input id="acc-email" className="input" type="email" placeholder={t.email} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <button className="btn" disabled={state === 'sending'}>
                  {state === 'sending' ? <span className="spinner" aria-label={t.sending} /> : t.send}
                </button>
              </form>
            )}
            {error && (
              <p className="notice notice--error" role="alert">
                <Icon name="info" /> {error}
              </p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
