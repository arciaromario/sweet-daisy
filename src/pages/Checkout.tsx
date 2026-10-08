import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AvailabilityCalendar } from '../components/AvailabilityCalendar';
import { Icon } from '../components/Icon';
import { Img } from '../components/Img';
import { Logo } from '../components/Logo';
import { Seo } from '../components/Seo';
import { deliveryFee, useCart } from '../context/CartContext';
import { useCatalog, useSite } from '../context/CatalogContext';
import { formatPrep, formatPrice } from '../data/products';
import { placeOrder, startCardPayment, type PlacedOrder } from '../lib/api';
import { dayStatus, firstAvailable, formatDate, isBookable, parseISO } from '../lib/availability';
import { supabase } from '../lib/supabase';
import { useCopy } from '../i18n';

type FieldKey = 'name' | 'email' | 'phone' | 'line1' | 'city' | 'postal' | 'date' | 'slot';

const en = {
  // Validation: the full message under the field, and the short form used in the summary notice.
  errors: {
    name: 'Please enter your full name.',
    email: 'Please enter a valid email.',
    phone: 'Please enter a phone number we can reach you on.',
    line1: 'Please enter your street address.',
    city: 'Please enter your city.',
    postal: 'Please enter your ZIP code.',
    date: 'Please choose a date.',
    slot: 'Please choose a time.',
  } as Record<FieldKey, string>,
  short: {
    name: 'your full name',
    email: 'a valid email',
    phone: 'a phone number we can reach you on',
    line1: 'your street address',
    city: 'your city',
    postal: 'your ZIP code',
    date: 'a date',
    slot: 'a time',
  } as Record<FieldKey, string>,
  checkFields: (list: string) => `Please check the highlighted fields: ${list}.`,
  payOpenFailed: 'The payment page could not be opened.',
  placeFailed: 'We couldn’t place your order. Please try again.',
  // Confirmation
  seoPending: 'Complete your payment',
  seoConfirmed: 'Order confirmed',
  orderNo: (n: string) => `Order ${n}`,
  headPending: 'Your order is saved — payment is still pending.',
  headConfirmed: 'Thank you — your order is in the oven.',
  confirmLead: (unpaid: boolean, method: Method, date: string, slot: string) => (
    <>
      {unpaid ? 'We’ve reserved your order' : 'Your treats will be ready'} for {method} on <strong>{date}</strong>, {slot}.
    </>
  ),
  inTouch: (email: string) => (
    <>
      We’ll be in touch at <strong>{email}</strong>.
    </>
  ),
  paymentReceived: 'Your payment was received. We’ll be in touch by email with the details.',
  openingPayment: 'Opening secure payment',
  paySecurely: (total: string) => `Pay securely · ${total}`,
  preferOffline: (phone: ReactNode, email: ReactNode, method: Method) => (
    <>
      Prefer not to pay online? Call us on {phone} or email {email} and you can pay at {method} instead.
    </>
  ),
  pickupFrom: 'Pickup from',
  delivery: 'Delivery',
  toAddress: 'To your address',
  total: 'Total',
  dueAt: (method: Method) => `Payment is due at ${method}. We accept card and contactless.`,
  paidStripe: 'Paid securely by card through Stripe.',
  demoLink: 'A secure payment link will follow by email to complete your order.',
  notCompleted: 'Card payment not completed yet.',
  demoNote: 'Demo mode — this order was not saved. Connect Supabase to receive real orders.',
  continueShopping: 'Continue shopping',
  viewOrders: 'View my orders',
  // Empty bag
  seoCheckout: 'Checkout',
  empty: 'Your bag is empty.',
  shop: 'Shop Cookies',
  // Form
  title: 'Checkout',
  customer: 'Customer information',
  fullName: 'Full name',
  email: 'Email',
  phone: 'Phone',
  deliveryOrPickup: 'Delivery or pickup',
  studioPickup: 'Studio pickup',
  localDelivery: 'Local delivery',
  free: 'Free',
  street: 'Street address',
  apartment: 'Apartment, suite',
  optional: 'Optional',
  city: 'City',
  zip: 'ZIP code',
  dateTime: 'Date and time',
  chooseDate: (method: Method) => `Choose a ${method} date`,
  pickupTime: 'Pickup time',
  deliveryWindow: 'Delivery window',
  leadNote: (n: number) => `Some items in your bag need ${n} ${n === 1 ? 'day' : 'days'} notice, so earlier dates are unavailable.`,
  payment: 'Payment',
  payCard: 'Pay online by card',
  payCardMeta: 'Secure payment link sent with your confirmation',
  payAt: (method: Method) => `Pay at ${method}`,
  payAtMeta: 'Card or contactless',
  secureNote: 'Payments are processed securely. We never store your card details.',
  instructions: 'Special instructions',
  notes: 'Notes for the studio',
  notesPlaceholder: 'Allergies, delivery access, a surprise to keep secret…',
  summaryLabel: 'Order summary',
  subtotal: 'Subtotal',
  pickup: 'Pickup',
  prepTime: 'Preparation time',
  placing: 'Placing order',
  placeOrder: (total: string) => `Place order · ${total}`,
  terms: (link: (label: string) => ReactNode) => <>By placing your order you agree to our {link('terms')}.</>,
  // Header
  back: 'Back to bag',
  secure: 'Secure checkout',
};

const esMethod = (m: Method) => (m === 'pickup' ? 'recoger' : 'la entrega a domicilio');
const esPayAt = (m: Method) => (m === 'pickup' ? 'al recoger' : 'en la entrega a domicilio');

const es: typeof en = {
  errors: {
    name: 'Por favor, escribe tu nombre completo.',
    email: 'Por favor, escribe un correo electrónico válido.',
    phone: 'Por favor, escribe un teléfono en el que podamos contactarte.',
    line1: 'Por favor, escribe tu dirección.',
    city: 'Por favor, escribe tu ciudad.',
    postal: 'Por favor, escribe tu código postal.',
    date: 'Por favor, elige una fecha.',
    slot: 'Por favor, elige un horario.',
  },
  short: {
    name: 'nombre completo',
    email: 'correo electrónico válido',
    phone: 'teléfono de contacto',
    line1: 'dirección',
    city: 'ciudad',
    postal: 'código postal',
    date: 'fecha',
    slot: 'horario',
  },
  checkFields: (list) => `Por favor, revisa los campos marcados: ${list}.`,
  payOpenFailed: 'No pudimos abrir la página de pago.',
  placeFailed: 'No pudimos realizar tu pedido. Por favor, inténtalo de nuevo.',
  seoPending: 'Completa tu pago',
  seoConfirmed: 'Pedido confirmado',
  orderNo: (n) => `Pedido ${n}`,
  headPending: 'Tu pedido está guardado, pero el pago sigue pendiente.',
  headConfirmed: '¡Gracias! Tu pedido ya está en el horno.',
  confirmLead: (unpaid, method, date, slot) => (
    <>
      {unpaid ? 'Reservamos tu pedido' : 'Tus dulces estarán listos'} para {esMethod(method)} el <strong>{date}</strong>, {slot}.
    </>
  ),
  inTouch: (email) => (
    <>
      Te escribiremos a <strong>{email}</strong>.
    </>
  ),
  paymentReceived: 'Recibimos tu pago. Te enviaremos los detalles por correo electrónico.',
  openingPayment: 'Abriendo el pago seguro',
  paySecurely: (total) => `Pagar de forma segura · ${total}`,
  preferOffline: (phone, email, method) => (
    <>
      ¿Prefieres no pagar en línea? Llámanos al {phone} o escríbenos a {email} y podrás pagar {esPayAt(method)}.
    </>
  ),
  pickupFrom: 'Recoger en',
  delivery: 'Entrega a domicilio',
  toAddress: 'A tu dirección',
  total: 'Total',
  dueAt: (method) => `El pago se realiza ${esPayAt(method)}. Aceptamos tarjeta y pago sin contacto.`,
  paidStripe: 'Pagado de forma segura con tarjeta a través de Stripe.',
  demoLink: 'Te enviaremos por correo un enlace de pago seguro para completar tu pedido.',
  notCompleted: 'El pago con tarjeta aún no se ha completado.',
  demoNote: 'Modo demo: este pedido no se guardó. Conecta Supabase para recibir pedidos reales.',
  continueShopping: 'Seguir comprando',
  viewOrders: 'Ver mis pedidos',
  seoCheckout: 'Finalizar compra',
  empty: 'Tu bolsa está vacía.',
  shop: 'Ver galletas',
  title: 'Finalizar compra',
  customer: 'Tus datos',
  fullName: 'Nombre completo',
  email: 'Correo electrónico',
  phone: 'Teléfono',
  deliveryOrPickup: 'Entrega a domicilio o recogida',
  studioPickup: 'Recoger en el estudio',
  localDelivery: 'Entrega a domicilio',
  free: 'Gratis',
  street: 'Dirección',
  apartment: 'Apartamento, suite',
  optional: 'Opcional',
  city: 'Ciudad',
  zip: 'Código postal',
  dateTime: 'Fecha y hora',
  chooseDate: (method) => (method === 'pickup' ? 'Elige una fecha de recogida' : 'Elige una fecha de entrega'),
  pickupTime: 'Hora de recogida',
  deliveryWindow: 'Horario de entrega',
  leadNote: (n) => `Algunos productos de tu bolsa necesitan ${n} ${n === 1 ? 'día' : 'días'} de anticipación, por eso las fechas anteriores no están disponibles.`,
  payment: 'Pago',
  payCard: 'Pagar en línea con tarjeta',
  payCardMeta: 'Enlace de pago seguro enviado con tu confirmación',
  payAt: (method) => `Pagar ${esPayAt(method)}`,
  payAtMeta: 'Tarjeta o pago sin contacto',
  secureNote: 'Los pagos se procesan de forma segura. Nunca guardamos los datos de tu tarjeta.',
  instructions: 'Instrucciones especiales',
  notes: 'Notas para el estudio',
  notesPlaceholder: 'Alergias, acceso para la entrega, una sorpresa que hay que mantener en secreto…',
  summaryLabel: 'Resumen del pedido',
  subtotal: 'Subtotal',
  pickup: 'Recogida',
  prepTime: 'Tiempo de preparación',
  placing: 'Realizando pedido',
  placeOrder: (total) => `Realizar pedido · ${total}`,
  terms: (link) => <>Al realizar tu pedido aceptas nuestros {link('términos')}.</>,
  back: 'Volver a la bolsa',
  secure: 'Pago seguro',
};

type Method = 'pickup' | 'delivery';
type Payment = 'card' | 'in_person';
type Placed = PlacedOrder & {
  date: string;
  slot: string;
  method: Method;
  email: string;
  payment: Payment;
  /** Card orders only: where the Stripe payment stands. */
  pay?: 'paid' | 'unpaid';
  payError?: string;
};

// The order survives the round trip to Stripe in this tab.
const PENDING_KEY = 'sweetdaisy.pending-order';
const savePending = (p: Placed) => {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(p));
  } catch {
    // Private mode: the return page falls back to the order number alone.
  }
};
const readPending = (orderNumber: string): Placed | null => {
  try {
    const p = JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? 'null') as Placed | null;
    return p?.orderNumber === orderNumber ? p : null;
  } catch {
    return null;
  }
};
type Form = { name: string; email: string; phone: string; line1: string; line2: string; city: string; postal: string; instructions: string };

const fieldIds: Record<keyof Form, string> = {
  name: 'c-name',
  email: 'c-email',
  phone: 'c-phone',
  line1: 'c-line1',
  line2: 'c-line2',
  city: 'c-city',
  postal: 'c-postal',
  instructions: 'c-notes',
};

function readForm(el: HTMLFormElement, current: Form): Form {
  const next = { ...current };
  for (const k of Object.keys(fieldIds) as (keyof Form)[]) {
    const input = el.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${fieldIds[k]}`);
    if (input) next[k] = input.value;
  }
  return next;
}

export default function Checkout() {
  const cart = useCart();
  const { overrides, demo, settings } = useCatalog();
  const site = useSite();
  const closed = settings.store.closedWeekdays;
  const [method, setMethod] = useState<Method>('pickup');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [payment, setPayment] = useState<Payment>('card');
  const [state, setForm] = useState<Form>({ name: '', email: '', phone: '', line1: '', line2: '', city: site.address.city, postal: '', instructions: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [sending, setSending] = useState(false);
  const [placed, setPlaced] = useState<Placed | null>(null);
  const [params, setParams] = useSearchParams();
  const [paying, setPaying] = useState(false);
  const t = useCopy({ en, es });

  // Back from Stripe: ?paid=SD-… or ?unpaid=SD-… (cancelled).
  useEffect(() => {
    const paid = params.get('paid');
    const unpaid = params.get('unpaid');
    const number = paid ?? unpaid;
    if (!number) return;
    const pending = readPending(number);
    setPlaced(
      pending
        ? { ...pending, pay: paid ? 'paid' : 'unpaid' }
        : { orderNumber: number, total: NaN, date: '', slot: '', method: 'pickup', email: '', payment: 'card', pay: paid ? 'paid' : 'unpaid' },
    );
    if (paid) {
      try {
        sessionStorage.removeItem(PENDING_KEY);
      } catch {
        // Ignore.
      }
    }
    setParams({}, { replace: true });
  }, [params, setParams]);

  async function payNow(order: Placed) {
    setPaying(true);
    try {
      savePending(order);
      window.location.assign(await startCardPayment(order.orderNumber, order.email));
    } catch (e) {
      setPlaced({ ...order, pay: 'unpaid', payError: e instanceof Error ? e.message : t.payOpenFailed });
      setPaying(false);
    }
  }

  // Prefill the email for signed-in customers.
  useEffect(() => {
    supabase?.auth.getUser().then(({ data }) => {
      if (data.user?.email) setForm((f) => (f.email ? f : { ...f, email: data.user!.email! }));
    });
  }, []);

  // Keep the chosen date valid as the live catalogue, settings and bag load or change.
  useEffect(() => {
    if (!date || !isBookable(dayStatus(parseISO(date), overrides, cart.maxLeadDays, closed))) {
      setDate(firstAvailable(overrides, cart.maxLeadDays, closed));
    }
  }, [overrides, cart.maxLeadDays, closed, date]);

  const fee = deliveryFee(cart.subtotal, method, settings.store);
  const total = cart.subtotal + fee;
  const slots = method === 'pickup' ? settings.store.pickupSlots : settings.store.deliverySlots;
  const form = state;
  const set = (k: keyof Form) => (e: { target: { value: string } }) => {
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

  function validate(form: Form) {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t.errors.name;
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = t.errors.email;
    if (form.phone.replace(/\D/g, '').length < 7) e.phone = t.errors.phone;
    if (method === 'delivery') {
      if (!form.line1.trim()) e.line1 = t.errors.line1;
      if (!form.city.trim()) e.city = t.errors.city;
      if (!form.postal.trim()) e.postal = t.errors.postal;
    }
    if (!date) e.date = t.errors.date;
    if (!slot) e.slot = t.errors.slot;
    setErrors(e);
    return e;
  }

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setSubmitError('');
    // iOS autofill can fill inputs without firing change events, so read what is actually on screen.
    const form = readForm(ev.currentTarget, state);
    setForm(form);
    const invalid = validate(form);
    if (Object.keys(invalid).length) {
      // On phones the first error can be far above the button; bring it into view explicitly.
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>('[aria-invalid="true"], .slot-error, #err-date');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus({ preventScroll: true });
      });
      return;
    }
    setSending(true);
    let leaving = false;
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
      const order: Placed = { ...result, date, slot, method, email: form.email.trim(), payment };
      cart.clear();
      if (payment === 'card' && !demo) {
        savePending(order);
        try {
          window.location.assign(await startCardPayment(order.orderNumber, order.email));
          leaving = true; // Keep the button busy while the browser leaves for Stripe.
          return;
        } catch (e) {
          setPlaced({ ...order, pay: 'unpaid', payError: e instanceof Error ? e.message : undefined });
        }
      } else {
        setPlaced(order);
      }
      window.scrollTo({ top: 0 });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : t.placeFailed);
    } finally {
      if (!leaving) setSending(false);
    }
  }

  if (placed) {
    const unpaid = placed.pay === 'unpaid';
    const known = Boolean(placed.date);
    return (
      <div className="checkout-shell">
        <Seo title={unpaid ? t.seoPending : t.seoConfirmed} path="/checkout" />
        <CheckoutHeader />
        <section className="container container--narrow confirm" role="status">
          <span className={`builder__done-icon${unpaid ? ' builder__done-icon--wait' : ''}`}>
            <Icon name={unpaid ? 'card' : 'check'} />
          </span>
          <span className="eyebrow eyebrow--plain">{t.orderNo(placed.orderNumber)}</span>
          <h1>{unpaid ? t.headPending : t.headConfirmed}</h1>
          {known ? (
            <p className="lead">
              {t.confirmLead(unpaid, placed.method, formatDate(placed.date), placed.slot)}{' '}
              {!unpaid && t.inTouch(placed.email)}
            </p>
          ) : (
            !unpaid && <p className="lead">{t.paymentReceived}</p>
          )}

          {unpaid && (
            <div className="confirm__pay">
              {placed.payError && (
                <p className="notice notice--error" role="alert">
                  <Icon name="info" /> {placed.payError}
                </p>
              )}
              {known && !demo ? (
                <button className="btn btn--block" disabled={paying} onClick={() => payNow(placed)}>
                  {paying ? <span className="spinner" aria-label={t.openingPayment} /> : <>{t.paySecurely(formatPrice(placed.total))}</>}
                </button>
              ) : null}
              <p className="small muted">
                {t.preferOffline(<a href={site.phoneHref}>{site.phone}</a>, <a href={`mailto:${site.email}`}>{site.email}</a>, placed.method || 'pickup')}
              </p>
            </div>
          )}

          {known && (
            <div className="confirm__card">
              <div className="summary-row">
                <span>{placed.method === 'pickup' ? t.pickupFrom : t.delivery}</span>
                <span>{placed.method === 'pickup' ? `${site.address.street}, ${site.address.city}` : t.toAddress}</span>
              </div>
              <div className="summary-row summary-row--total">
                <span>{t.total}</span>
                <span className="price">{formatPrice(placed.total)}</span>
              </div>
              <p className="small muted">
                {placed.payment === 'in_person'
                  ? t.dueAt(placed.method)
                  : placed.pay === 'paid'
                    ? t.paidStripe
                    : demo
                      ? t.demoLink
                      : t.notCompleted}
              </p>
            </div>
          )}
          {demo && <p className="small muted">{t.demoNote}</p>}
          <div className="hero__ctas">
            <Link to="/shop" className="btn">
              {t.continueShopping}
            </Link>
            <Link to="/account" className="btn btn--outline">
              {t.viewOrders}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="checkout-shell">
        <Seo title={t.seoCheckout} path="/checkout" />
        <CheckoutHeader />
        <section className="container empty">
          <p className="serif empty__title">{t.empty}</p>
          <Link to="/shop" className="btn">
            {t.shop}
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="checkout-shell">
      <Seo title={t.seoCheckout} path="/checkout" />
      <meta name="robots" content="noindex" />
      <CheckoutHeader />

      <form className="container checkout" onSubmit={onSubmit} noValidate>
        <div className="checkout__main">
          <h1 className="checkout__title">{t.title}</h1>

          {/* 1. Customer */}
          <fieldset className="checkout__section">
            <legend>
              <span className="checkout__n">1</span> {t.customer}
            </legend>
            <div className="form-grid form-grid--2">
              <div className="field span-2">
                <label className="field__label" htmlFor="c-name">
                  {t.fullName}
                </label>
                <input id="c-name" className="input" autoComplete="name" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} aria-describedby="err-name" />
                {err('name')}
              </div>
              <div className="field">
                <label className="field__label" htmlFor="c-email">
                  {t.email}
                </label>
                <input id="c-email" className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} aria-describedby="err-email" />
                {err('email')}
              </div>
              <div className="field">
                <label className="field__label" htmlFor="c-phone">
                  {t.phone}
                </label>
                <input id="c-phone" className="input" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} aria-invalid={!!errors.phone} aria-describedby="err-phone" />
                {err('phone')}
              </div>
            </div>
          </fieldset>

          {/* 2. Delivery or pickup */}
          <fieldset className="checkout__section">
            <legend>
              <span className="checkout__n">2</span> {t.deliveryOrPickup}
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
                  <span className="option__title">{m === 'pickup' ? t.studioPickup : t.localDelivery}</span>
                  <span className="option__meta">
                    {m === 'pickup'
                      ? `${site.address.street}, ${site.address.city}`
                      : `${site.delivery.radius} · ${cart.subtotal >= site.delivery.freeOver ? t.free : formatPrice(site.delivery.fee)}`}
                  </span>
                </label>
              ))}
            </div>
            {method === 'delivery' && (
              <div className="form-grid form-grid--2 checkout__address">
                <div className="field span-2">
                  <label className="field__label" htmlFor="c-line1">
                    {t.street}
                  </label>
                  <input id="c-line1" className="input" autoComplete="address-line1" value={form.line1} onChange={set('line1')} aria-invalid={!!errors.line1} aria-describedby="err-line1" />
                  {err('line1')}
                </div>
                <div className="field span-2">
                  <label className="field__label" htmlFor="c-line2">
                    {t.apartment} <span className="opt-group__hint">{t.optional}</span>
                  </label>
                  <input id="c-line2" className="input" autoComplete="address-line2" value={form.line2} onChange={set('line2')} />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="c-city">
                    {t.city}
                  </label>
                  <input id="c-city" className="input" autoComplete="address-level2" value={form.city} onChange={set('city')} aria-invalid={!!errors.city} aria-describedby="err-city" />
                  {err('city')}
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="c-postal">
                    {t.zip}
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
              <span className="checkout__n">3</span> {t.dateTime}
            </legend>
            <div className="checkout__when">
              <AvailabilityCalendar leadDays={cart.maxLeadDays} value={date} onChange={setDate} label={t.chooseDate(method)} />
              <div className="stack">
                {date && (
                  <p className="builder__picked">
                    <Icon name="calendar" /> {formatDate(date)}
                  </p>
                )}
                {err('date')}
                <div className="field">
                  <span className="field__label" id="slot-label">
                    {method === 'pickup' ? t.pickupTime : t.deliveryWindow}
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
                    {t.leadNote(cart.maxLeadDays)}
                  </p>
                )}
              </div>
            </div>
          </fieldset>

          {/* 4. Payment */}
          <fieldset className="checkout__section">
            <legend>
              <span className="checkout__n">4</span> {t.payment}
            </legend>
            <div className="method">
              <label className="option method__opt">
                <input type="radio" name="payment" checked={payment === 'card'} onChange={() => setPayment('card')} />
                <Icon name="card" />
                <span className="option__title">{t.payCard}</span>
                <span className="option__meta">{t.payCardMeta}</span>
              </label>
              <label className="option method__opt">
                <input type="radio" name="payment" checked={payment === 'in_person'} onChange={() => setPayment('in_person')} />
                <Icon name="store" />
                <span className="option__title">{t.payAt(method)}</span>
                <span className="option__meta">{t.payAtMeta}</span>
              </label>
            </div>
            <p className="checkout__secure small muted">
              <Icon name="lock" /> {t.secureNote}
            </p>
          </fieldset>

          {/* 5. Instructions */}
          <fieldset className="checkout__section">
            <legend>
              <span className="checkout__n">5</span> {t.instructions}
            </legend>
            <div className="field">
              <label className="field__label" htmlFor="c-notes">
                {t.notes} <span className="opt-group__hint">{t.optional}</span>
              </label>
              <textarea
                id="c-notes"
                className="textarea"
                maxLength={800}
                placeholder={t.notesPlaceholder}
                value={form.instructions}
                onChange={set('instructions')}
              />
            </div>
          </fieldset>
        </div>

        {/* Order summary */}
        <aside className="checkout__summary" aria-label={t.summaryLabel}>
          <div className="summary-card">
            <h2 className="summary-card__title">{t.summaryLabel}</h2>
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
              <span>{t.subtotal}</span>
              <span className="price">{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>{method === 'pickup' ? t.pickup : t.delivery}</span>
              <span>{fee ? formatPrice(fee) : t.free}</span>
            </div>
            {formatPrep(cart.maxPrepHours) && (
              <div className="summary-row">
                <span>{t.prepTime}</span>
                <span>{formatPrep(cart.maxPrepHours)}</span>
              </div>
            )}
            <div className="summary-row summary-row--total">
              <span>{t.total}</span>
              <span className="price">{formatPrice(total)}</span>
            </div>
            {Object.keys(errors).length > 0 && (
              <p className="notice notice--error" role="alert">
                <Icon name="info" /> {t.checkFields(Object.keys(errors).map((k) => t.short[k as FieldKey] ?? errors[k]).join(', '))}
              </p>
            )}
            {submitError && (
              <p className="notice notice--error" role="alert">
                <Icon name="info" /> {submitError}
              </p>
            )}
            <button type="submit" className="btn btn--block" disabled={sending}>
              {sending ? <span className="spinner" aria-label={t.placing} /> : t.placeOrder(formatPrice(total))}
            </button>
            <p className="small muted center">
              {t.terms((label) => <Link to="/terms">{label}</Link>)}
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function CheckoutHeader() {
  const t = useCopy({ en, es });
  return (
    <header className="checkout-header">
      <div className="container checkout-header__inner">
        <Link to="/cart" className="link">
          <Icon name="arrowLeft" /> <span className="checkout-header__back">{t.back}</span>
        </Link>
        <Logo />
        <span className="checkout-header__secure small">
          <Icon name="lock" /> <span>{t.secure}</span>
        </span>
      </div>
    </header>
  );
}
