import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { Reveal } from '../components/Reveal';
import { ReviewCard } from '../components/ReviewCard';
import { Seo } from '../components/Seo';
import { StarInput, Stars } from '../components/Stars';
import { ratingSummary, useReviews } from '../hooks/useReviews';
import { useCopy } from '../i18n';
import { submitReview } from '../lib/api';

const en = {
  seoTitle: 'Reviews',
  seoDescription: 'What customers say about Sweet Daisy’s New York–style cookies and custom cakes — and how to leave your own review.',
  eyebrow: 'Reviews',
  title: 'Sweet words',
  intro: 'Every review comes from a real Sweet Daisy order. Tried our cookies? We’d love to hear what you thought.',
  crumb: 'Reviews',
  basedOn: (n: number) => `Based on ${n} ${n === 1 ? 'review' : 'reviews'}`,
  starsRow: (n: number) => `${n} ${n === 1 ? 'star' : 'stars'}`,
  loading: 'Loading reviews…',
  none: 'No reviews yet — yours could be the first.',
  formTitle: 'Leave a review',
  formLead: 'Use the order number from your confirmation and the email you ordered with. Reviews appear once we’ve checked them.',
  orderNumber: 'Order number',
  orderHint: 'e.g. SD-10234',
  email: 'Email used for the order',
  name: 'Name to show',
  nameHint: 'Optional — we’ll use your first name',
  rating: 'Your rating',
  comment: 'Your review',
  commentHint: 'How were the cookies? What was the occasion?',
  errOrder: 'Please enter your order number.',
  errEmail: 'Please enter the email you used for the order.',
  errRating: 'Please choose a rating from 1 to 5 stars.',
  errComment: 'Please write a few words (at least 10 characters).',
  errGeneric: 'Something went wrong. Please try again.',
  sending: 'Sending',
  send: 'Send review',
  thanksTitle: 'Thank you!',
  thanksText: 'We’ve received your review. It will appear here once we’ve checked it.',
  backToShop: 'Shop Cookies',
};
const es: typeof en = {
  seoTitle: 'Opiniones',
  seoDescription: 'Lo que dicen nuestros clientes de las galletas estilo New York y los pasteles personalizados de Sweet Daisy, y cómo dejar tu opinión.',
  eyebrow: 'Opiniones',
  title: 'Palabras dulces',
  intro: 'Cada opinión viene de un pedido real de Sweet Daisy. ¿Probaste nuestras galletas? Nos encantaría saber qué te parecieron.',
  crumb: 'Opiniones',
  basedOn: (n) => `Basado en ${n} ${n === 1 ? 'opinión' : 'opiniones'}`,
  starsRow: (n) => `${n} ${n === 1 ? 'estrella' : 'estrellas'}`,
  loading: 'Cargando opiniones…',
  none: 'Aún no hay opiniones: la tuya puede ser la primera.',
  formTitle: 'Deja tu opinión',
  formLead: 'Usa el número de pedido de tu confirmación y el correo con el que hiciste el pedido. Las opiniones se publican después de revisarlas.',
  orderNumber: 'Número de pedido',
  orderHint: 'p. ej. SD-10234',
  email: 'Correo usado en el pedido',
  name: 'Nombre a mostrar',
  nameHint: 'Opcional: usaremos tu nombre de pila',
  rating: 'Tu calificación',
  comment: 'Tu opinión',
  commentHint: '¿Qué tal las galletas? ¿Cuál era la ocasión?',
  errOrder: 'Por favor, escribe tu número de pedido.',
  errEmail: 'Por favor, escribe el correo que usaste en el pedido.',
  errRating: 'Por favor, elige una calificación de 1 a 5 estrellas.',
  errComment: 'Por favor, escribe unas palabras (al menos 10 caracteres).',
  errGeneric: 'Algo salió mal. Por favor, inténtalo de nuevo.',
  sending: 'Enviando',
  send: 'Enviar opinión',
  thanksTitle: '¡Gracias!',
  thanksText: 'Recibimos tu opinión. Aparecerá aquí cuando la hayamos revisado.',
  backToShop: 'Ver galletas',
};

export default function Reviews() {
  const t = useCopy({ en, es });
  const reviews = useReviews();
  const summary = ratingSummary(reviews ?? []);

  return (
    <>
      <Seo title={t.seoTitle} description={t.seoDescription} path="/reviews" />
      <PageHeader eyebrow={t.eyebrow} title={t.title} intro={t.intro} crumbs={[{ label: t.crumb }]} />

      <section className="section section--tight">
        <div className="container reviews-page">
          <div className="reviews-page__side">
            {summary.count > 0 && (
              <Reveal className="rating-summary">
                <p className="rating-summary__avg serif">{summary.average.toFixed(1)}</p>
                <Stars value={summary.average} className="rating-summary__stars" />
                <p className="small muted">{t.basedOn(summary.count)}</p>
                <ul className="rating-summary__bars">
                  {summary.byStars.map((b) => (
                    <li key={b.stars}>
                      <span className="small">{t.starsRow(b.stars)}</span>
                      <span className="rating-summary__bar" aria-hidden="true">
                        <span style={{ width: `${(b.count / summary.count) * 100}%` }} />
                      </span>
                      <span className="small muted">{b.count}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
            <ReviewForm />
          </div>

          <div className="reviews-page__list">
            {reviews === null ? (
              <p className="muted">{t.loading}</p>
            ) : reviews.length === 0 ? (
              <p className="muted reviews-page__empty">{t.none}</p>
            ) : (
              reviews.map((r, i) => (
                <Reveal key={r.id} delay={Math.min(i, 4) * 60}>
                  <ReviewCard review={r} />
                </Reveal>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function ReviewForm() {
  const t = useCopy({ en, es });
  const [params] = useSearchParams();
  const [form, setForm] = useState({ orderNumber: params.get('order') ?? '', email: params.get('email') ?? '', name: '', comment: '' });
  const [rating, setRating] = useState(0);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const problem = !form.orderNumber.trim()
      ? t.errOrder
      : !/^\S+@\S+\.\S+$/.test(form.email.trim())
        ? t.errEmail
        : rating < 1
          ? t.errRating
          : form.comment.trim().length < 10
            ? t.errComment
            : '';
    setError(problem);
    if (problem) return;
    setState('sending');
    try {
      await submitReview({ ...form, rating });
      setState('sent');
    } catch (err) {
      setState('idle');
      setError(err instanceof Error ? err.message : t.errGeneric);
    }
  }

  if (state === 'sent') {
    return (
      <div className="review-form builder--done" role="status">
        <span className="builder__done-icon">
          <Icon name="check" />
        </span>
        <h2>{t.thanksTitle}</h2>
        <p>{t.thanksText}</p>
        <Link to="/cookies" className="btn btn--outline">
          {t.backToShop}
        </Link>
      </div>
    );
  }

  return (
    <form id="write" className="review-form form-grid" onSubmit={onSubmit} noValidate>
      <div>
        <h2 className="contact__title">{t.formTitle}</h2>
        <p className="small muted">{t.formLead}</p>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="rv-order">
          {t.orderNumber}
        </label>
        <input id="rv-order" className="input" placeholder={t.orderHint} autoCapitalize="characters" value={form.orderNumber} onChange={set('orderNumber')} />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="rv-email">
          {t.email}
        </label>
        <input id="rv-email" className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
      </div>
      <StarInput value={rating} onChange={setRating} legend={t.rating} invalid={error === t.errRating} />
      <div className="field">
        <label className="field__label" htmlFor="rv-comment">
          {t.comment}
        </label>
        <textarea id="rv-comment" className="textarea" rows={5} maxLength={1000} placeholder={t.commentHint} value={form.comment} onChange={set('comment')} />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="rv-name">
          {t.name}
        </label>
        <input id="rv-name" className="input" autoComplete="given-name" maxLength={60} placeholder={t.nameHint} value={form.name} onChange={set('name')} />
      </div>
      {error && (
        <p className="notice notice--error" role="alert">
          <Icon name="info" /> {error}
        </p>
      )}
      <div>
        <button className="btn" type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? <span className="spinner" aria-label={t.sending} /> : t.send}
        </button>
      </div>
    </form>
  );
}
