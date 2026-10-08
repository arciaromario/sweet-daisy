import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { Seo } from '../components/Seo';
import { formatPrice } from '../data/products';
import { useSettings, useSite } from '../context/CatalogContext';
import { useCopy } from '../i18n';

function Prose({ children }: { children: ReactNode }) {
  return <div className="container container--text prose">{children}</div>;
}

interface FaqVars {
  leadDays: number;
  depositPercent: number;
  radius: string;
  fee: string;
  freeOver: string;
}

const faqEn = {
  items: (v: FaqVars): { q: string; a: ReactNode }[] => [
    { q: 'How far in advance should I order?', a: `Most shop cakes need 24–48 hours notice; cookies are baked daily. Custom cakes need at least ${v.leadDays} days, and weddings or tiered cakes are best booked 4–8 weeks ahead.` },
    { q: 'Do you offer gluten-free or vegan options?', a: 'We offer gluten-free sponges for most cakes (look for the gluten-free flavour option). Vegan cakes are available on request as custom orders. Our kitchen handles nuts, gluten, dairy and eggs, so we cannot guarantee an allergen-free environment.' },
    { q: 'How should I store my cake?', a: 'Keep your cake refrigerated and bring it to room temperature for about an hour before serving — buttercream is at its silkiest when not too cold.' },
    { q: 'Can I add a message to my cake?', a: 'Yes. Most cakes include an optional custom message of up to 40 characters, piped by hand or written on a plaque.' },
    { q: 'Do you deliver?', a: <>We deliver {v.radius}. Delivery is {v.fee}, or free on orders over {v.freeOver}. See <Link to="/shipping-delivery">Shipping & Delivery</Link>.</> },
    { q: 'Can I change or cancel my order?', a: 'Changes and cancellations are free up to 48 hours before your pickup or delivery time. Custom cake deposits are non-refundable within 14 days of the event.' },
    { q: 'How does the custom cake process work?', a: <>Submit a request through our <Link to="/custom-cakes">custom cake builder</Link>. We reply within 48 hours with a quote and design notes. Your date is reserved once you approve the design and pay a {v.depositPercent}% deposit.</> },
  ],
  seoTitle: 'FAQ',
  seoDescription: 'Answers to common questions about ordering, delivery, allergens and custom cakes at Sweet Daisy.',
  eyebrow: 'Help',
  title: 'Frequently asked questions',
  crumb: 'FAQ',
  more: <>Still curious? <Link to="/contact">Get in touch</Link> — we’re happy to help.</>,
};

const faqEs: typeof faqEn = {
  items: (v) => [
    { q: '¿Con cuánta anticipación debo hacer mi pedido?', a: `La mayoría de los pasteles de la tienda necesitan entre 24 y 48 horas de anticipación; las galletas se hornean a diario. Los pasteles personalizados necesitan al menos ${v.leadDays} días, y para bodas o pasteles de varios pisos lo mejor es reservar con 4 a 8 semanas de anticipación.` },
    { q: '¿Tienen opciones sin gluten o veganas?', a: 'Ofrecemos bizcocho sin gluten para la mayoría de los pasteles (busca la opción de sabor sin gluten). Los pasteles veganos están disponibles bajo pedido como pedidos personalizados. En nuestra cocina se manejan nueces, gluten, lácteos y huevo, por lo que no podemos garantizar un ambiente libre de alérgenos.' },
    { q: '¿Cómo debo conservar mi pastel?', a: 'Guarda tu pastel en el refrigerador y déjalo a temperatura ambiente durante una hora aproximadamente antes de servirlo: el buttercream queda más suave cuando no está demasiado frío.' },
    { q: '¿Puedo agregar un mensaje a mi pastel?', a: 'Sí. La mayoría de los pasteles incluyen un mensaje personalizado opcional de hasta 40 caracteres, escrito a mano con manga pastelera o en una placa.' },
    { q: '¿Hacen entregas a domicilio?', a: <>Hacemos entregas a domicilio en nuestra zona ({v.radius}). La entrega a domicilio cuesta {v.fee}, o es gratis en pedidos de más de {v.freeOver}. Consulta <Link to="/shipping-delivery">Envíos y entregas</Link>.</> },
    { q: '¿Puedo cambiar o cancelar mi pedido?', a: 'Los cambios y cancelaciones son gratuitos hasta 48 horas antes de la hora de recogida o de entrega a domicilio. Los anticipos de los pasteles personalizados no son reembolsables dentro de los 14 días previos al evento.' },
    { q: '¿Cómo funciona el proceso del pastel personalizado?', a: <>Envía una solicitud con nuestro <Link to="/custom-cakes">creador de pasteles personalizados</Link>. Te respondemos en un plazo de 48 horas con un presupuesto y notas de diseño. Tu fecha queda reservada cuando apruebas el diseño y pagas un anticipo del {v.depositPercent}%.</> },
  ],
  seoTitle: 'Preguntas frecuentes',
  seoDescription: 'Respuestas a las preguntas más comunes sobre pedidos, entregas a domicilio, alérgenos y pasteles personalizados en Sweet Daisy.',
  eyebrow: 'Ayuda',
  title: 'Preguntas frecuentes',
  crumb: 'Preguntas frecuentes',
  more: <>¿Te queda alguna duda? <Link to="/contact">Escríbenos</Link>: con gusto te ayudamos.</>,
};

function useFaqs(): { q: string; a: ReactNode }[] {
  const site = useSite();
  const { custom } = useSettings();
  const t = useCopy({ en: faqEn, es: faqEs });
  return t.items({
    leadDays: custom.leadDays,
    depositPercent: custom.depositPercent,
    radius: site.delivery.radius,
    fee: formatPrice(site.delivery.fee),
    freeOver: formatPrice(site.delivery.freeOver),
  });
}

export function Faq() {
  const faqs = useFaqs();
  const t = useCopy({ en: faqEn, es: faqEs });
  return (
    <>
      <Seo title={t.seoTitle} description={t.seoDescription} path="/faq" />
      <PageHeader eyebrow={t.eyebrow} title={t.title} crumbs={[{ label: t.crumb }]} />
      <div className="container container--text">
        <div className="accordion accordion--large">
          {faqs.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary>
                {f.q}
                <span className="accordion__icon" aria-hidden="true" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <p className="muted faq__more">{t.more}</p>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.filter((f) => typeof f.a === 'string').map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
          }),
        }}
      />
    </>
  );
}

interface ShippingVars {
  street: string;
  city: string;
  pickupSlots: string;
  radius: string;
  fee: string;
  freeOver: string;
  deliverySlots: string;
  leadDays: number;
}

const shippingEn = {
  title: 'Shipping & Delivery',
  eyebrow: 'Help',
  pickupTitle: 'Studio pickup',
  pickup: (v: ShippingVars): ReactNode => (
    <>
      Pickup is always free from {v.street}, {v.city}. Choose a pickup window at checkout: {v.pickupSlots}.
      Please bring your order number and allow a flat, level surface in your car.
    </>
  ),
  deliveryTitle: 'Local delivery',
  delivery: (v: ShippingVars): ReactNode => (
    <>
      We hand-deliver {v.radius}, in temperature-controlled vehicles. Delivery costs {v.fee} and is
      free on orders over {v.freeOver}. Delivery windows: {v.deliverySlots}.
    </>
  ),
  shippingTitle: 'Shipping',
  shipping: 'Because our cakes are fresh and delicate, we don’t ship cakes. Cookies and macarons can be shipped nationwide on request — contact us for details.',
  leadTitle: 'Lead times',
  leadCookies: 'Cookies & daily bakes: same day',
  leadMini: 'Mini cakes, cupcakes & tartlets: 24 hours',
  leadCelebration: 'Celebration cakes: 48 hours',
  leadCustom: (days: number) => `Custom cakes: from ${days} days`,
};

const shippingEs: typeof shippingEn = {
  title: 'Envíos y entregas',
  eyebrow: 'Ayuda',
  pickupTitle: 'Recogida en el estudio',
  pickup: (v) => (
    <>
      La recogida siempre es gratis en {v.street}, {v.city}. Elige un horario de recogida al finalizar la compra: {v.pickupSlots}.
      Trae tu número de pedido y prevé una superficie plana y nivelada en tu auto.
    </>
  ),
  deliveryTitle: 'Entrega a domicilio local',
  delivery: (v) => (
    <>
      Entregamos en mano en nuestra zona ({v.radius}), en vehículos con temperatura controlada. La entrega a domicilio cuesta {v.fee} y es
      gratis en pedidos de más de {v.freeOver}. Horarios de entrega: {v.deliverySlots}.
    </>
  ),
  shippingTitle: 'Envíos',
  shipping: 'Como nuestros pasteles son frescos y delicados, no enviamos pasteles por paquetería. Las galletas y los macarons se pueden enviar a todo el país bajo pedido: contáctanos para más detalles.',
  leadTitle: 'Tiempos de anticipación',
  leadCookies: 'Galletas y horneados del día: el mismo día',
  leadMini: 'Minipasteles, cupcakes y tartaletas: 24 horas',
  leadCelebration: 'Pasteles de celebración: 48 horas',
  leadCustom: (days) => `Pasteles personalizados: desde ${days} días`,
};

export function ShippingDelivery() {
  const site = useSite();
  const { store, custom } = useSettings();
  const t = useCopy({ en: shippingEn, es: shippingEs });
  const v: ShippingVars = {
    street: site.address.street,
    city: site.address.city,
    pickupSlots: store.pickupSlots.join(', '),
    radius: site.delivery.radius,
    fee: formatPrice(site.delivery.fee),
    freeOver: formatPrice(site.delivery.freeOver),
    deliverySlots: store.deliverySlots.join(', '),
    leadDays: custom.leadDays,
  };
  return (
    <>
      <Seo title={t.title} path="/shipping-delivery" />
      <PageHeader eyebrow={t.eyebrow} title={t.title} crumbs={[{ label: t.title }]} />
      <Prose>
        <h2>{t.pickupTitle}</h2>
        <p>{t.pickup(v)}</p>
        <h2>{t.deliveryTitle}</h2>
        <p>{t.delivery(v)}</p>
        <h2>{t.shippingTitle}</h2>
        <p>{t.shipping}</p>
        <h2>{t.leadTitle}</h2>
        <ul>
          <li>{t.leadCookies}</li>
          <li>{t.leadMini}</li>
          <li>{t.leadCelebration}</li>
          <li>{t.leadCustom(v.leadDays)}</li>
        </ul>
      </Prose>
    </>
  );
}

const termsEn = {
  title: 'Terms & Conditions',
  eyebrow: 'Legal',
  template: 'Template terms — review with your legal adviser before launch.',
  ordersTitle: 'Orders',
  orders: 'An order is confirmed once you receive an email confirmation with your order number. Prices include all ingredients, decoration and packaging.',
  changesTitle: 'Changes & cancellations',
  changes: 'Orders can be changed or cancelled free of charge up to 48 hours before the pickup or delivery time. Within 48 hours, orders are non-refundable as baking has begun.',
  customTitle: 'Custom cakes',
  custom: (pct: number) =>
    `Custom cakes are reserved with a ${pct}% non-refundable deposit. The balance is due 7 days before the event. Designs are interpreted by hand and may vary slightly from inspiration images.`,
  allergensTitle: 'Allergens',
  allergens: 'Our kitchen handles wheat, eggs, dairy, soy and nuts. While we take great care, we cannot guarantee any product is free from allergens.',
  collectionTitle: 'Collection & delivery',
  collection: 'Once a cake has been collected or delivered, Sweet Daisy is not responsible for damage caused by transport or storage.',
};

const termsEs: typeof termsEn = {
  title: 'Términos y condiciones',
  eyebrow: 'Legal',
  template: 'Términos de plantilla: revísalos con tu asesor legal antes del lanzamiento.',
  ordersTitle: 'Pedidos',
  orders: 'Un pedido queda confirmado cuando recibes un correo electrónico de confirmación con tu número de pedido. Los precios incluyen todos los ingredientes, la decoración y el empaque.',
  changesTitle: 'Cambios y cancelaciones',
  changes: 'Los pedidos se pueden cambiar o cancelar sin costo hasta 48 horas antes de la hora de recogida o de entrega a domicilio. Dentro de esas 48 horas, los pedidos no son reembolsables, ya que el horneado ha comenzado.',
  customTitle: 'Pasteles personalizados',
  custom: (pct) =>
    `Los pasteles personalizados se reservan con un anticipo no reembolsable del ${pct}%. El saldo debe pagarse 7 días antes del evento. Los diseños se interpretan a mano y pueden variar ligeramente con respecto a las imágenes de inspiración.`,
  allergensTitle: 'Alérgenos',
  allergens: 'En nuestra cocina se manejan trigo, huevo, lácteos, soya y nueces. Aunque tomamos todas las precauciones, no podemos garantizar que ningún producto esté libre de alérgenos.',
  collectionTitle: 'Recogida y entrega a domicilio',
  collection: 'Una vez que un pastel ha sido recogido o entregado, Sweet Daisy no se hace responsable de los daños causados por el transporte o el almacenamiento.',
};

export function Terms() {
  const { custom } = useSettings();
  const t = useCopy({ en: termsEn, es: termsEs });
  return (
    <>
      <Seo title={t.title} path="/terms" />
      <PageHeader eyebrow={t.eyebrow} title={t.title} crumbs={[{ label: t.title }]} />
      <Prose>
        <p className="muted">{t.template}</p>
        <h2>{t.ordersTitle}</h2>
        <p>{t.orders}</p>
        <h2>{t.changesTitle}</h2>
        <p>{t.changes}</p>
        <h2>{t.customTitle}</h2>
        <p>{t.custom(custom.depositPercent)}</p>
        <h2>{t.allergensTitle}</h2>
        <p>{t.allergens}</p>
        <h2>{t.collectionTitle}</h2>
        <p>{t.collection}</p>
      </Prose>
    </>
  );
}

const privacyEn = {
  title: 'Privacy Policy',
  eyebrow: 'Legal',
  template: 'Template policy — review with your legal adviser before launch.',
  collectTitle: 'What we collect',
  collect: 'When you place an order, request a custom cake or join our newsletter we collect your name, contact details, order details and any images you choose to upload.',
  useTitle: 'How we use it',
  use: 'We use your information only to prepare and deliver your order, reply to your enquiries and — if you opt in — send our newsletter. We never sell your data.',
  storedTitle: 'Where it is stored',
  stored: 'Data is stored securely with our infrastructure provider (Supabase). Payments are processed by our payment provider; we never store card details.',
  rightsTitle: 'Your rights',
  rights: (email: string): ReactNode => (
    <>
      You can ask to access, correct or delete your data at any time by emailing <a href={`mailto:${email}`}>{email}</a>.
    </>
  ),
};

const privacyEs: typeof privacyEn = {
  title: 'Política de privacidad',
  eyebrow: 'Legal',
  template: 'Política de plantilla: revísala con tu asesor legal antes del lanzamiento.',
  collectTitle: 'Qué datos recopilamos',
  collect: 'Cuando haces un pedido, solicitas un pastel personalizado o te suscribes a nuestro boletín, recopilamos tu nombre, tus datos de contacto, los detalles de tu pedido y cualquier imagen que decidas subir.',
  useTitle: 'Cómo los usamos',
  use: 'Usamos tu información únicamente para preparar y entregar tu pedido, responder a tus consultas y, si das tu consentimiento, enviarte nuestro boletín. Nunca vendemos tus datos.',
  storedTitle: 'Dónde se almacenan',
  stored: 'Los datos se almacenan de forma segura con nuestro proveedor de infraestructura (Supabase). Los pagos los procesa nuestro proveedor de pagos; nunca guardamos los datos de tu tarjeta.',
  rightsTitle: 'Tus derechos',
  rights: (email) => (
    <>
      Puedes solicitar el acceso, la corrección o la eliminación de tus datos en cualquier momento escribiendo a <a href={`mailto:${email}`}>{email}</a>.
    </>
  ),
};

export function Privacy() {
  const site = useSite();
  const t = useCopy({ en: privacyEn, es: privacyEs });
  return (
    <>
      <Seo title={t.title} path="/privacy" />
      <PageHeader eyebrow={t.eyebrow} title={t.title} crumbs={[{ label: t.title }]} />
      <Prose>
        <p className="muted">{t.template}</p>
        <h2>{t.collectTitle}</h2>
        <p>{t.collect}</p>
        <h2>{t.useTitle}</h2>
        <p>{t.use}</p>
        <h2>{t.storedTitle}</h2>
        <p>{t.stored}</p>
        <h2>{t.rightsTitle}</h2>
        <p>{t.rights(site.email)}</p>
      </Prose>
    </>
  );
}
