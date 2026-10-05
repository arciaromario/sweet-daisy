import { useState, type FormEvent } from 'react';
import { joinNewsletter } from '../lib/api';
import { DaisyMark } from './Logo';
import { Reveal } from './Reveal';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setState('error');
      setError('Please enter a valid email address.');
      return;
    }
    setState('loading');
    try {
      await joinNewsletter(email);
      setState('done');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <section className="newsletter section" aria-labelledby="newsletter-title">
      <Reveal className="container container--narrow newsletter__inner">
        <DaisyMark className="newsletter__mark" />
        <h2 id="newsletter-title">Something sweet is coming.</h2>
        <p className="lead">Join our list for seasonal treats, new collections and special offers.</p>
        {state === 'done' ? (
          <p className="newsletter__done" role="status">
            Welcome to the Sweet List — look out for something lovely in your inbox.
          </p>
        ) : (
          <form className="newsletter__form" onSubmit={onSubmit} noValidate>
            <label htmlFor="newsletter-email" className="visually-hidden">
              Email address
            </label>
            <input
              id="newsletter-email"
              className="input"
              type="email"
              placeholder="Email address"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={state === 'error'}
              aria-describedby={state === 'error' ? 'newsletter-error' : undefined}
              required
            />
            <button className="btn" type="submit" disabled={state === 'loading'}>
              {state === 'loading' ? <span className="spinner" aria-label="Joining" /> : 'Join the Sweet List'}
            </button>
          </form>
        )}
        {state === 'error' && (
          <p id="newsletter-error" className="field__error" role="alert">
            {error}
          </p>
        )}
        <p className="small muted">No spam, ever. Unsubscribe at any time.</p>
      </Reveal>
    </section>
  );
}
