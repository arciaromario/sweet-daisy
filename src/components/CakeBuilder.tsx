import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useCatalog } from '../context/CatalogContext';
import { formatPrice } from '../data/products';
import { submitCustomCakeRequest } from '../lib/api';
import { useCopy } from '../i18n';
import { formatDate } from '../lib/availability';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { CakePreview } from './CakePreview';
import { Icon } from './Icon';
import { Img } from './Img';
import { OptionGroup } from './OptionGroup';

const en = {
  steps: ['Size', 'Flavour', 'Filling', 'Frosting', 'Decoration', 'Inspiration', 'Event date', 'Instructions', 'Contact', 'Review'],
  stepTitles: [
    'How many guests are you celebrating with?',
    'Choose your sponge.',
    'Something delicious in between.',
    'Finish it beautifully.',
    'Pick a decoration style.',
    'Share your inspiration.',
    'When is the celebration?',
    'Anything else we should know?',
    'Where should we send your quote?',
    'Review your request.',
  ],
  errSize: 'Please choose a size.',
  errFlavor: 'Please choose a flavour.',
  errFilling: 'Please choose a filling.',
  errFrosting: 'Please choose a frosting.',
  errStyle: 'Please choose a decoration style.',
  errDate: 'Please select your event date.',
  errName: 'Please tell us your name.',
  errEmail: 'Please enter a valid email address.',
  errGeneric: 'Something went wrong. Please try again.',
  thanks: (name: string) => `Thank you, ${name}.`,
  sentBefore: 'Your custom cake request is with our team. We’ll be in touch at ',
  sentAfter: (date: string) => ` within 48 hours with a personal quote and design ideas for ${date}.`,
  startAnother: 'Start another request',
  stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
  progress: 'Progress',
  completed: ' (completed)',
  cakeSize: 'Cake size',
  spongeFlavour: 'Sponge flavour',
  filling: 'Filling',
  frosting: 'Frosting',
  decorationStyle: 'Decoration style',
  fromExtra: (price: string) => `from + ${price}`,
  included: 'Included',
  chooseDate: 'Choose your event date',
  notice: (days: number) => `Custom cakes need at least ${days} days notice. Weddings and tiered cakes are best booked 4–8 weeks ahead.`,
  occasion: 'Occasion',
  selectOccasion: 'Select an occasion',
  instructions: 'Special instructions',
  instructionsPlaceholder: 'Colours, theme, message on the cake, number of guests, dietary needs…',
  instructionsHint: 'The more you share, the closer our first sketch will be.',
  fullName: 'Full name',
  email: 'Email',
  phone: 'Phone',
  optional: 'Optional',
  review: {
    size: 'Size',
    flavour: 'Flavour',
    filling: 'Filling',
    frosting: 'Frosting',
    decoration: 'Decoration',
    inspiration: 'Inspiration',
    event: 'Event',
    instructions: 'Instructions',
    contact: 'Contact',
  },
  images: (n: number) => `${n} image${n > 1 ? 's' : ''}`,
  noneAdded: 'None added',
  edit: 'Edit',
  depositNote: (pct: number) =>
    `Submitting is free and doesn’t commit you to anything. We’ll reply with a quote and a design sketch; your date is reserved once you approve and pay the ${pct}% deposit.`,
  back: 'Back',
  skip: 'Skip for now',
  continue: 'Continue',
  sending: 'Sending',
  submit: 'Submit Request',
  summaryLabel: 'Your cake so far',
  previewHint: 'Your cake takes shape as you choose.',
  yourCake: 'Your cake',
  summary: { size: 'Size', flavour: 'Flavour', filling: 'Filling', frosting: 'Frosting', style: 'Style', date: 'Date' },
  estimatedFrom: 'Estimated from',
  finalPrice: 'Final price is confirmed in your personal quote.',
  demo: 'Demo mode: requests aren’t sent until Supabase is connected.',
  dropTitle: 'Drop images here or browse',
  dropHint: (max: number) => `Up to ${max} images · JPG, PNG or HEIC · 10 MB each. Optional.`,
  inspirationAlt: (n: number) => `Inspiration ${n}`,
  removeImage: (n: number) => `Remove inspiration image ${n}`,
};
const es: typeof en = {
  steps: ['Tamaño', 'Sabor', 'Relleno', 'Cobertura', 'Decoración', 'Inspiración', 'Fecha', 'Indicaciones', 'Contacto', 'Revisión'],
  stepTitles: [
    '¿Con cuántos invitados vas a celebrar?',
    'Elige tu bizcocho.',
    'Algo delicioso entre capas.',
    'Dale un acabado precioso.',
    'Elige un estilo de decoración.',
    'Comparte tu inspiración.',
    '¿Cuándo es la celebración?',
    '¿Algo más que debamos saber?',
    '¿A dónde te enviamos tu presupuesto?',
    'Revisa tu solicitud.',
  ],
  errSize: 'Elige un tamaño.',
  errFlavor: 'Elige un sabor.',
  errFilling: 'Elige un relleno.',
  errFrosting: 'Elige una cobertura.',
  errStyle: 'Elige un estilo de decoración.',
  errDate: 'Selecciona la fecha de tu evento.',
  errName: 'Dinos tu nombre.',
  errEmail: 'Ingresa un correo electrónico válido.',
  errGeneric: 'Algo salió mal. Inténtalo de nuevo.',
  thanks: (name) => `Gracias, ${name}.`,
  sentBefore: 'Tu solicitud de pastel personalizado ya está con nuestro equipo. Te escribiremos a ',
  sentAfter: (date) => ` en un plazo de 48 horas con un presupuesto personal e ideas de diseño para el ${date}.`,
  startAnother: 'Hacer otra solicitud',
  stepOf: (n, total) => `Paso ${n} de ${total}`,
  progress: 'Progreso',
  completed: ' (completado)',
  cakeSize: 'Tamaño del pastel',
  spongeFlavour: 'Sabor del bizcocho',
  filling: 'Relleno',
  frosting: 'Cobertura',
  decorationStyle: 'Estilo de decoración',
  fromExtra: (price) => `desde + ${price}`,
  included: 'Incluido',
  chooseDate: 'Elige la fecha de tu evento',
  notice: (days) =>
    `Los pasteles personalizados requieren al menos ${days} días de anticipación. Para bodas y pasteles de varios pisos, lo ideal es reservar con 4 a 8 semanas.`,
  occasion: 'Ocasión',
  selectOccasion: 'Selecciona una ocasión',
  instructions: 'Indicaciones especiales',
  instructionsPlaceholder: 'Colores, temática, mensaje en el pastel, número de invitados, necesidades alimentarias…',
  instructionsHint: 'Cuanto más nos cuentes, más se acercará nuestro primer boceto a lo que imaginas.',
  fullName: 'Nombre completo',
  email: 'Correo electrónico',
  phone: 'Teléfono',
  optional: 'Opcional',
  review: {
    size: 'Tamaño',
    flavour: 'Sabor',
    filling: 'Relleno',
    frosting: 'Cobertura',
    decoration: 'Decoración',
    inspiration: 'Inspiración',
    event: 'Evento',
    instructions: 'Indicaciones',
    contact: 'Contacto',
  },
  images: (n) => `${n} ${n > 1 ? 'imágenes' : 'imagen'}`,
  noneAdded: 'Ninguna',
  edit: 'Editar',
  depositNote: (pct) =>
    `Enviar tu solicitud es gratis y no te compromete a nada. Te responderemos con un presupuesto y un boceto del diseño; tu fecha queda reservada cuando apruebes el diseño y pagues el anticipo del ${pct}%.`,
  back: 'Atrás',
  skip: 'Omitir por ahora',
  continue: 'Continuar',
  sending: 'Enviando',
  submit: 'Enviar solicitud',
  summaryLabel: 'Tu pastel hasta ahora',
  previewHint: 'Tu pastel toma forma mientras eliges.',
  yourCake: 'Tu pastel',
  summary: { size: 'Tamaño', flavour: 'Sabor', filling: 'Relleno', frosting: 'Cobertura', style: 'Estilo', date: 'Fecha' },
  estimatedFrom: 'Precio estimado desde',
  finalPrice: 'El precio final se confirma en tu presupuesto personal.',
  demo: 'Modo demo: las solicitudes no se envían hasta conectar Supabase.',
  dropTitle: 'Arrastra tus imágenes aquí o búscalas',
  dropHint: (max) => `Hasta ${max} imágenes · JPG, PNG o HEIC · 10 MB cada una. Opcional.`,
  inspirationAlt: (n) => `Inspiración ${n}`,
  removeImage: (n) => `Quitar imagen de inspiración ${n}`,
};

interface State {
  size: string;
  flavor: string;
  filling: string;
  frosting: string;
  style: string;
  files: File[];
  date: string;
  occasion: string;
  instructions: string;
  name: string;
  email: string;
  phone: string;
}

const initial: State = { size: '', flavor: '', filling: '', frosting: '', style: '', files: [], date: '', occasion: '', instructions: '', name: '', email: '', phone: '' };

export function CakeBuilder() {
  const { demo, settings } = useCatalog();
  const t = useCopy({ en, es });
  const steps = t.steps;
  const cfg = settings.custom;
  const sizes = cfg.sizes.map((x) => ({ value: x.label, title: x.label, meta: x.servings, price: x.price }));
  const frostings = cfg.frostings.map((f) => ({ value: f.label, meta: f.note }));
  const styles = cfg.styles.map((st) => ({ value: st.label, image: st.image, extra: st.extra }));
  const { flavors, fillings, occasions } = cfg;
  const [step, setStep] = useState(0);
  const [s, setS] = useState<State>(initial);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  // Direction of the last step change, so the next panel slides in from the right side.
  const prevStep = useRef(0);
  const dir = step >= prevStep.current ? 'forward' : 'back';
  useEffect(() => {
    prevStep.current = step;
  }, [step]);

  const set = <K extends keyof State>(k: K, v: State[K]) => {
    setS((prev) => ({ ...prev, [k]: v }));
    setError('');
  };

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.closest('.builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const estimate =
    (sizes.find((x) => x.value === s.size)?.price ?? 0) + (styles.find((x) => x.value === s.style)?.extra ?? 0);
  const shownEstimate = useCountUp(estimate);

  const preview = {
    size: s.size,
    sizeIndex: sizes.findIndex((x) => x.value === s.size),
    flavor: s.flavor,
    filling: s.filling,
    frosting: s.frosting,
    style: s.style,
    topper: s.date ? formatDate(s.date, { day: 'numeric', month: 'short' }) : undefined,
  };

  function validate(i: number): string {
    switch (i) {
      case 0:
        return s.size ? '' : t.errSize;
      case 1:
        return s.flavor ? '' : t.errFlavor;
      case 2:
        return s.filling ? '' : t.errFilling;
      case 3:
        return s.frosting ? '' : t.errFrosting;
      case 4:
        return s.style ? '' : t.errStyle;
      case 6:
        return s.date ? '' : t.errDate;
      case 8:
        if (!s.name.trim()) return t.errName;
        if (!/^\S+@\S+\.\S+$/.test(s.email)) return t.errEmail;
        return '';
      default:
        return '';
    }
  }

  function next() {
    const msg = validate(step);
    if (msg) return setError(msg);
    setStep((x) => Math.min(steps.length - 1, x + 1));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    // Enter inside a field advances a step rather than sending the request early.
    if (step < steps.length - 1) return next();
    for (let i = 0; i < steps.length - 1; i++) {
      const msg = validate(i);
      if (msg) {
        setStep(i);
        setError(msg);
        return;
      }
    }
    setStatus('sending');
    try {
      await submitCustomCakeRequest(
        {
          size: s.size,
          flavor: s.flavor,
          filling: s.filling,
          frosting: s.frosting,
          decoration_style: s.style,
          event_date: s.date,
          occasion: s.occasion || undefined,
          instructions: s.instructions || undefined,
          name: s.name.trim(),
          email: s.email.trim(),
          phone: s.phone.trim() || undefined,
        },
        s.files,
      );
      setStatus('sent');
    } catch (err) {
      setStatus('idle');
      setError(err instanceof Error ? err.message : t.errGeneric);
    }
  }

  if (status === 'sent') {
    return (
      <div className="builder builder--done" role="status">
        <CakePreview {...preview} celebrate className="builder__done-cake" />
        <h3>{t.thanks(s.name.split(' ')[0])}</h3>
        <p className="lead">
          {t.sentBefore}
          <strong>{s.email}</strong>
          {t.sentAfter(formatDate(s.date))}
        </p>
        <button
          className="btn btn--outline"
          onClick={() => {
            setS(initial);
            setStep(0);
            setStatus('idle');
          }}
        >
          {t.startAnother}
        </button>
      </div>
    );
  }

  return (
    <form className="builder" onSubmit={submit} noValidate>
      <div className="builder__progress">
        <p className="builder__count">
          {t.stepOf(step + 1, steps.length)} <span aria-hidden="true">·</span> <strong>{steps[step]}</strong>
        </p>
        <ol className="builder__bar" aria-label={t.progress}>
          {steps.map((label, i) => (
            <li key={label} className={i < step ? 'is-done' : i === step ? 'is-current' : ''}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => setStep(i)}
                aria-label={`${label}${i < step ? t.completed : ''}`}
                aria-current={i === step ? 'step' : undefined}
              >
                <span className="builder__seg" />
                <span className="builder__label">{label}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="builder__layout">
        <div className="builder__panel">
          <div key={step} className="builder__step" data-dir={dir}>
            <h3 ref={headingRef} tabIndex={-1} className="builder__title">
              {t.stepTitles[step]}
            </h3>

            {step === 0 && (
              <OptionGroup
                name="b-size"
                legend={t.cakeSize}
                value={s.size}
                onChange={(v) => set('size', v)}
                min={150}
                choices={sizes.map((x) => ({ value: x.value, title: x.title, meta: x.meta, price: x.price, priceMode: 'absolute' }))}
              />
            )}
            {step === 1 && (
              <OptionGroup name="b-flavor" legend={t.spongeFlavour} value={s.flavor} onChange={(v) => set('flavor', v)} min={170} choices={flavors.map((f) => ({ value: f, title: f }))} />
            )}
            {step === 2 && (
              <OptionGroup name="b-filling" legend={t.filling} value={s.filling} onChange={(v) => set('filling', v)} min={190} choices={fillings.map((f) => ({ value: f, title: f }))} />
            )}
            {step === 3 && (
              <OptionGroup
                name="b-frosting"
                legend={t.frosting}
                value={s.frosting}
                onChange={(v) => set('frosting', v)}
                min={200}
                choices={frostings.map((f) => ({ value: f.value, title: f.value, meta: f.meta }))}
              />
            )}
            {step === 4 && (
              <fieldset className="opt-group">
                <legend className="field__label">{t.decorationStyle}</legend>
                <div className="style-grid">
                  {styles.map((st) => (
                    <label key={st.value} className="style-card">
                      <input type="radio" name="b-style" value={st.value} checked={s.style === st.value} onChange={() => set('style', st.value)} />
                      <Img src={st.image} alt="" ratio="1 / 1" width={400} sizes="(min-width: 900px) 180px, 45vw" />
                      <span className="style-card__label">
                        {st.value}
                        <span className="option__price">{st.extra ? t.fromExtra(formatPrice(st.extra)) : t.included}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            {step === 5 && <InspirationUpload files={s.files} onChange={(f) => set('files', f)} />}
            {step === 6 && (
              <div className="builder__date">
                <AvailabilityCalendar leadDays={cfg.leadDays} value={s.date} onChange={(d) => set('date', d)} label={t.chooseDate} />
                <div className="stack">
                  <p className="small muted">
                    {t.notice(cfg.leadDays)}
                  </p>
                  {s.date && (
                    <p className="builder__picked">
                      <Icon name="calendar" /> {formatDate(s.date)}
                    </p>
                  )}
                  <div className="field">
                    <label className="field__label" htmlFor="b-occasion">
                      {t.occasion}
                    </label>
                    <select id="b-occasion" className="select" value={s.occasion} onChange={(e) => set('occasion', e.target.value)}>
                      <option value="">{t.selectOccasion}</option>
                      {occasions.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
            {step === 7 && (
              <div className="field">
                <label className="field__label" htmlFor="b-instructions">
                  {t.instructions}
                </label>
                <textarea
                  id="b-instructions"
                  className="textarea"
                  rows={6}
                  maxLength={1500}
                  placeholder={t.instructionsPlaceholder}
                  value={s.instructions}
                  onChange={(e) => set('instructions', e.target.value)}
                />
                <span className="field__hint">{t.instructionsHint}</span>
              </div>
            )}
            {step === 8 && (
              <div className="form-grid form-grid--2">
                <div className="field span-2">
                  <label className="field__label" htmlFor="b-name">
                    {t.fullName}
                  </label>
                  <input id="b-name" className="input" autoComplete="name" value={s.name} onChange={(e) => set('name', e.target.value)} required />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="b-email">
                    {t.email}
                  </label>
                  <input id="b-email" className="input" type="email" autoComplete="email" value={s.email} onChange={(e) => set('email', e.target.value)} required />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="b-phone">
                    {t.phone} <span className="opt-group__hint">{t.optional}</span>
                  </label>
                  <input id="b-phone" className="input" type="tel" autoComplete="tel" value={s.phone} onChange={(e) => set('phone', e.target.value)} />
                </div>
              </div>
            )}
            {step === 9 && (
              <div className="builder__review">
                <dl className="review-list">
                  {[
                    [t.review.size, s.size, 0],
                    [t.review.flavour, s.flavor, 1],
                    [t.review.filling, s.filling, 2],
                    [t.review.frosting, s.frosting, 3],
                    [t.review.decoration, s.style, 4],
                    [t.review.inspiration, s.files.length ? t.images(s.files.length) : t.noneAdded, 5],
                    [t.review.event, `${formatDate(s.date)}${s.occasion ? ` · ${s.occasion}` : ''}`, 6],
                    [t.review.instructions, s.instructions || '—', 7],
                    [t.review.contact, `${s.name} · ${s.email}${s.phone ? ` · ${s.phone}` : ''}`, 8],
                  ].map(([label, value, i]) => (
                    <div key={label as string}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                      <button type="button" className="review-list__edit" onClick={() => setStep(i as number)}>
                        {t.edit}<span className="visually-hidden"> {label}</span>
                      </button>
                    </div>
                  ))}
                </dl>
                <p className="small muted">
                  {t.depositNote(cfg.depositPercent)}
                </p>
              </div>
            )}

          </div>

          {error && (
            <p className="notice notice--error" role="alert">
              <Icon name="info" /> {error}
            </p>
          )}

          <div className="builder__nav">
            {step > 0 ? (
              <button type="button" className="btn btn--outline" onClick={() => setStep(step - 1)}>
                <Icon name="arrowLeft" /> {t.back}
              </button>
            ) : (
              <span />
            )}
            {step < steps.length - 1 ? (
              <button key="next" type="button" className="btn" onClick={next}>
                {step === 5 && s.files.length === 0 ? t.skip : t.continue} <Icon name="arrow" />
              </button>
            ) : (
              // Distinct key: reusing the "Continue" node would let its click submit the form.
              <button key="submit" type="submit" className="btn btn--blush" disabled={status === 'sending'}>
                {status === 'sending' ? <span className="spinner" aria-label={t.sending} /> : t.submit}
              </button>
            )}
          </div>
        </div>

        <aside className="builder__summary" aria-label={t.summaryLabel}>
          <div className="builder__preview">
            <CakePreview {...preview} celebrate={step === steps.length - 1} />
            {!s.size && <p className="builder__preview-hint">{t.previewHint}</p>}
          </div>
          <p className="eyebrow eyebrow--plain">{t.yourCake}</p>
          <ul>
            {[
              [t.summary.size, s.size],
              [t.summary.flavour, s.flavor],
              [t.summary.filling, s.filling],
              [t.summary.frosting, s.frosting],
              [t.summary.style, s.style],
              [t.summary.date, s.date ? formatDate(s.date, { month: 'short', day: 'numeric', weekday: 'short' }) : ''],
            ].map(([k, v]) => (
              <li key={k} className={v ? 'is-set' : ''}>
                <span>{k}</span>
                <span key={v}>{v || '—'}</span>
              </li>
            ))}
          </ul>
          <div className="builder__estimate">
            <span>{t.estimatedFrom}</span>
            <span className="serif">{estimate ? formatPrice(shownEstimate) : '—'}</span>
          </div>
          <p className="small muted">{t.finalPrice}</p>
          {demo && <p className="small muted">{t.demo}</p>}
        </aside>
      </div>
    </form>
  );
}

function InspirationUpload({ files, onChange }: { files: File[]; onChange: (f: File[]) => void }) {
  const t = useCopy({ en, es });
  const [drag, setDrag] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const MAX = 3;

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const images = Array.from(list).filter((f) => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024);
    onChange([...files, ...images].slice(0, MAX));
  };

  return (
    <div className="upload-wrap">
      <label
        className={`upload${drag ? ' is-drag' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <input type="file" accept="image/*" multiple onChange={(e) => addFiles(e.target.files)} disabled={files.length >= MAX} />
        <Icon name="upload" />
        <span className="upload__title">{t.dropTitle}</span>
        <span className="small muted">{t.dropHint(MAX)}</span>
      </label>
      {previews.length > 0 && (
        <ul className="upload__previews">
          {previews.map((src, i) => (
            <li key={src}>
              <img src={src} alt={t.inspirationAlt(i + 1)} />
              <button type="button" aria-label={t.removeImage(i + 1)} onClick={() => onChange(files.filter((_, j) => j !== i))}>
                <Icon name="close" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Eases a number towards its target so the price estimate counts up instead of jumping. */
function useCountUp(target: number, ms = 600) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = from.current;
    if (start === target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      from.current = target;
      setValue(target);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      const eased = 1 - (1 - k) ** 3;
      const v = Math.round(start + (target - start) * eased);
      from.current = v;
      setValue(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}
