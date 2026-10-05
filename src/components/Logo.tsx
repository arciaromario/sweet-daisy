import { Link } from 'react-router';

export function DaisyMark({ className = '' }: { className?: string }) {
  return (
    <svg className={`daisy-mark ${className}`} viewBox="-32 -32 64 64" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((r) => (
        <ellipse key={r} rx="5" ry="12.5" cy="-14" transform={`rotate(${r})`} />
      ))}
      <circle r="4.5" fill="var(--gold)" stroke="none" />
    </svg>
  );
}

export function Logo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <Link to="/" className={`logo${light ? ' logo--light' : ''}`} aria-label="Sweet Daisy — Cakes and Treats, home">
      <DaisyMark />
      <span className="logo__text">
        <span className="logo__name">Sweet Daisy</span>
        {!compact && <span className="logo__desc">Cakes and Treats</span>}
      </span>
    </Link>
  );
}
