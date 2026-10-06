import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { Seo } from '../components/Seo';
import { useSite } from '../context/CatalogContext';
import { sendContactMessage } from '../lib/api';

const topics = ['General question', 'Existing order', 'Custom cake', 'Wedding enquiry', 'Corporate & events', 'Press & collaborations'];

export default function Contact() {
  const site = useSite();
  const [form, setForm] = useState({ name: '', email: '', topic: topics[0], message: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || form.message.trim().length < 5) {
      setError('Please add your name, a valid email and a short message.');
      return;
    }
    setError('');
    setState('sending');
    try {
      await sendContactMessage(form);
      setState('sent');
    } catch (err) {
      setState('idle');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <>
      <Seo title="Contact" description={`Contact Sweet Daisy — ${site.address.street}, ${site.address.city}. Opening hours, phone and email.`} path="/contact" />
      <PageHeader eyebrow="Contact" title="We’d love to hear from you." intro="Questions, orders or a celebration on the horizon — send us a note and we’ll reply within one working day." crumbs={[{ label: 'Contact' }]} />

      <section className="container contact">
        <div className="contact__info">
          <div className="contact__block">
            <h2 className="contact__title">Visit the studio</h2>
            <p>
              <Icon name="pin" /> {site.address.street}, {site.address.city}, {site.address.region} {site.address.postal}
            </p>
            <p>
              <Icon name="phone" /> <a href={site.phoneHref}>{site.phone}</a>
            </p>
            <p>
              <Icon name="mail" /> <a href={`mailto:${site.email}`}>{site.email}</a>
            </p>
          </div>
          <div className="contact__block">
            <h2 className="contact__title">Opening hours</h2>
            <dl className="hours">
              {site.hours.map((h) => (
                <div key={h.days}>
                  <dt>{h.days}</dt>
                  <dd>{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="contact__block">
            <h2 className="contact__title">Upcoming availability</h2>
            <p className="muted">
              See the next available dates for treats, celebration cakes and custom cakes.{' '}
              <Link to="/availability" className="link-inline">
                View availability
              </Link>
            </p>
          </div>
        </div>

        <div className="contact__form-wrap">
          {state === 'sent' ? (
            <div className="builder--done" role="status">
              <span className="builder__done-icon">
                <Icon name="check" />
              </span>
              <h2>Thank you, {form.name.split(' ')[0]}.</h2>
              <p className="lead">Your message is on its way. We’ll reply to {form.email} shortly.</p>
            </div>
          ) : (
            <form className="form-grid form-grid--2 contact__form" onSubmit={onSubmit} noValidate>
              <h2 className="span-2 contact__title">Send a message</h2>
              <div className="field">
                <label className="field__label" htmlFor="ct-name">
                  Name
                </label>
                <input id="ct-name" className="input" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="ct-email">
                  Email
                </label>
                <input id="ct-email" className="input" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="field span-2">
                <label className="field__label" htmlFor="ct-topic">
                  Topic
                </label>
                <select id="ct-topic" className="select" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
                  {topics.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="field span-2">
                <label className="field__label" htmlFor="ct-message">
                  Message
                </label>
                <textarea id="ct-message" className="textarea" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </div>
              {error && (
                <p className="notice notice--error span-2" role="alert">
                  <Icon name="info" /> {error}
                </p>
              )}
              <div className="span-2">
                <button className="btn" type="submit" disabled={state === 'sending'}>
                  {state === 'sending' ? <span className="spinner" aria-label="Sending" /> : 'Send message'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
