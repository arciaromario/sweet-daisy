import { currentLang, type Lang } from '../i18n/lang.ts';


/** Category ids are managed from /admin; these are the defaults: cookies, then the (hidden) cake and treat lines. */
export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
  /** Optional Spanish copy, edited in /admin. English is always the base. */
  i18n?: { es?: { name?: string; blurb?: string } };
}

/** Optional Spanish copy for a product. Anything left empty falls back to English. */
export interface ProductTranslation {
  name?: string;
  short?: string;
  description?: string;
  badge?: string;
  details?: { label: string; value: string }[];
  /** Pack/size names by size id, e.g. { pack2: { label: 'Paquete de 2', servings: '2 galletas' } }. */
  sizes?: Record<string, { label?: string; servings?: string }>;
}

export const categories: Category[] = [
  {
    id: 'cookies',
    name: 'NY Cookies',
    blurb: 'Big, gooey New York–style cookies, boxed in 2s, 4s and 6s.',
    i18n: { es: { name: 'Galletas NY', blurb: 'Galletas grandes y suaves estilo New York, en cajas de 2, 4 y 6.' } },
  },
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
  i18n?: { es?: ProductTranslation };
}

/** The product as shown in a language: Spanish fields where filled in, English otherwise. */
export function localizeProduct(p: Product, lang: Lang): Product {
  const t = lang === 'es' ? p.i18n?.es : undefined;
  if (!t) return p;
  return {
    ...p,
    name: t.name || p.name,
    short: t.short || p.short,
    description: t.description || p.description,
    badge: p.badge ? t.badge || p.badge : p.badge,
    details: t.details?.length ? t.details : p.details,
    sizes: p.sizes.map((s) => ({ ...s, label: t.sizes?.[s.id]?.label || s.label, servings: t.sizes?.[s.id]?.servings || s.servings })),
  };
}

export function localizeCategory(c: Category, lang: Lang): Category {
  const t = lang === 'es' ? c.i18n?.es : undefined;
  return t ? { ...c, name: t.name || c.name, blurb: t.blurb || c.blurb } : c;
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

/** The mix-and-match box: customers choose how many of each cookie flavour go in. */
export const MIX_BOX_SLUG = 'build-your-box';

/** Number of cookies in a pack, read from its label ("Pack of 6" → 6). */
export const packCount = (label: string) => Number(label.match(/\d+/)?.[0]) || 0;

const cookieDetails = [
  { label: 'Allergens', value: 'Contains wheat, eggs, dairy. Made in a kitchen that handles nuts.' },
  { label: 'Size', value: 'Each cookie is about 5 oz — thick, crisp at the edges and soft in the middle.' },
  { label: 'Storage', value: 'Keep in the box at room temperature for up to 3 days. Warm for 5 minutes at 350°F for that just-baked feel.' },
];

/** Example pack prices — edit them per cookie in /admin. */
const packs = (two: number, four: number, six: number) => [
  { id: 'pack2', label: 'Pack of 2', servings: '2 cookies', price: two },
  { id: 'pack4', label: 'Pack of 4', servings: '4 cookies', price: four },
  { id: 'pack6', label: 'Pack of 6', servings: '6 cookies', price: six },
];

/** Spanish copy shared by every cookie: pack names and details. */
const cookieEs = (t: Pick<ProductTranslation, 'name' | 'short' | 'description' | 'badge'>): Product['i18n'] => ({
  es: {
    ...t,
    sizes: {
      pack2: { label: 'Paquete de 2', servings: '2 galletas' },
      pack4: { label: 'Paquete de 4', servings: '4 galletas' },
      pack6: { label: 'Paquete de 6', servings: '6 galletas' },
    },
    details: [
      { label: 'Alérgenos', value: 'Contiene trigo, huevo y lácteos. Hecho en una cocina que maneja frutos secos.' },
      { label: 'Tamaño', value: 'Cada galleta pesa unas 5 oz — gruesa, crujiente por fuera y suave por dentro.' },
      { label: 'Conservación', value: 'Guárdalas en la caja a temperatura ambiente hasta 3 días. Caliéntalas 5 minutos a 350 °F para que sepan recién horneadas.' },
    ],
  },
});

const cookie = (p: Omit<Product, 'category' | 'sizes' | 'details' | 'leadDays' | 'prepHours'> & Partial<Product>): Product => ({
  category: 'cookies',
  sizes: packs(10, 19, 27),
  details: cookieDetails,
  leadDays: 1,
  prepHours: 3,
  ...p,
});

const cookieProducts: Product[] = [
  cookie({
    slug: 'classic-chocolate-chip',
    i18n: cookieEs({ name: 'Chispas de chocolate clásica', short: 'Masa de mantequilla tostada, trozos de chocolate oscuro y sal en escamas.', description: 'La que empezó todo. Una galleta gruesa estilo New York hecha con mantequilla tostada y llena de charcos de chocolate oscuro y con leche, terminada con sal en escamas.', badge: 'La más vendida' }),
    name: 'Classic Chocolate Chip',
    short: 'Brown butter dough, dark chocolate chunks and flaky sea salt.',
    description:
      'The one that started it all. A thick New York–style cookie made with nutty brown butter and loaded with puddles of dark and milk chocolate, finished with flaky sea salt.',
    images: ['cookies', 'packaging'],
    badge: 'Bestseller',
    bestseller: true,
    tint: '#F6E7E3',
    sort: 1,
  }),
  cookie({
    slug: 'double-chocolate-fudge',
    i18n: cookieEs({ name: 'Doble chocolate fudge', short: 'Masa de cacao oscuro con centro de fudge fundido.', description: 'Para los amantes del chocolate: una galleta de cacao intenso con chocolate blanco y oscuro, que esconde un centro suave de fudge fundido.' }),
    name: 'Double Chocolate Fudge',
    short: 'Dark cocoa dough with a molten fudge centre.',
    description: 'For serious chocolate lovers: a deep cocoa cookie studded with white and dark chocolate, hiding a soft, molten fudge centre.',
    images: ['cookies', 'packaging'],
    bestseller: true,
    tint: '#EFEEE6',
    sort: 2,
  }),
  cookie({
    slug: 'biscoff-crumble',
    i18n: cookieEs({ name: 'Biscoff crumble', short: 'Centro de crema Biscoff, chocolate blanco y galleta Biscoff triturada.', description: 'Una galleta de azúcar morena rellena de crema de galleta Biscoff, cubierta con chocolate blanco y galletas Lotus trituradas.', badge: 'Favorita de los clientes' }),
    name: 'Biscoff Crumble',
    short: 'Cookie-butter centre, white chocolate and Biscoff crumb.',
    description: 'A brown sugar cookie stuffed with a gooey Biscoff cookie-butter centre, topped with white chocolate and crushed Lotus biscuits.',
    images: ['cookies', 'packaging'],
    badge: 'Fan favourite',
    bestseller: true,
    tint: '#F6E7E3',
    sort: 3,
  }),
  cookie({
    slug: 'red-velvet-cheesecake',
    i18n: cookieEs({ name: 'Red velvet con cheesecake', short: 'Red velvet de cacao con corazón de queso crema.', description: 'Masa suave de red velvet con chispas de chocolate blanco, envolviendo un centro cremoso de cheesecake.' }),
    name: 'Red Velvet Cheesecake',
    short: 'Cocoa red velvet with a cream cheese heart.',
    description: 'Soft red velvet dough with white chocolate chips, wrapped around a tangy, creamy cheesecake centre.',
    images: ['cookies', 'packaging'],
    bestseller: true,
    tint: '#EFEEE6',
    sort: 4,
  }),
  cookie({
    slug: 'smores',
    i18n: cookieEs({ name: 'S’mores', short: 'Masa de galleta graham, chocolate con leche y malvavisco tostado.', description: 'Una fogata en una galleta: masa de galleta graham, trozos de chocolate con leche y un centro de malvavisco, tostado por encima.' }),
    name: 'S’mores',
    short: 'Graham dough, milk chocolate and toasted marshmallow.',
    description: 'Campfire in a cookie: graham cracker dough, milk chocolate chunks and a gooey marshmallow centre, toasted on top.',
    images: ['cookies', 'packaging'],
    tint: '#F6E7E3',
    sort: 5,
  }),
  cookie({
    slug: 'birthday-funfetti',
    i18n: cookieEs({ name: 'Funfetti de cumpleaños', short: 'Masa de vainilla, chispas de colores y chocolate blanco.', description: 'Cada día es una celebración: masa de vainilla con mantequilla, llena de chispas de colores y chocolate blanco cremoso.' }),
    name: 'Birthday Funfetti',
    short: 'Vanilla dough, rainbow sprinkles and white chocolate.',
    description: 'Every day is a celebration: buttery vanilla dough packed with rainbow sprinkles and creamy white chocolate.',
    images: ['cookies', 'packaging'],
    tint: '#EFEEE6',
    sort: 6,
  }),
];

const mixBox: Product = cookie({
  slug: MIX_BOX_SLUG,
    i18n: cookieEs({ name: 'Arma tu caja', short: 'Combina los sabores que quieras en un paquete de 2, 4 o 6.', description: '¿No puedes elegir solo una? Elige el tamaño de tu paquete y llénalo con la combinación de sabores que quieras. Va en caja y con lazo, lista para regalar.', badge: 'Combina sabores' }),
  name: 'Build Your Own Box',
  short: 'Mix and match any flavours in a pack of 2, 4 or 6.',
  description: 'Can’t choose just one? Pick your pack size, then fill it with any mix of our cookie flavours. Boxed and ribboned, ready to gift.',
  images: ['packaging', 'cookies'],
  sizes: packs(10, 19, 27),
  flavors: cookieProducts.map((c) => ({ label: c.name, price: 0 })),
  badge: 'Mix & match',
  bestseller: true,
  tint: '#EFEEE6',
  sort: 0,
});

/** Earlier cake and treat lines, kept but hidden; switch them back on in /admin. */
const legacyProducts: Product[] = [
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
    tint: '#F6E7E3',
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
    tint: '#EFEEE6',
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
    tint: '#F6E7E3',
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
    tint: '#EFEEE6',
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
    tint: '#F6E7E3',
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
    tint: '#EFEEE6',
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
    tint: '#F6E7E3',
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
    tint: '#EFEEE6',
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
    tint: '#F6E7E3',
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
    tint: '#EFEEE6',
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
    tint: '#F6E7E3',
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
    tint: '#EFEEE6',
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
    tint: '#F6E7E3',
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
    tint: '#EFEEE6',
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
    tint: '#F6E7E3',
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
    tint: '#EFEEE6',
  },
];

export const products: Product[] = [
  mixBox,
  ...cookieProducts,
  ...legacyProducts.map((p, i) => ({ ...p, active: false, bestseller: false, sort: 100 + i })),
];

/** Products flagged as bestsellers in /admin, in shop order. */
export const pickBestsellers = (list: Product[]) => list.filter((p) => p.bestseller && p.active !== false);

export const fromPrice = (p: Product) => Math.min(...p.sizes.map((s) => s.price));

export const categoryName = (id: CategoryId, list: Category[] = categories) => {
  const c = list.find((x) => x.id === id);
  return c ? localizeCategory(c, currentLang()).name : id;
};

export function relatedProducts(product: Product, list: Product[] = products, count = 4): Product[] {
  const same = list.filter((p) => p.slug !== product.slug && p.category === product.category);
  const others = list.filter((p) => p.slug !== product.slug && p.category !== product.category && p.bestseller);
  return [...same, ...others].slice(0, count);
}

/** "about 6 hours", "about 1 day", "about 2½ days" (or "aprox. 6 horas"…) — for showing average preparation time. */
export function formatPrep(hours: number | undefined, style: 'long' | 'short' = 'long'): string | null {
  if (hours == null || !(hours > 0)) return null;
  const es = currentLang() === 'es';
  if (hours < 24) {
    const h = Math.round(hours * 2) / 2;
    const unit = es ? (h === 1 ? 'hora' : 'horas') : h === 1 ? 'hour' : 'hours';
    if (style === 'short') return `~${h} h`;
    return es ? `aprox. ${h} ${unit}` : `about ${h} ${unit}`;
  }
  const days = Math.round((hours / 24) * 2) / 2;
  const label = Number.isInteger(days) ? String(days) : `${Math.floor(days)}½`;
  const unit = es ? (days === 1 ? 'día' : 'días') : days === 1 ? 'day' : 'days';
  return style === 'short' ? `~${label} ${unit}` : es ? `aprox. ${label} ${unit}` : `about ${label} ${unit}`;
}

export const formatPrice = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
