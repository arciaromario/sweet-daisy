
/** Category ids are managed from /admin; these are the defaults: cakes, mini-cakes, cupcakes, treats, seasonal. */
export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
}

export const categories: Category[] = [
  { id: 'cakes', name: 'Cakes', blurb: 'Layered celebration cakes, finished by hand.' },
  { id: 'mini-cakes', name: 'Mini Cakes', blurb: 'Small cakes for intimate celebrations.' },
  { id: 'cupcakes', name: 'Cupcakes', blurb: 'Signature cupcakes, boxed to gift.' },
  { id: 'treats', name: 'Treats', blurb: 'Macarons, cookies and dessert boxes.' },
  { id: 'seasonal', name: 'Seasonal', blurb: 'Limited bakes inspired by the season.' },
];

export interface SizeOption {
  id: string;
  label: string;
  servings: string;
  price: number;
}

export interface AddOn {
  id?: string;
  label: string;
  price: number;
}

export interface Product {
  slug: string;
  name: string;
  category: CategoryId;
  /** One line used on product cards. */
  short: string;
  /** Long-form description for the product page. */
  description: string;
  /** Photo keys from images.ts, uploaded photo URLs or /images/ paths. */
  images: string[];
  sizes: SizeOption[];
  flavors?: AddOn[];
  decorations?: AddOn[];
  /** Whether a personalised message (plaque / piping) can be added. */
  message?: boolean;
  /** Minimum notice in days before the order can be collected/delivered. */
  leadDays: number;
  /** Average preparation time in hours, set by the owner and shown to customers. */
  prepHours?: number;
  badge?: string;
  bestseller?: boolean;
  details: { label: string; value: string }[];
  /** Backdrop tint shown while the photo loads. */
  tint: string;
  /** Hidden from the shop when false (managed from /admin). */
  active?: boolean;
  sort?: number;
}

const standardDecorations: AddOn[] = [
  { id: 'classic', label: 'Classic Sweet Daisy finish', price: 0 },
  { id: 'fresh-flowers', label: 'Fresh seasonal flowers', price: 18 },
  { id: 'gold-leaf', label: 'Edible gold leaf accents', price: 14 },
  { id: 'berries', label: 'Fresh berry crown', price: 12 },
];

const cakeSizes = (base: number): SizeOption[] => [
  { id: '6in', label: '6" round', servings: '8–10 servings', price: base },
  { id: '8in', label: '8" round', servings: '14–18 servings', price: base + 26 },
  { id: '10in', label: '10" round', servings: '24–30 servings', price: base + 58 },
];

const cakeDetails = [
  { label: 'Allergens', value: 'Contains wheat, eggs, dairy. Made in a kitchen that handles nuts.' },
  { label: 'Storage', value: 'Keep refrigerated. Serve at room temperature — remove 1 hour before slicing.' },
  { label: 'Best enjoyed', value: 'Within 3 days of collection.' },
];

export const products: Product[] = [
  {
    slug: 'strawberry-dream-cake',
    name: 'Strawberry Dream Cake',
    category: 'cakes',
    short: 'Vanilla sponge, fresh strawberries and whipped mascarpone cream.',
    description:
      'Our most-requested cake. Three layers of light vanilla bean sponge, filled with macerated summer strawberries and a cloud of whipped mascarpone cream, finished with a soft-textured buttercream and a crown of fresh berries.',
    images: ['strawberry', 'sliced', 'celebration'],
    sizes: cakeSizes(68),
    flavors: [{ label: 'Vanilla bean sponge', price: 0 }, { label: 'Lemon sponge', price: 0 }, { label: 'Gluten-free vanilla', price: 8 }],
    decorations: standardDecorations,
    message: true,
    leadDays: 2,
    prepHours: 24,
    badge: 'Bestseller',
    bestseller: true,
    details: cakeDetails,
    tint: '#F2E3DC',
  },
  {
    slug: 'vanilla-daisy-cake',
    name: 'Vanilla Daisy Cake',
    category: 'cakes',
    short: 'Madagascar vanilla, silky Swiss meringue buttercream, piped daisies.',
    description:
      'The cake our studio is named after. A buttery Madagascar vanilla sponge layered with silky Swiss meringue buttercream and a whisper of white chocolate ganache, hand-piped with delicate daisies.',
    images: ['vanilla', 'floral', 'hero'],
    sizes: cakeSizes(64),
    flavors: [{ label: 'Vanilla bean sponge', price: 0 }, { label: 'Almond sponge', price: 0 }, { label: 'Gluten-free vanilla', price: 8 }],
    decorations: standardDecorations,
    message: true,
    leadDays: 2,
    prepHours: 24,
    badge: 'Signature',
    bestseller: true,
    details: cakeDetails,
    tint: '#F4EDE1',
  },
  {
    slug: 'chocolate-velvet-cake',
    name: 'Chocolate Velvet Cake',
    category: 'cakes',
    short: 'Dark cocoa sponge, salted caramel and a glossy ganache drip.',
    description:
      'For the chocolate devoted. Moist dark cocoa layers with a ribbon of house-made salted caramel, whipped milk chocolate ganache and a glossy 64% dark chocolate drip.',
    images: ['chocolate', 'chocolateAlt', 'sliced'],
    sizes: cakeSizes(72),
    flavors: [{ label: 'Dark chocolate sponge', price: 0 }, { label: 'Chocolate & hazelnut', price: 0 }, { label: 'Gluten-free chocolate', price: 8 }],
    decorations: standardDecorations,
    message: true,
    leadDays: 2,
    prepHours: 24,
    bestseller: true,
    details: cakeDetails,
    tint: '#E6D8CA',
  },
  {
    slug: 'lemon-cream-cake',
    name: 'Lemon Cream Cake',
    category: 'cakes',
    short: 'Lemon chiffon, tangy curd and soft vanilla cream.',
    description:
      'Bright and elegant. Feather-light lemon chiffon layered with tangy house-made lemon curd and vanilla chantilly, finished with candied lemon and tiny edible flowers.',
    images: ['lemon', 'floral', 'vanilla'],
    sizes: cakeSizes(66),
    flavors: [{ label: 'Lemon chiffon', price: 0 }, { label: 'Lemon & elderflower', price: 0 }, { label: 'Gluten-free lemon', price: 8 }],
    decorations: standardDecorations,
    message: true,
    leadDays: 2,
    prepHours: 24,
    bestseller: true,
    details: cakeDetails,
    tint: '#F3EBCF',
  },
  {
    slug: 'pistachio-rose-cake',
    name: 'Pistachio Rose Cake',
    category: 'cakes',
    short: 'Pistachio sponge, raspberry and a delicate rose buttercream.',
    description:
      'Our most romantic cake. Toasted pistachio sponge layered with raspberry compote and a softly perfumed rose buttercream, scattered with crushed pistachio and dried petals.',
    images: ['pistachio', 'floral', 'wedding'],
    sizes: cakeSizes(74),
    flavors: [{ label: 'Pistachio sponge', price: 0 }, { label: 'Vanilla sponge', price: 0 }],
    decorations: standardDecorations,
    message: true,
    leadDays: 3,
    prepHours: 30,
    badge: 'New',
    details: [...cakeDetails.slice(0, 1).map((d) => ({ ...d, value: 'Contains pistachio, wheat, eggs, dairy.' })), ...cakeDetails.slice(1)],
    tint: '#E3E5D3',
  },
  {
    slug: 'carrot-walnut-cake',
    name: 'Carrot & Walnut Cake',
    category: 'cakes',
    short: 'Spiced carrot sponge, toasted walnuts, cream cheese frosting.',
    description:
      'A classic made beautifully. Warmly spiced carrot sponge with toasted walnuts and golden raisins, layered with a tangy cream cheese frosting and finished with a semi-naked texture.',
    images: ['carrot', 'sliced', 'studio'],
    sizes: cakeSizes(62),
    flavors: [{ label: 'Classic with walnuts', price: 0 }, { label: 'Nut-free', price: 0 }],
    decorations: standardDecorations,
    message: true,
    leadDays: 2,
    prepHours: 24,
    details: [{ label: 'Allergens', value: 'Contains walnuts, wheat, eggs, dairy.' }, ...cakeDetails.slice(1)],
    tint: '#EBDCC6',
  },
  {
    slug: 'mini-celebration-cake',
    name: 'Mini Celebration Cake',
    category: 'mini-cakes',
    short: 'A 4" cake for two to four — every bit as special.',
    description:
      'All the ceremony of a full cake, sized for small moments. Choose your flavour and we will finish it with our signature textured buttercream and a hand-lettered message.',
    images: ['mini', 'birthday', 'floral'],
    sizes: [
      { id: '4in', label: '4" mini', servings: '2–4 servings', price: 38 },
      { id: '5in', label: '5" petite', servings: '4–6 servings', price: 46 },
    ],
    flavors: [{ label: 'Vanilla & strawberry', price: 0 }, { label: 'Chocolate velvet', price: 0 }, { label: 'Lemon cream', price: 0 }, { label: 'Pistachio rose', price: 0 }],
    decorations: standardDecorations.slice(0, 3),
    message: true,
    leadDays: 1,
    prepHours: 6,
    badge: 'Bestseller',
    bestseller: true,
    details: cakeDetails,
    tint: '#F2E6DA',
  },
  {
    slug: 'bento-heart-cake',
    name: 'Bento Heart Cake',
    category: 'mini-cakes',
    short: 'A heart-shaped mini cake in a keepsake gift box.',
    description:
      'A sweet little love letter. A heart-shaped vanilla or chocolate mini cake, piped in vintage style and presented in our keepsake box — perfect for anniversaries and just-because moments.',
    images: ['birthday', 'mini'],
    sizes: [{ id: 'one', label: 'Heart mini', servings: '1–2 servings', price: 32 }],
    flavors: [{ label: 'Vanilla & raspberry', price: 0 }, { label: 'Chocolate velvet', price: 0 }],
    message: true,
    leadDays: 1,
    prepHours: 4,
    details: cakeDetails,
    tint: '#F3E4DE',
  },
  {
    slug: 'signature-cupcake-box',
    name: 'Signature Cupcake Box',
    category: 'cupcakes',
    short: 'An assortment of our signature cupcakes, beautifully boxed.',
    description:
      'Our signature flavours in one elegant box: vanilla daisy, chocolate velvet, strawberry dream and lemon cream — each one piped by hand and topped with a little detail.',
    images: ['cupcakes', 'cupcakesAlt', 'packaging'],
    sizes: [
      { id: 'box6', label: 'Box of 6', servings: '6 cupcakes', price: 36 },
      { id: 'box12', label: 'Box of 12', servings: '12 cupcakes', price: 68 },
      { id: 'box24', label: 'Box of 24', servings: '24 cupcakes', price: 128 },
    ],
    flavors: [{ label: 'Signature assortment', price: 0 }, { label: 'All vanilla daisy', price: 0 }, { label: 'All chocolate velvet', price: 0 }],
    message: true,
    leadDays: 1,
    prepHours: 5,
    bestseller: true,
    details: cakeDetails,
    tint: '#F1E7DA',
  },
  {
    slug: 'vanilla-bean-cupcakes',
    name: 'Vanilla Bean Cupcakes',
    category: 'cupcakes',
    short: 'Classic vanilla with a swirl of silky buttercream.',
    description:
      'Simple, perfect and loved by everyone. Madagascar vanilla cupcakes with a generous swirl of vanilla Swiss meringue buttercream and a sugar daisy.',
    images: ['cupcakesAlt', 'cupcakes'],
    sizes: [
      { id: 'box6', label: 'Box of 6', servings: '6 cupcakes', price: 32 },
      { id: 'box12', label: 'Box of 12', servings: '12 cupcakes', price: 60 },
    ],
    leadDays: 1,
    prepHours: 4,
    details: cakeDetails,
    tint: '#F5EEE2',
  },
  {
    slug: 'macaron-gift-box',
    name: 'Macaron Gift Box',
    category: 'treats',
    short: 'Delicate French macarons in seasonal flavours.',
    description:
      'Crisp shells, chewy centres and silky fillings. A curated box of French macarons in our current flavours — salted caramel, pistachio, raspberry, lemon, vanilla and chocolate.',
    images: ['macarons', 'dessertBox'],
    sizes: [
      { id: 'box12', label: 'Box of 12', servings: '12 macarons', price: 34 },
      { id: 'box24', label: 'Box of 24', servings: '24 macarons', price: 64 },
    ],
    message: true,
    leadDays: 1,
    prepHours: 24,
    details: [{ label: 'Allergens', value: 'Contains almonds, eggs, dairy. Naturally gluten-free.' }, ...cakeDetails.slice(1)],
    tint: '#EEE6D6',
  },
  {
    slug: 'sweet-daisy-dessert-box',
    name: 'Sweet Daisy Dessert Box',
    category: 'treats',
    short: 'Mini tarts, macarons, cookies and cake bites to share.',
    description:
      'A grazing box for gatherings: mini fruit tarts, macarons, brown butter cookies and bite-sized cake squares, arranged by hand and wrapped with ribbon.',
    images: ['dessertBox', 'tart', 'cookies'],
    sizes: [
      { id: 'small', label: 'Petite box', servings: 'Serves 4–6', price: 48 },
      { id: 'large', label: 'Grand box', servings: 'Serves 10–12', price: 92 },
    ],
    message: true,
    leadDays: 2,
    prepHours: 8,
    badge: 'Gift favourite',
    details: cakeDetails,
    tint: '#EFE5D3',
  },
  {
    slug: 'brown-butter-cookies',
    name: 'Brown Butter Cookies',
    category: 'treats',
    short: 'Chewy brown butter cookies with dark chocolate and sea salt.',
    description:
      'Thick, chewy cookies made with nutty brown butter, chunks of dark chocolate and a sprinkle of flaky sea salt. Baked fresh every morning.',
    images: ['cookies', 'packaging'],
    sizes: [
      { id: 'box6', label: 'Box of 6', servings: '6 cookies', price: 18 },
      { id: 'box12', label: 'Box of 12', servings: '12 cookies', price: 34 },
    ],
    leadDays: 0,
    prepHours: 2,
    details: cakeDetails,
    tint: '#E9DCC8',
  },
  {
    slug: 'berry-tartlets',
    name: 'Berry Tartlets',
    category: 'treats',
    short: 'Butter pastry, vanilla crème pâtissière and fresh berries.',
    description:
      'Crisp, buttery pastry shells filled with vanilla crème pâtissière and topped with glazed fresh berries. A little bit of Paris in every bite.',
    images: ['tart', 'seasonal'],
    sizes: [
      { id: 'box4', label: 'Box of 4', servings: '4 tartlets', price: 26 },
      { id: 'box8', label: 'Box of 8', servings: '8 tartlets', price: 48 },
    ],
    leadDays: 1,
    prepHours: 5,
    details: cakeDetails,
    tint: '#F1E2DA',
  },
  {
    slug: 'autumn-spice-cake',
    name: 'Autumn Spice Cake',
    category: 'seasonal',
    short: 'Brown sugar spice, poached pear and maple cream.',
    description:
      'Available for a limited time. Brown sugar and cinnamon sponge layered with vanilla-poached pears and a silky maple cream cheese frosting, finished with caramelised pecans.',
    images: ['seasonal', 'carrot', 'sliced'],
    sizes: cakeSizes(70),
    flavors: [{ label: 'Spice & pear', price: 0 }, { label: 'Spice & apple', price: 0 }],
    decorations: standardDecorations,
    message: true,
    leadDays: 2,
    prepHours: 24,
    badge: 'Limited',
    details: [{ label: 'Allergens', value: 'Contains pecans, wheat, eggs, dairy.' }, ...cakeDetails.slice(1)],
    tint: '#EADBC2',
  },
  {
    slug: 'seasonal-treat-box',
    name: 'Seasonal Treat Box',
    category: 'seasonal',
    short: 'A rotating selection of our limited-edition bakes.',
    description:
      'Our pastry team’s favourite seasonal creations in one box — expect spiced cookies, fruit tartlets, mini cakes and something new each month.',
    images: ['dessertBox', 'seasonal', 'macarons'],
    sizes: [{ id: 'box', label: 'Seasonal box', servings: 'Serves 4–6', price: 54 }],
    message: true,
    leadDays: 2,
    prepHours: 10,
    badge: 'Limited',
    details: cakeDetails,
    tint: '#ECE1CB',
  },
];

export const bestsellerSlugs = [
  'strawberry-dream-cake',
  'vanilla-daisy-cake',
  'chocolate-velvet-cake',
  'lemon-cream-cake',
  'mini-celebration-cake',
  'signature-cupcake-box',
];

export const pickBestsellers = (list: Product[]) =>
  bestsellerSlugs.map((s) => list.find((p) => p.slug === s)).filter((p): p is Product => Boolean(p));

export const fromPrice = (p: Product) => Math.min(...p.sizes.map((s) => s.price));

export const categoryName = (id: CategoryId) => categories.find((c) => c.id === id)?.name ?? id;

export function relatedProducts(product: Product, list: Product[] = products, count = 4): Product[] {
  const same = list.filter((p) => p.slug !== product.slug && p.category === product.category);
  const others = list.filter((p) => p.slug !== product.slug && p.category !== product.category && p.bestseller);
  return [...same, ...others].slice(0, count);
}

/** "about 6 hours", "about 1 day", "about 2½ days" — for showing average preparation time. */
export function formatPrep(hours: number | undefined, style: 'long' | 'short' = 'long'): string | null {
  if (hours == null || !(hours > 0)) return null;
  if (hours < 24) {
    const h = Math.round(hours * 2) / 2;
    return style === 'short' ? `~${h} h` : `about ${h} ${h === 1 ? 'hour' : 'hours'}`;
  }
  const days = Math.round((hours / 24) * 2) / 2;
  const label = Number.isInteger(days) ? String(days) : `${Math.floor(days)}½`;
  return style === 'short' ? `~${label} ${days === 1 ? 'day' : 'days'}` : `about ${label} ${days === 1 ? 'day' : 'days'}`;
}

export const formatPrice = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
