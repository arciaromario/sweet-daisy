import { useCatalog } from '../context/CatalogContext';
import { currentLocale } from '../i18n';
import type { Review } from '../lib/api';
import { Stars } from './Stars';

/** One customer review, styled like the home page quotes. */
export function ReviewCard({ review, showProducts = true }: { review: Review; showProducts?: boolean }) {
  const { products } = useCatalog();
  const names = review.products
    .map((slug) => products.find((p) => p.slug === slug)?.name)
    .filter(Boolean)
    .slice(0, 2)
    .join(' · ');
  const date = new Date(review.created_at).toLocaleDateString(currentLocale(), { month: 'long', year: 'numeric' });
  return (
    <figure className="quote review-card">
      <Stars value={review.rating} className="quote__stars" />
      <blockquote lang={review.lang}>“{review.comment}”</blockquote>
      <figcaption>
        <span className="quote__name">{review.name}</span>
        <span className="quote__occasion">{showProducts && names ? `${names} · ${date}` : date}</span>
      </figcaption>
    </figure>
  );
}
