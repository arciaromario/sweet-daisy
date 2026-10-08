import { site } from '../data/site';
import { useLang } from '../i18n';

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://www.sweetdaisycakes.com';

/**
 * Per-page metadata. React 19 hoists <title>, <meta> and <link> into <head>.
 */
export function Seo({
  title,
  description,
  path = '',
  image,
  jsonLd,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  jsonLd?: object;
}) {
  const es = useLang() === 'es';
  const home = es ? 'Sweet Daisy — Galletas estilo New York y pasteles a medida' : 'Sweet Daisy — New York–Style Cookies & Custom Cakes';
  const fullTitle = title ? `${title} | Sweet Daisy` : home;
  description ??= es ? site.descriptionEs : site.description;
  const url = `${SITE_URL}${path}`;
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
    </>
  );
}
