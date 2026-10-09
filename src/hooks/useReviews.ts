import { useEffect, useState } from 'react';
import { fetchReviews, type Review } from '../lib/api';

// One request per visit, shared by every page that shows reviews.
let pending: Promise<Review[]> | null = null;

const load = () =>
  (pending ??= fetchReviews().catch((e) => {
    console.error('[reviews]', e);
    pending = null;
    return [] as Review[];
  }));

/** Approved reviews, newest first. `null` while loading. */
export function useReviews(): Review[] | null {
  const [list, setList] = useState<Review[] | null>(null);
  useEffect(() => {
    let alive = true;
    load().then((r) => alive && setList(r));
    return () => {
      alive = false;
    };
  }, []);
  return list;
}

export function ratingSummary(list: Review[]) {
  const count = list.length;
  const average = count ? list.reduce((a, r) => a + r.rating, 0) / count : 0;
  const byStars = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: list.filter((r) => r.rating === stars).length }));
  return { count, average, byStars };
}
