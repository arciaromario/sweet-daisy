import { useState, type CSSProperties } from 'react';
import { img, srcset } from '../data/images';

interface Props {
  src: string;
  alt: string;
  /** CSS aspect-ratio, e.g. "4 / 5". */
  ratio?: string;
  tint?: string;
  sizes?: string;
  width?: number;
  priority?: boolean;
  className?: string;
}

/**
 * Responsive image on a branded, tinted backdrop. If a photo is slow or fails to load,
 * the backdrop (with the Sweet Daisy mark) shows instead of a broken image.
 */
export function Img({ src, alt, ratio, tint, sizes = '100vw', width = 1200, priority = false, className = '' }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const r = ratio ? ratioToNumber(ratio) : undefined;

  return (
    <div className={`media ${className}`} style={{ '--ratio': ratio, '--tint': tint } as CSSProperties}>
      {!failed && (
        <img
          src={img(src, width, r ? Math.round(width * r) : undefined)}
          srcSet={srcset(src, [400, 640, 900, 1200, 1600].filter((w) => w <= width * 1.4), r)}
          sizes={sizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          className={loaded ? 'is-loaded' : ''}
          ref={(el) => {
            if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true);
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function ratioToNumber(ratio: string): number | undefined {
  const [w, h] = ratio.split('/').map((n) => parseFloat(n));
  return w && h ? h / w : undefined;
}
