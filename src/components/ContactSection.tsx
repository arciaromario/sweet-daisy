import { useState, type FormEvent } from "react";
import { Icon } from "./Icon";
import { Reveal } from "./Reveal";
import { useSite } from "../context/CatalogContext";
import { useCopy } from "../i18n";
import { sendContactMessage } from "../lib/api";

const topics = [
  "General question",
  "Existing order",
  "Custom cake",
  "Wedding enquiry",
  "Corporate & events",
  "Press & collaborations",
];

const en = {
  // Shown labels for `topics`, same order. The English value is what gets sent.
  topics,
  errInvalid: "Please add your name, a valid email and a short message.",
  errGeneric: "Something went wrong.",
  eyebrow: "Contact",
  title: "We’d love to hear from you.",
  intro:
    "Questions, orders or a celebration on the horizon — send us a note and we’ll reply within one working day.",
  visit: "Visit the studio",
  hours: "Opening hours",
  thanks: (name: string) => `Thank you, ${name}.`,
  sent: (email: string) =>
    `Your message is on its way. We’ll reply to ${email} shortly.`,
  formTitle: "Send a message",
  name: "Name",
  email: "Email",
  topic: "Topic",
  message: "Message",
  sending: "Sending",
  send: "Send message",
};
const es: typeof en = {
  topics: [
    "Pregunta general",
    "Pedido existente",
    "Pastel personalizado",
    "Consulta para boda",
    "Empresas y eventos",
    "Prensa y colaboraciones",
  ],
  errInvalid:
    "Agrega tu nombre, un correo electrónico válido y un mensaje breve.",
  errGeneric: "Algo salió mal.",
  eyebrow: "Contacto",
  title: "Nos encantaría saber de ti.",
  intro:
    "Preguntas, pedidos o una celebración en puerta: escríbenos y te responderemos en un día hábil.",
  visit: "Visita el estudio",
  hours: "Horario",
  thanks: (name) => `Gracias, ${name}.`,
  sent: (email) =>
    `Tu mensaje va en camino. Te responderemos pronto a ${email}.`,
  formTitle: "Envíanos un mensaje",
  name: "Nombre",
  email: "Correo electrónico",
  topic: "Tema",
  message: "Mensaje",
  sending: "Enviando",
  send: "Enviar mensaje",
};

/** Contact details, opening hours and the message form, shown on the home page. */
export function ContactSection() {
  const site = useSite();
  const t = useCopy({ en, es });
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: topics[0],
    message: "",
  });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !/^\S+@\S+\.\S+$/.test(form.email) ||
      form.message.trim().length < 5
    ) {
      setError(t.errInvalid);
      return;
    }
    setError("");
    setState("sending");
    try {
      await sendContactMessage(form);
      setState("sent");
    } catch (err) {
      setState("idle");
      setError(err instanceof Error ? err.message : t.errGeneric);
    }
  }

  return (
    <section
      id="contact"
      className="section anchor-section"
      aria-labelledby="contact-title"
    >
      <div className="container">
        <Reveal className="section-head section-head--center">
          <div className="section-head__text">
            <span className="eyebrow eyebrow--plain">{t.eyebrow}</span>
            <h2 id="contact-title">{t.title}</h2>
            <p className="muted">{t.intro}</p>
          </div>
        </Reveal>
        <div className="contact">
          <div className="contact__info">
            <div className="contact__block">
              <h3 className="contact__title">{t.visit}</h3>
              <p>
                <Icon name="pin" /> {site.address.street}, {site.address.city},{" "}
                {site.address.region} {site.address.postal}
              </p>
              <p>
                <Icon name="phone" /> <a href={site.phoneHref}>{site.phone}</a>
              </p>
              <p>
                <Icon name="mail" />{" "}
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </p>
            </div>
            <div className="contact__block">
              <h3 className="contact__title">{t.hours}</h3>
              <dl className="hours">
                {site.hours.map((h) => (
                  <div key={h.days}>
                    <dt>{h.days}</dt>
                    <dd>{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="contact__form-wrap">
            {state === "sent" ? (
              <div className="builder--done" role="status">
                <span className="builder__done-icon">
                  <Icon name="check" />
                </span>
                <h2>{t.thanks(form.name.split(" ")[0])}</h2>
                <p className="lead">{t.sent(form.email)}</p>
              </div>
            ) : (
              <form
                className="form-grid form-grid--2 contact__form"
                onSubmit={onSubmit}
                noValidate
              >
                <h3 className="span-2 contact__title">{t.formTitle}</h3>
                <div className="field">
                  <label className="field__label" htmlFor="ct-name">
                    {t.name}
                  </label>
                  <input
                    id="ct-name"
                    className="input"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="ct-email">
                    {t.email}
                  </label>
                  <input
                    id="ct-email"
                    className="input"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div className="field span-2">
                  <label className="field__label" htmlFor="ct-topic">
                    {t.topic}
                  </label>
                  <select
                    id="ct-topic"
                    className="select"
                    value={form.topic}
                    onChange={(e) =>
                      setForm({ ...form, topic: e.target.value })
                    }
                  >
                    {topics.map((topic, i) => (
                      <option key={topic} value={topic}>
                        {t.topics[i]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field span-2">
                  <label className="field__label" htmlFor="ct-message">
                    {t.message}
                  </label>
                  <textarea
                    id="ct-message"
                    className="textarea"
                    rows={6}
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                  />
                </div>
                {error && (
                  <p className="notice notice--error span-2" role="alert">
                    <Icon name="info" /> {error}
                  </p>
                )}
                <div className="span-2">
                  <button
                    className="btn"
                    type="submit"
                    disabled={state === "sending"}
                  >
                    {state === "sending" ? (
                      <span className="spinner" aria-label={t.sending} />
                    ) : (
                      t.send
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
