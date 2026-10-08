import { useId } from 'react';

/** Round vintage seal with text running around a daisy, like a bakery stamp. */
export function Seal({ text, className = '' }: { text: string; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={`seal ${className}`} viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="var(--blush)" />
      <circle cx="60" cy="60" r="53" fill="none" stroke="var(--olive-deep)" strokeOpacity="0.35" strokeWidth="0.8" />
      <circle cx="60" cy="60" r="33" fill="none" stroke="var(--olive-deep)" strokeOpacity="0.35" strokeWidth="0.8" />
      <g className="seal__ring">
        <defs>
          <path id={`${id}-ring`} d="M60 60 m-43 0 a43 43 0 1 1 86 0 a43 43 0 1 1 -86 0" />
        </defs>
        <text className="seal__text">
          <textPath href={`#${id}-ring`} textLength="268" lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </g>
      <g transform="translate(60 60)" fill="var(--paper)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((r) => (
          <ellipse key={r} rx="4.6" ry="10" cy="-11" transform={`rotate(${r})`} />
        ))}
        <circle r="5.4" fill="var(--olive-deep)" />
      </g>
    </svg>
  );
}
