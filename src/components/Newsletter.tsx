import { useState, type FormEvent } from 'react';
import { useCopy } from '../i18n';
import { joinNewsletter } from '../lib/api';
import { DaisyMark } from './Logo';
import { Reveal } from './Reveal';

const en = {
  invalidEmail: 'Please enter a valid email address.',
  genericError: 'Something went wrong. Please try again.',
  title: 'Something sweet is coming.',
  lead: 'Join our list for seasonal treats, new collections and special offers.',
  done: 'Welcome to the Sweet List — look out for something lovely in your inbox.',
  email: 'Email address',
  joining: 'Joining',
  join: 'Join the Sweet List',
  noSpam: 'No spam, ever. Unsubscribe at any time.',
};
const es: typeof en = {
  invalidEmail: 'Ingresa un correo electrónico válido.',
  genericError: 'Algo salió mal. Inténtalo de nuevo.',
  title: 'Algo dulce está por llegar.',
  lead: 'Únete a nuestra lista para recibir delicias de temporada, nuevas colecciones y ofertas especiales.',
  done: 'Te damos la bienvenida a la Sweet List: pronto recibirás algo lindo en tu correo.',
  email: 'Correo electrónico',
  joining: 'Uniéndote',
  join: 'Unirme a la Sweet List',
  noSpam: 'Nada de spam, nunca. Cancela tu suscripción cuando quieras.',
};

export function Newsletter() {
  const t = useCopy({ en, es });
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setState('error');
      setError(t.invalidEmail);
      return;
    }
    setState('loading');
    try {
      await joinNewsletter(email);
      setState('done');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : t.genericError);
    }
  }

  return (
    <section className="newsletter section" aria-labelledby="newsletter-title">
      <Reveal className="container container--narrow newsletter__inner">
        <DaisyMark className="newsletter__mark" />
        <h2 id="newsletter-title">{t.title}</h2>
        <p className="lead">{t.lead}</p>
        {state === 'done' ? (
          <p className="newsletter__done" role="status">
            {t.done}
          </p>
        ) : (
          <form className="newsletter__form" onSubmit={onSubmit} noValidate>
            <label htmlFor="newsletter-email" className="visually-hidden">
              {t.email}
            </label>
            <input
              id="newsletter-email"
              className="input"
              type="email"
              placeholder={t.email}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={state === 'error'}
              aria-describedby={state === 'error' ? 'newsletter-error' : undefined}
              required
            />
            <button className="btn" type="submit" disabled={state === 'loading'}>
              {state === 'loading' ? <span className="spinner" aria-label={t.joining} /> : t.join}
            </button>
          </form>
        )}
        {state === 'error' && (
          <p id="newsletter-error" className="field__error" role="alert">
            {error}
          </p>
        )}
        <p className="small muted">{t.noSpam}</p>
      </Reveal>
    </section>
  );
}
