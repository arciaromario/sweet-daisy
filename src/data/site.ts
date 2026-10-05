export const site = {
  name: 'Sweet Daisy',
  descriptor: 'Cakes and Treats',
  tagline: 'Cakes made for your sweetest moments.',
  description:
    'Sweet Daisy is a boutique cake studio crafting handmade celebration cakes, mini cakes, cupcakes and treats. Order online for pickup or local delivery, or request a custom cake.',
  email: 'hello@sweetdaisycakes.com',
  phone: '+1 (555) 014-2290',
  phoneHref: 'tel:+15550142290',
  address: { street: '214 Magnolia Street', city: 'Austin', region: 'TX', postal: '78704', country: 'US' },
  instagram: 'https://instagram.com/sweetdaisy',
  facebook: 'https://facebook.com/sweetdaisy',
  tiktok: 'https://tiktok.com/@sweetdaisy',
  handle: '@sweetdaisy',
  hours: [
    { days: 'Tuesday – Friday', time: '9:00 – 18:00' },
    { days: 'Saturday', time: '9:00 – 17:00' },
    { days: 'Sunday', time: '10:00 – 14:00' },
    { days: 'Monday', time: 'Closed — baking day' },
  ],
  delivery: {
    fee: 12,
    freeOver: 120,
    radius: 'within 15 miles of the studio',
  },
};

export const mainNav = [
  { label: 'Home', href: '/' },
  { label: 'Cakes', href: '/cakes' },
  { label: 'Treats', href: '/treats' },
  { label: 'Custom Cakes', href: '/custom-cakes' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const footerNav = [
  { label: 'Shop', href: '/shop' },
  { label: 'Custom Cakes', href: '/custom-cakes' },
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
  { label: 'Shipping & Delivery', href: '/shipping-delivery' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
];

/**
 * Availability rules used by the calendar, product pages, checkout and the custom cake builder.
 * Update `blocked` with dates the studio is fully booked (YYYY-MM-DD) and `limited` for days
 * with only a few slots left.
 */
export const availability = {
  closedWeekdays: [1], // Monday
  blocked: [] as string[],
  limited: [] as string[],
  /** When no explicit dates are configured, a deterministic demo pattern is used. */
  demoPattern: true,
  customLeadDays: 7,
  pickupSlots: ['9:00 – 11:00', '11:00 – 13:00', '13:00 – 15:00', '15:00 – 17:00'],
  deliverySlots: ['10:00 – 13:00', '13:00 – 16:00', '16:00 – 18:00'],
};
