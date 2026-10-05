/**
 * All photography is referenced from this one file.
 *
 * The current images are curated placeholders served from Unsplash. Before launch,
 * replace them with Sweet Daisy's own product photography: either drop files into
 * `/public/images/` and use paths like `/images/strawberry-dream.jpg`, or point the
 * entries below at your CDN. Every image on the site sits on a tinted, branded
 * backdrop, so a missing file degrades gracefully instead of breaking the layout.
 */

export const photo = {
  hero: '1535141192574-5d4897c12636',
  heroAlt: '1558636508-e0db3814bd1d',

  celebration: '1464349095431-e9a21285b5f3',
  birthday: '1530103862676-de8c9debad1d',
  mini: '1621303837174-89787a7d4729',
  cupcakes: '1486427944299-d1955d23e34d',
  dessertBox: '1550617931-e17a7b70dce2',
  seasonal: '1488477181946-6428a0291777',

  strawberry: '1565958011703-44f9829ba187',
  vanilla: '1558636508-e0db3814bd1d',
  chocolate: '1578985545062-69928b1d9587',
  chocolateAlt: '1563729784474-d77dbb933a9e',
  lemon: '1571115177098-24ec42ed204d',
  pistachio: '1557925923-cd4648e211a0',
  carrot: '1586788680434-30d324b2d46f',
  redVelvet: '1587668178277-295251f900ce',
  cupcakesAlt: '1576618148400-f54bed99fcfd',
  macarons: '1569864358642-9d1684040f43',
  cookies: '1606313564200-e75d5e30476c',
  tart: '1519915028121-7d3463d20b13',
  wedding: '1464195244916-405fa0a82545',
  floral: '1612203985729-70726954388c',
  sliced: '1606983340126-99ab4feaa64a',
  studio: '1517433670267-08bbd4be890f',
  baking: '1556910103-1c02745aae4d',
  packaging: '1549007994-cb92caebd54b',
  celebrationTable: '1530103862676-de8c9debad1d',
  hands: '1556909114-f6e7ad7d3136',
} as const;

export type PhotoKey = keyof typeof photo;

/** Build a responsive, cropped image URL. Accepts a photo key, a raw Unsplash id or a local path. */
export function img(src: string, width = 1200, height?: number): string {
  const id = (photo as Record<string, string>)[src] ?? src;
  if (id.startsWith('/') || id.startsWith('http')) return id;
  const h = height ? `&h=${height}` : '';
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}${h}&q=78`;
}

export function srcset(src: string, widths: number[], ratio?: number): string {
  return widths
    .map((w) => `${img(src, w, ratio ? Math.round(w * ratio) : undefined)} ${w}w`)
    .join(', ');
}
