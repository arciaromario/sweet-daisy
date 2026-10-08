/**
 * Editable settings. These defaults are used until the owner saves changes from /admin
 * (stored in the Supabase `settings` table, or in the browser in demo mode).
 */

export interface BusinessSettings {
  email: string;
  phone: string;
  address: { street: string; city: string; region: string; postal: string; country: string };
  hours: { days: string; time: string }[];
  instagram: string;
  facebook: string;
  tiktok: string;
  handle: string;
  announcement: string;
}

export interface StoreSettings {
  /** 0 = Sunday … 6 = Saturday */
  closedWeekdays: number[];
  deliveryFee: number;
  freeDeliveryOver: number;
  deliveryRadius: string;
  pickupSlots: string[];
  deliverySlots: string[];
}

export interface CustomCakeSettings {
  leadDays: number;
  depositPercent: number;
  sizes: { label: string; servings: string; price: number }[];
  flavors: string[];
  fillings: string[];
  frostings: { label: string; note: string }[];
  styles: { label: string; image: string; extra: number }[];
  occasions: string[];
}

export interface Settings {
  business: BusinessSettings;
  store: StoreSettings;
  custom: CustomCakeSettings;
}

export type SettingsKey = keyof Settings;

export const defaultSettings: Settings = {
  business: {
    email: 'hello@sweetdaisycakes.com',
    phone: '+1 (555) 014-2290',
    address: { street: '214 Magnolia Street', city: 'Austin', region: 'TX', postal: '78704', country: 'US' },
    hours: [
      { days: 'Tuesday – Friday', time: '9:00 – 18:00' },
      { days: 'Saturday', time: '9:00 – 17:00' },
      { days: 'Sunday', time: '10:00 – 14:00' },
      { days: 'Monday', time: 'Closed — baking day' },
    ],
    instagram: 'https://instagram.com/sweetdaisy',
    facebook: 'https://facebook.com/sweetdaisy',
    tiktok: 'https://tiktok.com/@sweetdaisy',
    handle: '@sweetdaisy',
    announcement: 'Order a day ahead for fresh-baked cookies',
  },
  store: {
    closedWeekdays: [1],
    deliveryFee: 12,
    freeDeliveryOver: 120,
    deliveryRadius: 'within 15 miles of the studio',
    pickupSlots: ['9:00 – 11:00', '11:00 – 13:00', '13:00 – 15:00', '15:00 – 17:00'],
    deliverySlots: ['10:00 – 13:00', '13:00 – 16:00', '16:00 – 18:00'],
  },
  custom: {
    leadDays: 7,
    depositPercent: 30,
    sizes: [
      { label: '6" round', servings: '8–10 servings', price: 95 },
      { label: '8" round', servings: '14–18 servings', price: 135 },
      { label: '10" round', servings: '24–30 servings', price: 185 },
      { label: 'Two tiers', servings: '30–45 servings', price: 320 },
      { label: 'Three tiers', servings: '60–90 servings', price: 520 },
    ],
    flavors: ['Vanilla bean', 'Dark chocolate', 'Lemon chiffon', 'Red velvet', 'Pistachio', 'Spiced carrot', 'Almond & orange', 'Gluten-free vanilla'],
    fillings: ['Fresh strawberries & cream', 'Raspberry compote', 'Lemon curd', 'Salted caramel', 'Chocolate ganache', 'Passion fruit curd', 'Cream cheese', 'Buttercream only'],
    frostings: [
      { label: 'Swiss meringue buttercream', note: 'Silky, light, not too sweet' },
      { label: 'Cream cheese frosting', note: 'Tangy and rich' },
      { label: 'Whipped mascarpone', note: 'Soft and creamy' },
      { label: 'Chocolate ganache', note: 'Glossy and decadent' },
      { label: 'Semi-naked', note: 'Rustic, layers peek through' },
    ],
    styles: [
      { label: 'Minimal & textured', image: 'vanilla', extra: 0 },
      { label: 'Fresh florals', image: 'floral', extra: 35 },
      { label: 'Vintage piping', image: 'birthday', extra: 25 },
      { label: 'Fruit crown', image: 'strawberry', extra: 20 },
      { label: 'Gold & hand-painted', image: 'wedding', extra: 45 },
      { label: 'Sculptural & modern', image: 'pistachio', extra: 40 },
    ],
    occasions: ['Birthday', 'Wedding', 'Anniversary', 'Baby shower', 'Engagement', 'Corporate event', 'Just because', 'Other'],
  },
};

/** Merge stored values over defaults so new fields added later always have a value. */
export function mergeSettings(stored: Partial<Record<SettingsKey, unknown>>): Settings {
  return {
    business: { ...defaultSettings.business, ...(stored.business as object) },
    store: { ...defaultSettings.store, ...(stored.store as object) },
    custom: { ...defaultSettings.custom, ...(stored.custom as object) },
  };
}

export const phoneHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
