import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { Seo } from '../components/Seo';
import { formatPrice } from '../data/products';
import { availability, site } from '../data/site';

function Prose({ children }: { children: ReactNode }) {
  return <div className="container container--text prose">{children}</div>;
}

const faqs: { q: string; a: ReactNode }[] = [
  { q: 'How far in advance should I order?', a: 'Most shop cakes need 24–48 hours notice; cookies are baked daily. Custom cakes need at least 7 days, and weddings or tiered cakes are best booked 4–8 weeks ahead.' },
  { q: 'Do you offer gluten-free or vegan options?', a: 'We offer gluten-free sponges for most cakes (look for the gluten-free flavour option). Vegan cakes are available on request as custom orders. Our kitchen handles nuts, gluten, dairy and eggs, so we cannot guarantee an allergen-free environment.' },
  { q: 'How should I store my cake?', a: 'Keep your cake refrigerated and bring it to room temperature for about an hour before serving — buttercream is at its silkiest when not too cold.' },
  { q: 'Can I add a message to my cake?', a: 'Yes. Most cakes include an optional custom message of up to 40 characters, piped by hand or written on a plaque.' },
  { q: 'Do you deliver?', a: <>We deliver {site.delivery.radius}, Tuesday to Sunday. Delivery is {formatPrice(site.delivery.fee)}, or free on orders over {formatPrice(site.delivery.freeOver)}. See <Link to="/shipping-delivery">Shipping & Delivery</Link>.</> },
  { q: 'Can I change or cancel my order?', a: 'Changes and cancellations are free up to 48 hours before your pickup or delivery time. Custom cake deposits are non-refundable within 14 days of the event.' },
  { q: 'How does the custom cake process work?', a: <>Submit a request through our <Link to="/custom-cakes">custom cake builder</Link>. We reply within 48 hours with a quote and design notes. Your date is reserved once you approve the design and pay a 30% deposit.</> },
];

export function Faq() {
  return (
    <>
      <Seo title="FAQ" description="Answers to common questions about ordering, delivery, allergens and custom cakes at Sweet Daisy." path="/faq" />
      <PageHeader eyebrow="Help" title="Frequently asked questions" crumbs={[{ label: 'FAQ' }]} />
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
        <p className="muted faq__more">
          Still curious? <Link to="/contact">Get in touch</Link> — we’re happy to help.
        </p>
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

export function ShippingDelivery() {
  return (
    <>
      <Seo title="Shipping & Delivery" path="/shipping-delivery" />
      <PageHeader eyebrow="Help" title="Shipping & Delivery" crumbs={[{ label: 'Shipping & Delivery' }]} />
      <Prose>
        <h2>Studio pickup</h2>
        <p>
          Pickup is always free from {site.address.street}, {site.address.city}. Choose a pickup window at checkout: {availability.pickupSlots.join(', ')}.
          Please bring your order number and allow a flat, level surface in your car.
        </p>
        <h2>Local delivery</h2>
        <p>
          We hand-deliver {site.delivery.radius}, Tuesday to Sunday, in temperature-controlled vehicles. Delivery costs {formatPrice(site.delivery.fee)} and is
          free on orders over {formatPrice(site.delivery.freeOver)}. Delivery windows: {availability.deliverySlots.join(', ')}.
        </p>
        <h2>Shipping</h2>
        <p>Because our cakes are fresh and delicate, we don’t ship cakes. Cookies and macarons can be shipped nationwide on request — contact us for details.</p>
        <h2>Lead times</h2>
        <ul>
          <li>Cookies & daily bakes: same day</li>
          <li>Mini cakes, cupcakes & tartlets: 24 hours</li>
          <li>Celebration cakes: 48 hours</li>
          <li>Custom cakes: from {availability.customLeadDays} days</li>
        </ul>
      </Prose>
    </>
  );
}

export function Terms() {
  return (
    <>
      <Seo title="Terms & Conditions" path="/terms" />
      <PageHeader eyebrow="Legal" title="Terms & Conditions" crumbs={[{ label: 'Terms & Conditions' }]} />
      <Prose>
        <p className="muted">Template terms — review with your legal adviser before launch.</p>
        <h2>Orders</h2>
        <p>An order is confirmed once you receive an email confirmation with your order number. Prices include all ingredients, decoration and packaging.</p>
        <h2>Changes & cancellations</h2>
        <p>Orders can be changed or cancelled free of charge up to 48 hours before the pickup or delivery time. Within 48 hours, orders are non-refundable as baking has begun.</p>
        <h2>Custom cakes</h2>
        <p>Custom cakes are reserved with a 30% non-refundable deposit. The balance is due 7 days before the event. Designs are interpreted by hand and may vary slightly from inspiration images.</p>
        <h2>Allergens</h2>
        <p>Our kitchen handles wheat, eggs, dairy, soy and nuts. While we take great care, we cannot guarantee any product is free from allergens.</p>
        <h2>Collection & delivery</h2>
        <p>Once a cake has been collected or delivered, Sweet Daisy is not responsible for damage caused by transport or storage.</p>
      </Prose>
    </>
  );
}

export function Privacy() {
  return (
    <>
      <Seo title="Privacy Policy" path="/privacy" />
      <PageHeader eyebrow="Legal" title="Privacy Policy" crumbs={[{ label: 'Privacy Policy' }]} />
      <Prose>
        <p className="muted">Template policy — review with your legal adviser before launch.</p>
        <h2>What we collect</h2>
        <p>When you place an order, request a custom cake or join our newsletter we collect your name, contact details, order details and any images you choose to upload.</p>
        <h2>How we use it</h2>
        <p>We use your information only to prepare and deliver your order, reply to your enquiries and — if you opt in — send our newsletter. We never sell your data.</p>
        <h2>Where it is stored</h2>
        <p>Data is stored securely with our infrastructure provider (Supabase). Payments are processed by our payment provider; we never store card details.</p>
        <h2>Your rights</h2>
        <p>
          You can ask to access, correct or delete your data at any time by emailing <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </Prose>
    </>
  );
}
