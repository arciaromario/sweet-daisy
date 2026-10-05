import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { AvailabilityCalendar } from '../components/AvailabilityCalendar';
import { Icon } from '../components/Icon';
import { Img } from '../components/Img';
import { Logo } from '../components/Logo';
import { Seo } from '../components/Seo';
import { deliveryFee, useCart } from '../context/CartContext';
import { useCatalog, useSite } from '../context/CatalogContext';
import { formatPrice } from '../data/products';
import { placeOrder, type PlacedOrder } from '../lib/api';
import { firstAvailable, formatDate } from '../lib/availability';
import { supabase } from '../lib/supabase';

type Method = 'pickup' | 'delivery';

export default function Checkout() {
  const cart = useCart();
  const { overrides, demo, settings } = useCatalog();
  const site = useSite();
  const closed = settings.store.closedWeekdays;
  const [method, setMethod] = useState<Method>('pickup');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [payment, setPayment] = useState<'card' | 'in_person'>('card');
  const [form, setForm] = useState({ name: '', email: '', phone: '', line1: '', line2: '', city: site.address.city, postal: '', instructions: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [sending, setSending] = useState(false);
  const [placed, setPlaced] = useState<(PlacedOrder & { date: string; slot: string; method: Method; email: string }) | null>(null);

  // Prefill the email for signed-in customers.
  useEffect(() => {
    supabase?.auth.getUser().then(({ data }) => {
      if (data.user?.email) setForm((f) => (f.email ? f : { ...f, email: data.user!.email! }));
    });
  }, []);

  useEffect(() => {
    if (!date) setDate(firstAvailable(overrides, cart.maxLeadDays, closed));
  }, [overrides, cart.maxLeadDays, closed, date]);

  const fee = deliveryFee(cart.subtotal, method, settings.store);
  const total = cart.subtotal + fee;
  const slots = method === 'pickup' ? settings.store.pickupSlots : settings.store.deliverySlots;
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors(({ [k]: _, ...rest }) => rest);
  };

  const err = useMemo(
    () => (k: string) =>
      errors[k] ? (
        <span className="field__error" id={`err-${k}`}>
          {errors[k]}
        </span>
      ) : null,
    [errors],
  );

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Please enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Please enter a valid email.';
    if (form.phone.replace(/\D/g, '').length < 7) e.phone = 'Please enter a phone number we can reach you on.';
    if (method === 'delivery') {
      if (!form.line1.trim()) e.line1 = 'Please enter your street address.';
      if (!form.city.trim()) e.city = 'Please enter your city.';
      if (!form.postal.trim()) e.postal = 'Please enter your ZIP code.';
    }
    if (!date) e.date = 'Please choose a date.';
    if (!slot) e.slot = 'Please choose a time.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setSubmitError('');
    if (!validate()) {
      document.querySelector<HTMLElement>('[aria-invalid="true"], .slot-error')?.focus();
      return;
    }
    setSending(true);
    try {
      const result = await placeOrder(
        {
          customer_name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          fulfillment: method,
          address: method === 'delivery' ? { line1: form.line1, line2: form.line2, city: form.city, postal: form.postal } : undefined,
          fulfillment_date: date,
          time_slot: slot,
          instructions: form.instructions.trim() || undefined,
          payment_method: payment,
          items: cart.items,
        },
        settings,
      );
      setPlaced({ ...result, date, slot, method, email: form.email.trim() });
      cart.clear();
      window.scrollTo({ top: 0 });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'We couldn’t place your order. Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (placed) {
    return (
      <div className="checkout-shell">
        <Seo title="Order confirmed" path="/checkout" />
        <CheckoutHeader />
        <section className="container container--narrow confirm" role="status">
          <span className="builder__done-icon">
            <Icon name="check" />
          </span>
          <span className="eyebrow eyebrow--plain">Order {placed.orderNumber}</span>
          <h1>Thank you — your order is in the oven.</h1>
          <p className="lead">
            We’ve sent a confirmation to <strong>{placed.email}</strong>. Your treats will be ready for {placed.method} on{' '}
            <strong>{formatDate(placed.date)}</strong>, {placed.slot}.
          </p>
          <div className="confirm__card">
            <div className="summary-row">
              <span>{placed.method === 'pickup' ? 'Pickup from' : 'Delivery'}</span>
              <span>{placed.method === 'pickup' ? `${site.address.street}, ${site.address.city}` : 'To your address'}</span>
            </div>
            <div className="summary-row summary-row--total">
              <span>Total</span>
              <span className="price">{formatPrice(placed.total)}</span>
            </div>
            <p className="small muted">
              {payment === 'card'
                ? 'A secure payment link will follow by email to complete your order.'
                : `Payment is due at ${placed.method}. We accept card and contactless.`}
            </p>
          </div>
          {demo && <p className="small muted">Demo mode — this order was not saved. Connect Supabase to receive real orders.</p>}
          <div className="hero__ctas">
            <Link to="/shop" className="btn">
              Continue shopping
            </Link>
            <Link to="/account" className="btn btn--outline">
              View my orders
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="checkout-shell">
        <Seo title="Checkout" path="/checkout" />
        <CheckoutHeader />
        <section className="container empty">
          <p className="serif empty__title">Your bag is empty.</p>
          <Link to="/shop" className="btn">
            Shop Cakes
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="checkout-shell">
      <Seo title="Checkout" path="/checkout" />
      <meta name="robots" content="noindex" />
      <CheckoutHeader />

      <form className="container checkout" onSubmit={onSubmit} noValidate>
        <div className="checkout__main">
          <h1 className="checkout__title">Checkout</h1>

          {/* 1. Customer */}
          <fieldset className="checkout__section">
            <legend>
              <span className="checkout__n">1</span> Customer information
            </legend>
            <div className="form-grid form-grid--2">
              <div className="field span-2">
                <label className="field__label" htmlFor="c-name">
                  Full name
                </label>
                <input id="c-name" className="input" autoComplete="name" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} aria-describedby="err-name" />
                {err('name')}
              </div>
              <div className="field">
                <label className="field__label" htmlFor="c-email">
                  Email
                </label>
                <input id="c-email" className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} aria-describedby="err-email" />
                {err('email')}
              </div>
              <div className="field">
                <label className="field__label" htmlFor="c-phone">
                  Phone
                </label>
                <input id="c-phone" className="input" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} aria-invalid={!!errors.phone} aria-describedby="err-phone" />
                {err('phone')}
              </div>
            </div>
          </fieldset>

          {/* 2. Delivery or pickup */}
          <fieldset className="checkout__section">
            <legend>
              <span className="checkout__n">2</span> Delivery or pickup
            </legend>
            <div className="method">
              {(['pickup', 'delivery'] as const).map((m) => (
                <label key={m} className="option method__opt">
                  <input
                    type="radio"
                    name="method"
                    checked={method === m}
                    onChange={() => {
                      setMethod(m);
                      setSlot('');
                    }}
                  />
                  <Icon name={m === 'pickup' ? 'store' : 'truck'} />
                  <span className="option__title">{m === 'pickup' ? 'Studio pickup' : 'Local delivery'}</span>
                  <span className="option__meta">
                    {m === 'pickup'
                      ? `${site.address.street}, ${site.address.city}`
                      : `${site.delivery.radius} · ${cart.subtotal >= site.delivery.freeOver ? 'Free' : formatPrice(site.delivery.fee)}`}
                  </span>
                </label>
              ))}
            </div>
            {method === 'delivery' && (
              <div className="form-grid form-grid--2 checkout__address">
                <div className="field span-2">
                  <label className="field__label" htmlFor="c-line1">
                    Street address
                  </label>
                  <input id="c-line1" className="input" autoComplete="address-line1" value={form.line1} onChange={set('line1')} aria-invalid={!!errors.line1} aria-describedby="err-line1" />
                  {err('line1')}
                </div>
                <div className="field span-2">
                  <label className="field__label" htmlFor="c-line2">
                    Apartment, suite <span className="opt-group__hint">Optional</span>
                  </label>
                  <input id="c-line2" className="input" autoComplete="address-line2" value={form.line2} onChange={set('line2')} />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="c-city">
                    City
                  </label>
                  <input id="c-city" className="input" autoComplete="address-level2" value={form.city} onChange={set('city')} aria-invalid={!!errors.city} aria-describedby="err-city" />
                  {err('city')}
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="c-postal">
                    ZIP code
                  </label>
                  <input id="c-postal" className="input" autoComplete="postal-code" inputMode="numeric" value={form.postal} onChange={set('postal')} aria-invalid={!!errors.postal} aria-describedby="err-postal" />
                  {err('postal')}
                </div>
              </div>
            )}
          </fieldset>

          {/* 3. Date & time */}
          <fieldset className="checkout__section">
            <legend>
              <span className="checkout__n">3</span> Date and time
            </legend>
            <div className="checkout__when">
              <AvailabilityCalendar leadDays={cart.maxLeadDays} value={date} onChange={setDate} label={`Choose a ${method} date`} />
              <div className="stack">
                {date && (
                  <p className="builder__picked">
                    <Icon name="calendar" /> {formatDate(date)}
                  </p>
                )}
                {err('date')}
                <div className="field">
                  <span className="field__label" id="slot-label">
                    {method === 'pickup' ? 'Pickup time' : 'Delivery window'}
                  </span>
                  <div className="slots" role="radiogroup" aria-labelledby="slot-label">
                    {slots.map((t) => (
                      <button
                        type="button"
                        key={t}
                        role="radio"
                        aria-checked={slot === t}
                        className={`chip${slot === t ? ' is-active' : ''}`}
                        onClick={() => {
                          setSlot(t);
                          setErrors(({ slot: _, ...rest }) => rest);
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {errors.slot && (
                    <span className="field__error slot-error" tabIndex={-1}>
                      {errors.slot}
                    </span>
                  )}
                </div>
                {cart.maxLeadDays > 0 && (
                  <p className="small muted">
                    Some items in your bag need {cart.maxLeadDays} {cart.maxLeadDays === 1 ? 'day' : 'days'} notice, so earlier dates are unavailable.
                  </p>
                )}
              </div>
            </div>
          </fieldset>

          {/* 4. Payment */}
          <fieldset className="checkout__section">
            <legend>
              <span className="checkout__n">4</span> Payment
            </legend>
            <div className="method">
              <label className="option method__opt">
                <input type="radio" name="payment" checked={payment === 'card'} onChange={() => setPayment('card')} />
                <Icon name="card" />
                <span className="option__title">Pay online by card</span>
                <span className="option__meta">Secure payment link sent with your confirmation</span>
              </label>
              <label className="option method__opt">
                <input type="radio" name="payment" checked={payment === 'in_person'} onChange={() => setPayment('in_person')} />
                <Icon name="store" />
                <span className="option__title">Pay at {method}</span>
                <span className="option__meta">Card or contactless</span>
              </label>
            </div>
            <p className="checkout__secure small muted">
              <Icon name="lock" /> Payments are processed securely. We never store your card details.
            </p>
          </fieldset>

          {/* 5. Instructions */}
          <fieldset className="checkout__section">
            <legend>
              <span className="checkout__n">5</span> Special instructions
            </legend>
            <div className="field">
              <label className="field__label" htmlFor="c-notes">
                Notes for the studio <span className="opt-group__hint">Optional</span>
              </label>
              <textarea
                id="c-notes"
                className="textarea"
                maxLength={800}
                placeholder="Allergies, delivery access, a surprise to keep secret…"
                value={form.instructions}
                onChange={set('instructions')}
              />
            </div>
          </fieldset>
        </div>

        {/* Order summary */}
        <aside className="checkout__summary" aria-label="Order summary">
          <div className="summary-card">
            <h2 className="summary-card__title">Order summary</h2>
            <ul className="mini-lines">
              {cart.items.map((i) => (
                <li key={i.key}>
                  <span className="mini-lines__img">
                    <Img src={i.image} alt="" ratio="1 / 1" width={160} sizes="64px" tint={i.tint} />
                    <span className="mini-lines__qty">{i.quantity}</span>
                  </span>
                  <span className="mini-lines__text">
                    <span>{i.name}</span>
                    <span className="small muted">{[i.sizeLabel, i.flavor, i.decorationLabel].filter(Boolean).join(' · ')}</span>
                    {i.message && <span className="small muted">“{i.message}”</span>}
                  </span>
                  <span className="price">{formatPrice(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <hr className="divider" />
            <div className="summary-row">
              <span>Subtotal</span>
              <span className="price">{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>{method === 'pickup' ? 'Pickup' : 'Delivery'}</span>
              <span>{fee ? formatPrice(fee) : 'Free'}</span>
            </div>
            <div className="summary-row summary-row--total">
              <span>Total</span>
              <span className="price">{formatPrice(total)}</span>
            </div>
            {submitError && (
              <p className="notice notice--error" role="alert">
                <Icon name="info" /> {submitError}
              </p>
            )}
            <button type="submit" className="btn btn--block" disabled={sending}>
              {sending ? <span className="spinner" aria-label="Placing order" /> : `Place order · ${formatPrice(total)}`}
            </button>
            <p className="small muted center">
              By placing your order you agree to our <Link to="/terms">terms</Link>.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function CheckoutHeader() {
  return (
    <header className="checkout-header">
      <div className="container checkout-header__inner">
        <Link to="/cart" className="link">
          <Icon name="arrowLeft" /> <span className="checkout-header__back">Back to bag</span>
        </Link>
        <Logo />
        <span className="checkout-header__secure small">
          <Icon name="lock" /> <span>Secure checkout</span>
        </span>
      </div>
    </header>
  );
}
