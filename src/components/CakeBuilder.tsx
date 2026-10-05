import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useCatalog } from '../context/CatalogContext';
import { formatPrice } from '../data/products';
import { availability } from '../data/site';
import { submitCustomCakeRequest } from '../lib/api';
import { formatDate } from '../lib/availability';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { Icon } from './Icon';
import { Img } from './Img';
import { OptionGroup } from './OptionGroup';

const sizes = [
  { value: '6" round', title: '6" round', meta: '8–10 servings', price: 95 },
  { value: '8" round', title: '8" round', meta: '14–18 servings', price: 135 },
  { value: '10" round', title: '10" round', meta: '24–30 servings', price: 185 },
  { value: 'Two tiers', title: 'Two tiers', meta: '30–45 servings', price: 320 },
  { value: 'Three tiers', title: 'Three tiers', meta: '60–90 servings', price: 520 },
];

const flavors = ['Vanilla bean', 'Dark chocolate', 'Lemon chiffon', 'Red velvet', 'Pistachio', 'Spiced carrot', 'Almond & orange', 'Gluten-free vanilla'];
const fillings = ['Fresh strawberries & cream', 'Raspberry compote', 'Lemon curd', 'Salted caramel', 'Chocolate ganache', 'Passion fruit curd', 'Cream cheese', 'Buttercream only'];
const frostings = [
  { value: 'Swiss meringue buttercream', meta: 'Silky, light, not too sweet' },
  { value: 'Cream cheese frosting', meta: 'Tangy and rich' },
  { value: 'Whipped mascarpone', meta: 'Soft and creamy' },
  { value: 'Chocolate ganache', meta: 'Glossy and decadent' },
  { value: 'Semi-naked', meta: 'Rustic, layers peek through' },
];
const styles = [
  { value: 'Minimal & textured', image: 'vanilla', extra: 0 },
  { value: 'Fresh florals', image: 'floral', extra: 35 },
  { value: 'Vintage piping', image: 'birthday', extra: 25 },
  { value: 'Fruit crown', image: 'strawberry', extra: 20 },
  { value: 'Gold & hand-painted', image: 'wedding', extra: 45 },
  { value: 'Sculptural & modern', image: 'pistachio', extra: 40 },
];
const occasions = ['Birthday', 'Wedding', 'Anniversary', 'Baby shower', 'Engagement', 'Corporate event', 'Just because', 'Other'];

const steps = ['Size', 'Flavour', 'Filling', 'Frosting', 'Decoration', 'Inspiration', 'Event date', 'Instructions', 'Contact', 'Review'];

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
  const { demo } = useCatalog();
  const [step, setStep] = useState(0);
  const [s, setS] = useState<State>(initial);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

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

  function validate(i: number): string {
    switch (i) {
      case 0:
        return s.size ? '' : 'Please choose a size.';
      case 1:
        return s.flavor ? '' : 'Please choose a flavour.';
      case 2:
        return s.filling ? '' : 'Please choose a filling.';
      case 3:
        return s.frosting ? '' : 'Please choose a frosting.';
      case 4:
        return s.style ? '' : 'Please choose a decoration style.';
      case 6:
        return s.date ? '' : 'Please select your event date.';
      case 8:
        if (!s.name.trim()) return 'Please tell us your name.';
        if (!/^\S+@\S+\.\S+$/.test(s.email)) return 'Please enter a valid email address.';
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
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (status === 'sent') {
    return (
      <div className="builder builder--done" role="status">
        <span className="builder__done-icon">
          <Icon name="check" />
        </span>
        <h3>Thank you, {s.name.split(' ')[0]}.</h3>
        <p className="lead">
          Your custom cake request is with our team. We’ll be in touch at <strong>{s.email}</strong> within 48 hours with a personal quote and design
          ideas for {formatDate(s.date)}.
        </p>
        <button
          className="btn btn--outline"
          onClick={() => {
            setS(initial);
            setStep(0);
            setStatus('idle');
          }}
        >
          Start another request
        </button>
      </div>
    );
  }

  return (
    <form className="builder" onSubmit={submit} noValidate>
      <div className="builder__progress">
        <p className="builder__count">
          Step {step + 1} of {steps.length} <span aria-hidden="true">·</span> <strong>{steps[step]}</strong>
        </p>
        <ol className="builder__bar" aria-label="Progress">
          {steps.map((label, i) => (
            <li key={label} className={i < step ? 'is-done' : i === step ? 'is-current' : ''}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => setStep(i)}
                aria-label={`${label}${i < step ? ' (completed)' : ''}`}
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
          <h3 ref={headingRef} tabIndex={-1} className="builder__title">
            {stepTitle(step)}
          </h3>

          {step === 0 && (
            <OptionGroup
              name="b-size"
              legend="Cake size"
              value={s.size}
              onChange={(v) => set('size', v)}
              min={150}
              choices={sizes.map((x) => ({ value: x.value, title: x.title, meta: x.meta, price: x.price, priceMode: 'absolute' }))}
            />
          )}
          {step === 1 && (
            <OptionGroup name="b-flavor" legend="Sponge flavour" value={s.flavor} onChange={(v) => set('flavor', v)} min={170} choices={flavors.map((f) => ({ value: f, title: f }))} />
          )}
          {step === 2 && (
            <OptionGroup name="b-filling" legend="Filling" value={s.filling} onChange={(v) => set('filling', v)} min={190} choices={fillings.map((f) => ({ value: f, title: f }))} />
          )}
          {step === 3 && (
            <OptionGroup
              name="b-frosting"
              legend="Frosting"
              value={s.frosting}
              onChange={(v) => set('frosting', v)}
              min={200}
              choices={frostings.map((f) => ({ value: f.value, title: f.value, meta: f.meta }))}
            />
          )}
          {step === 4 && (
            <fieldset className="opt-group">
              <legend className="field__label">Decoration style</legend>
              <div className="style-grid">
                {styles.map((st) => (
                  <label key={st.value} className="style-card">
                    <input type="radio" name="b-style" value={st.value} checked={s.style === st.value} onChange={() => set('style', st.value)} />
                    <Img src={st.image} alt="" ratio="1 / 1" width={400} sizes="(min-width: 900px) 180px, 45vw" />
                    <span className="style-card__label">
                      {st.value}
                      <span className="option__price">{st.extra ? `from + ${formatPrice(st.extra)}` : 'Included'}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {step === 5 && <InspirationUpload files={s.files} onChange={(f) => set('files', f)} />}
          {step === 6 && (
            <div className="builder__date">
              <AvailabilityCalendar leadDays={availability.customLeadDays} value={s.date} onChange={(d) => set('date', d)} label="Choose your event date" />
              <div className="stack">
                <p className="small muted">
                  Custom cakes need at least {availability.customLeadDays} days notice. Weddings and tiered cakes are best booked 4–8 weeks ahead.
                </p>
                {s.date && (
                  <p className="builder__picked">
                    <Icon name="calendar" /> {formatDate(s.date)}
                  </p>
                )}
                <div className="field">
                  <label className="field__label" htmlFor="b-occasion">
                    Occasion
                  </label>
                  <select id="b-occasion" className="select" value={s.occasion} onChange={(e) => set('occasion', e.target.value)}>
                    <option value="">Select an occasion</option>
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
                Special instructions
              </label>
              <textarea
                id="b-instructions"
                className="textarea"
                rows={6}
                maxLength={1500}
                placeholder="Colours, theme, message on the cake, number of guests, dietary needs…"
                value={s.instructions}
                onChange={(e) => set('instructions', e.target.value)}
              />
              <span className="field__hint">The more you share, the closer our first sketch will be.</span>
            </div>
          )}
          {step === 8 && (
            <div className="form-grid form-grid--2">
              <div className="field span-2">
                <label className="field__label" htmlFor="b-name">
                  Full name
                </label>
                <input id="b-name" className="input" autoComplete="name" value={s.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="b-email">
                  Email
                </label>
                <input id="b-email" className="input" type="email" autoComplete="email" value={s.email} onChange={(e) => set('email', e.target.value)} required />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="b-phone">
                  Phone <span className="opt-group__hint">Optional</span>
                </label>
                <input id="b-phone" className="input" type="tel" autoComplete="tel" value={s.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
            </div>
          )}
          {step === 9 && (
            <div className="builder__review">
              <dl className="review-list">
                {[
                  ['Size', s.size, 0],
                  ['Flavour', s.flavor, 1],
                  ['Filling', s.filling, 2],
                  ['Frosting', s.frosting, 3],
                  ['Decoration', s.style, 4],
                  ['Inspiration', s.files.length ? `${s.files.length} image${s.files.length > 1 ? 's' : ''}` : 'None added', 5],
                  ['Event', `${formatDate(s.date)}${s.occasion ? ` · ${s.occasion}` : ''}`, 6],
                  ['Instructions', s.instructions || '—', 7],
                  ['Contact', `${s.name} · ${s.email}${s.phone ? ` · ${s.phone}` : ''}`, 8],
                ].map(([label, value, i]) => (
                  <div key={label as string}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                    <button type="button" className="review-list__edit" onClick={() => setStep(i as number)}>
                      Edit<span className="visually-hidden"> {label}</span>
                    </button>
                  </div>
                ))}
              </dl>
              <p className="small muted">
                Submitting is free and doesn’t commit you to anything. We’ll reply with a quote and a design sketch; your date is reserved once you approve
                and pay the deposit.
              </p>
            </div>
          )}

          {error && (
            <p className="notice notice--error" role="alert">
              <Icon name="info" /> {error}
            </p>
          )}

          <div className="builder__nav">
            {step > 0 ? (
              <button type="button" className="btn btn--outline" onClick={() => setStep(step - 1)}>
                <Icon name="arrowLeft" /> Back
              </button>
            ) : (
              <span />
            )}
            {step < steps.length - 1 ? (
              <button key="next" type="button" className="btn" onClick={next}>
                {step === 5 && s.files.length === 0 ? 'Skip for now' : 'Continue'} <Icon name="arrow" />
              </button>
            ) : (
              // Distinct key: reusing the "Continue" node would let its click submit the form.
              <button key="submit" type="submit" className="btn btn--gold" disabled={status === 'sending'}>
                {status === 'sending' ? <span className="spinner" aria-label="Sending" /> : 'Submit Request'}
              </button>
            )}
          </div>
        </div>

        <aside className="builder__summary" aria-label="Your cake so far">
          <p className="eyebrow eyebrow--plain">Your cake</p>
          <ul>
            {[
              ['Size', s.size],
              ['Flavour', s.flavor],
              ['Filling', s.filling],
              ['Frosting', s.frosting],
              ['Style', s.style],
              ['Date', s.date ? formatDate(s.date, { month: 'short', day: 'numeric', weekday: 'short' }) : ''],
            ].map(([k, v]) => (
              <li key={k} className={v ? 'is-set' : ''}>
                <span>{k}</span>
                <span>{v || '—'}</span>
              </li>
            ))}
          </ul>
          <div className="builder__estimate">
            <span>Estimated from</span>
            <span className="serif">{estimate ? formatPrice(estimate) : '—'}</span>
          </div>
          <p className="small muted">Final price is confirmed in your personal quote.</p>
          {demo && <p className="small muted">Demo mode: requests aren’t sent until Supabase is connected.</p>}
        </aside>
      </div>
    </form>
  );
}

function stepTitle(i: number) {
  return [
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
  ][i];
}

function InspirationUpload({ files, onChange }: { files: File[]; onChange: (f: File[]) => void }) {
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
        <span className="upload__title">Drop images here or browse</span>
        <span className="small muted">Up to {MAX} images · JPG, PNG or HEIC · 10 MB each. Optional.</span>
      </label>
      {previews.length > 0 && (
        <ul className="upload__previews">
          {previews.map((src, i) => (
            <li key={src}>
              <img src={src} alt={`Inspiration ${i + 1}`} />
              <button type="button" aria-label={`Remove inspiration image ${i + 1}`} onClick={() => onChange(files.filter((_, j) => j !== i))}>
                <Icon name="close" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
