import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import type { User } from '@supabase/supabase-js';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { Seo } from '../components/Seo';
import { formatPrice } from '../data/products';
import { fetchMyOrders, sendMagicLink, type OrderSummary } from '../lib/api';
import { formatDate } from '../lib/availability';
import { supabase } from '../lib/supabase';

export default function Account() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

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
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <>
      <Seo title="Account" path="/account" />
      <meta name="robots" content="noindex" />
      <PageHeader eyebrow="Account" title={user ? 'Welcome back.' : 'Your account'} crumbs={[{ label: 'Account' }]} />
      <section className="container container--narrow account">
        {user ? (
          <>
            <div className="account__bar">
              <p className="muted">
                Signed in as <strong>{user.email}</strong>
              </p>
              <button className="link" onClick={() => supabase?.auth.signOut()}>
                Sign out
              </button>
            </div>
            <h2 className="account__title">Your orders</h2>
            {orders === null ? (
              <p className="muted">Loading…</p>
            ) : orders.length === 0 ? (
              <div className="empty empty--left">
                <p className="muted">No orders yet. Orders placed with this email while signed in will appear here.</p>
                <Link to="/shop" className="btn">
                  Shop Cakes
                </Link>
              </div>
            ) : (
              <ul className="orders">
                {orders.map((o) => (
                  <li key={o.order_number} className="order">
                    <div className="order__head">
                      <span className="serif order__no">{o.order_number}</span>
                      <span className={`order__status is-${o.status}`}>{o.status}</span>
                    </div>
                    <p className="small muted">
                      {o.fulfillment === 'pickup' ? 'Pickup' : 'Delivery'} · {formatDate(o.fulfillment_date)} · {formatPrice(Number(o.total))}
                    </p>
                    <p className="small">{o.order_items.map((i) => `${i.quantity}× ${i.product_name} (${i.size_label})`).join(', ')}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div className="account__signin">
            <p className="lead">Sign in with a secure link — no password needed. Track your orders and check out faster.</p>
            {state === 'sent' ? (
              <p className="notice" role="status">
                <Icon name="mail" /> Check your inbox — we’ve sent a sign-in link to {email}.
              </p>
            ) : (
              <form className="newsletter__form" onSubmit={onSubmit}>
                <label htmlFor="acc-email" className="visually-hidden">
                  Email address
                </label>
                <input id="acc-email" className="input" type="email" placeholder="Email address" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <button className="btn" disabled={state === 'sending'}>
                  {state === 'sending' ? <span className="spinner" aria-label="Sending" /> : 'Email me a link'}
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
