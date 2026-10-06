import { useId, type CSSProperties, type ReactNode } from 'react';

/**
 * Live illustration for the custom cake builder. It assembles itself as the customer chooses:
 * size → tiers drop onto the stand, flavour → sponge colour, filling → layers, frosting → poured
 * over, decoration → details pop in, date → a little topper. Choices are matched by keyword so
 * options renamed in the admin still get a sensible look.
 */

export interface CakePreviewProps {
  size?: string;
  /** Position of the size in the admin list, used when the label has no inches or tier count. */
  sizeIndex?: number;
  flavor?: string;
  filling?: string;
  frosting?: string;
  style?: string;
  /** Short label for the topper, e.g. "14 Nov". */
  topper?: string;
  celebrate?: boolean;
  className?: string;
}

const W = 360;
const H = 320;
const TOP = -36; // headroom above the viewBox origin for toppers on tall cakes
const CX = W / 2;
const BASE = 258; // where the bottom tier sits on the stand

type Tier = { x: number; top: number; bottom: number; w: number; h: number; ry: number };

const pick = (value: string | undefined, table: [RegExp, string][], fallback: string) => {
  if (!value) return fallback;
  const v = value.toLowerCase();
  return table.find(([re]) => re.test(v))?.[1] ?? fallback;
};

const spongeColor = (flavor?: string) =>
  pick(
    flavor,
    [
      [/red velvet/, '#9c3238'],
      [/choc|cocoa/, '#6b4430'],
      [/lemon|citrus/, '#f0d47a'],
      [/pistach|matcha/, '#bccb8c'],
      [/carrot|spice|ginger/, '#cf9659'],
      [/almond|orange|hazel/, '#ecc189'],
      [/straw|berry/, '#f0b7b3'],
      [/coffee|mocha/, '#8a5f43'],
    ],
    flavor ? '#f1dcad' : '#f6efe4',
  );

const fillingColor = (filling?: string) =>
  pick(
    filling,
    [
      [/straw/, '#e5848b'],
      [/raspberr|cherry/, '#c03f5a'],
      [/lemon/, '#efcd4c'],
      [/caramel|dulce/, '#c68942'],
      [/ganache|choc/, '#4b2c21'],
      [/passion|mango/, '#f2b13d'],
      [/cream cheese/, '#fbf2e2'],
      [/buttercream|vanilla/, '#fff3da'],
    ],
    '#f4d9d4',
  );

type Coat = { color: string; kind: 'smooth' | 'semi' | 'ganache' };

const coatFor = (frosting?: string): Coat | null => {
  if (!frosting) return null;
  const f = frosting.toLowerCase();
  if (/semi|naked|rustic/.test(f)) return { color: '#fffaf2', kind: 'semi' };
  if (/ganache|choc/.test(f)) return { color: '#4b2c21', kind: 'ganache' };
  if (/cream cheese/.test(f)) return { color: '#fbf2e2', kind: 'smooth' };
  if (/mascarpone|whipped|chantilly/.test(f)) return { color: '#fffcf6', kind: 'smooth' };
  return { color: '#fff8ee', kind: 'smooth' };
};

type Deco = 'floral' | 'piping' | 'fruit' | 'gold' | 'sculpt' | 'texture';

const decoFor = (style?: string): Deco | null => {
  if (!style) return null;
  const s = style.toLowerCase();
  if (/flor|flower|peony|rose/.test(s)) return 'floral';
  if (/vintage|pip|lambeth|lace/.test(s)) return 'piping';
  if (/fruit|berr|crown/.test(s)) return 'fruit';
  if (/gold|paint|leaf/.test(s)) return 'gold';
  if (/sculpt|modern|geometr/.test(s)) return 'sculpt';
  return 'texture';
};

/** Widths (bottom to top) from the size label: tier count, or inches, or list position. */
function tierWidths(size?: string, index = 1): number[] {
  const s = (size ?? '').toLowerCase();
  if (/three|3[\s-]*tier/.test(s)) return [236, 176, 118];
  if (/two|2[\s-]*tier/.test(s)) return [216, 146];
  const inches = Number(s.match(/(\d+(?:\.\d+)?)\s*(?:"|”|in|inch)/)?.[1]);
  if (inches) return [Math.max(110, Math.min(240, 40 + inches * 18))];
  return [[150, 182, 214, 0, 0][index] || 182];
}

function layout(widths: number[]): Tier[] {
  const heights = widths.length === 1 ? [Math.round(widths[0] * 0.5 + 6)] : widths.map((_, i) => (widths.length === 3 ? [70, 62, 56] : [80, 70])[i]);
  let bottom = BASE;
  return widths.map((w, i) => {
    const h = Math.min(heights[i], 104);
    const ry = Math.max(7, Math.min(15, w * 0.065));
    const tier = { x: CX - w / 2, top: bottom - h, bottom, w, h, ry };
    bottom = tier.top + ry * 0.35; // the next tier sits slightly into the one below
    return tier;
  });
}

const sidePath = (t: Tier) => `M${t.x} ${t.top} L${t.x} ${t.bottom} A${t.w / 2} ${t.ry} 0 0 0 ${t.x + t.w} ${t.bottom} L${t.x + t.w} ${t.top} Z`;
const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

export function CakePreview({ size, sizeIndex, flavor, filling, frosting, style, topper, celebrate, className = '' }: CakePreviewProps) {
  const tiers = size ? layout(tierWidths(size, sizeIndex)) : [];
  const sponge = spongeColor(flavor);
  const fill = filling ? fillingColor(filling) : null;
  const coat = coatFor(frosting);
  const deco = decoFor(style);
  const top = tiers[tiers.length - 1];
  const uid = useId().replace(/:/g, '');
  const label = size
    ? `Preview: ${[size, flavor, filling && `${filling} filling`, frosting, style].filter(Boolean).join(', ')}`
    : 'Cake preview: choose a size to start';

  return (
    <svg className={`cake-preview${celebrate ? ' is-celebrating' : ''} ${className}`} viewBox={`0 ${TOP} ${W} ${H - TOP}`} role="img" aria-label={label}>
      <defs>
        <linearGradient id="cp-shade" x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.16" />
          <stop offset="0.28" stopColor="#000" stopOpacity="0" />
          <stop offset="0.62" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#000" stopOpacity="0.14" />
        </linearGradient>
        <linearGradient id="cp-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3dc9a" />
          <stop offset="0.45" stopColor="#c99a3e" />
          <stop offset="1" stopColor="#e9c977" />
        </linearGradient>
        <radialGradient id="cp-glow" cx="0.5" cy="0.6" r="0.5">
          <stop offset="0" stopColor="#f6e2de" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f6e2de" stopOpacity="0" />
        </radialGradient>
        {tiers.map((t, i) => (
          <clipPath key={i} id={`${uid}-clip-${i}`}>
            <path d={sidePath(t)} />
          </clipPath>
        ))}
      </defs>

      <ellipse cx={CX} cy={170} rx={170} ry={150} fill="url(#cp-glow)" />
      <Stand />

      {tiers.length === 0 && <GhostTier />}

      <g key={`tiers-${size}`}>
        {tiers.map((t, i) => (
          <g key={i} className="cp-tier" style={delay(i * 140)}>
            <TierBody t={t} i={i} clip={`${uid}-clip-${i}`} sponge={sponge} fill={fill} coat={coat} />
          </g>
        ))}
      </g>

      {deco && tiers.length > 0 && (
        <g key={`deco-${style}-${size}-${frosting}`}>
          <Decoration kind={deco} tiers={tiers} coat={coat} />
        </g>
      )}

      {topper && top && <Topper key={`topper-${topper}`} t={top} text={topper} />}
      {celebrate && tiers.length > 0 && <Sparkles />}
    </svg>
  );
}

function Stand() {
  return (
    <g className="cp-stand">
      <ellipse cx={CX} cy={300} rx={96} ry={8} fill="#000" opacity="0.06" />
      <path d={`M${CX - 26} 268 L${CX - 16} 292 L${CX + 16} 292 L${CX + 26} 268 Z`} fill="#efe7e4" />
      <ellipse cx={CX} cy={293} rx={44} ry={6} fill="#e8dcd8" />
      <ellipse cx={CX} cy={262} rx={150} ry={15} fill="#e9dcd8" />
      <ellipse cx={CX} cy={259} rx={150} ry={14} fill="#ffffff" stroke="#eadfdb" />
    </g>
  );
}

function GhostTier() {
  const t = layout([182])[0];
  return (
    <g className="cp-ghost">
      <path d={sidePath(t)} fill="none" stroke="#d9c6c1" strokeWidth="1.5" strokeDasharray="5 6" />
      <ellipse cx={CX} cy={t.top} rx={t.w / 2} ry={t.ry} fill="none" stroke="#d9c6c1" strokeWidth="1.5" strokeDasharray="5 6" />
    </g>
  );
}

function TierBody({ t, i, clip, sponge, fill, coat }: { t: Tier; i: number; clip: string; sponge: string; fill: string | null; coat: Coat | null }) {
  const stripe = Math.max(5, t.h * 0.1);
  const showLayers = !coat || coat.kind === 'semi';
  const topFill = coat ? coat.color : sponge;

  return (
    <g>
      <g clipPath={`url(#${clip})`}>
        <rect x={t.x} y={t.top - 2} width={t.w} height={t.h + t.ry + 4} className="cp-sponge" style={{ fill: sponge }} />
        {fill &&
          [1, 2].map((n) => (
            <rect
              key={`${fill}-${n}`}
              x={t.x}
              y={t.top + (t.h * n) / 3 - stripe / 2}
              width={t.w}
              height={stripe}
              className="cp-stripe"
              style={{ fill, ...delay(n * 120) }}
            />
          ))}
        {coat && (
          <g key={`coat-${coat.color}-${coat.kind}`} className="cp-coat" style={delay(i * 160)}>
            <rect x={t.x - 2} y={t.top - 2} width={t.w + 4} height={t.h + t.ry + 4} fill={coat.color} opacity={coat.kind === 'semi' ? 0.58 : 1} />
            {coat.kind === 'semi' &&
              Array.from({ length: Math.round(t.w / 22) }, (_, k) => (
                <path
                  key={k}
                  d={`M${t.x + 8 + k * 22} ${t.top + 6} q 6 ${t.h * 0.3} -2 ${t.h * 0.55} t 4 ${t.h * 0.35}`}
                  stroke="#fff"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.7"
                />
              ))}
          </g>
        )}
        <rect x={t.x} y={t.top - 2} width={t.w} height={t.h + t.ry + 4} fill="url(#cp-shade)" />
      </g>
      {coat?.kind === 'ganache' && <Drip t={t} i={i} />}
      <path d={sidePath(t)} fill="none" stroke="#000" strokeOpacity="0.06" />
      <ellipse
        cx={CX}
        cy={t.top}
        rx={t.w / 2}
        ry={t.ry}
        className="cp-top"
        style={{ fill: topFill }}
        stroke={showLayers && !coat ? '#000' : '#fff'}
        strokeOpacity={showLayers && !coat ? 0.06 : 0.6}
      />
    </g>
  );
}

function Drip({ t, i }: { t: Tier; i: number }) {
  const n = Math.round(t.w / 18);
  let d = `M${t.x} ${t.top}`;
  for (let k = 0; k < n; k++) {
    const x0 = t.x + (k * t.w) / n;
    const x1 = t.x + ((k + 1) * t.w) / n;
    const len = 10 + ((k * 37) % 5) * 5;
    d += ` L${x0 + 3} ${t.top} Q${x0 + 3} ${t.top + len} ${(x0 + x1) / 2} ${t.top + len} Q${x1 - 3} ${t.top + len} ${x1 - 3} ${t.top}`;
  }
  d += ` L${t.x + t.w} ${t.top} Z`;
  return <path d={d} fill="#3e2219" className="cp-drip" style={delay(500 + i * 160)} />;
}

function Decoration({ kind, tiers, coat }: { kind: Deco; tiers: Tier[]; coat: Coat | null }) {
  const dark = coat?.kind === 'ganache';
  const top = tiers[tiers.length - 1];
  const base = tiers[0];
  const items: ReactNode[] = [];

  if (kind === 'texture') {
    tiers.forEach((t, i) => {
      for (let y = t.top + 10; y < t.bottom - 2; y += 9) {
        items.push(
          <path
            key={`${i}-${y}`}
            d={`M${t.x + 3} ${y} Q${CX} ${y + t.ry * 0.9} ${t.x + t.w - 3} ${y}`}
            stroke={dark ? '#6d4535' : '#e8ddd2'}
            strokeWidth="1.6"
            fill="none"
            pathLength={1}
            className="cp-draw"
            style={delay(i * 120 + (y - t.top) * 4)}
          />,
        );
      }
    });
  }

  if (kind === 'piping') {
    const ink = dark ? '#f3e2d0' : '#d79b91';
    tiers.forEach((t, i) => {
      const seg = t.w / Math.max(4, Math.round(t.w / 30));
      let d = `M${t.x + 2} ${t.top + t.h * 0.28}`;
      for (let x = t.x + 2; x < t.x + t.w - seg / 2; x += seg) d += ` Q${x + seg / 2} ${t.top + t.h * 0.28 + 12} ${x + seg} ${t.top + t.h * 0.28}`;
      items.push(<path key={`swag-${i}`} d={d} stroke={ink} strokeWidth="2.2" fill="none" pathLength={1} className="cp-draw" style={delay(i * 200)} />);
      for (let x = t.x + 5; x <= t.x + t.w - 5; x += 8) {
        const dy = t.ry * Math.sqrt(Math.max(0, 1 - ((x - CX) / (t.w / 2)) ** 2));
        items.push(<circle key={`bead-${i}-${x}`} cx={x} cy={t.bottom + dy - 3} r="2.6" fill={dark ? '#f3e2d0' : '#fff'} stroke={ink} strokeWidth="0.8" className="cp-pop" style={delay(300 + i * 200 + (x - t.x) * 3)} />);
      }
    });
  }

  if (kind === 'floral') {
    const spots = [
      { x: top.x + top.w * 0.26, y: top.top - 2, r: 15, c: '#e2ada5' },
      { x: top.x + top.w * 0.44, y: top.top - 10, r: 12, c: '#f3d2cc' },
      { x: top.x + top.w * 0.62, y: top.top - 3, r: 16, c: '#c4867b' },
      { x: top.x + top.w * 0.78, y: top.top + 4, r: 10, c: '#f3d2cc' },
      { x: base.x + base.w - 16, y: base.top + base.h * 0.42, r: 14, c: '#e2ada5' },
      { x: base.x + base.w - 34, y: base.top + base.h * 0.68, r: 11, c: '#f3d2cc' },
      { x: base.x + base.w - 12, y: base.top + base.h * 0.86, r: 9, c: '#c4867b' },
    ];
    spots.forEach((s, k) => {
      items.push(<Leaf key={`leaf-${k}`} x={s.x - s.r * 0.95} y={s.y + s.r * 0.4} rot={k % 2 ? 30 : -30} style={delay(k * 110)} />);
      items.push(<Flower key={`f-${k}`} {...s} style={delay(80 + k * 110)} />);
    });
  }

  if (kind === 'fruit') {
    const berries: [number, number, number, string][] = [
      [-0.32, -2, 8, '#b8323f'],
      [-0.16, -7, 6, '#3d4a7a'],
      [0, -9, 9, '#c23a4a'],
      [0.14, -6, 6, '#3d4a7a'],
      [0.3, -2, 8, '#b8323f'],
      [-0.06, -2, 5, '#5b3a6e'],
      [0.22, -1, 5, '#3d4a7a'],
    ];
    berries.forEach(([fx, dy, r, c], k) => {
      const x = CX + fx * top.w;
      items.push(
        <g key={`b-${k}`} className="cp-pop" style={delay(k * 90)}>
          <circle cx={x} cy={top.top + dy} r={r} fill={c} />
          <circle cx={x - r * 0.35} cy={top.top + dy - r * 0.35} r={r * 0.28} fill="#fff" opacity="0.45" />
        </g>,
      );
    });
    items.push(<Leaf key="mint-1" x={CX - 8} y={top.top - 14} rot={-60} style={delay(650)} />);
    items.push(<Leaf key="mint-2" x={CX + 6} y={top.top - 15} rot={-120} style={delay(700)} />);
  }

  if (kind === 'gold') {
    tiers.forEach((t, i) => {
      [0.22, 0.68].forEach((fx, k) => {
        const x = t.x + t.w * fx;
        const y = t.top + t.h * (k ? 0.62 : 0.38);
        items.push(
          <path
            key={`leaf-${i}-${k}`}
            d={`M${x} ${y} l9 -5 l7 6 l-3 8 l-10 2 l-6 -6 Z`}
            fill="url(#cp-gold)"
            className="cp-pop cp-shimmer"
            style={delay(i * 180 + k * 120)}
          />,
        );
      });
      items.push(
        <path
          key={`brush-${i}`}
          d={`M${t.x + t.w * 0.38} ${t.top + t.h * 0.75} c 10 -16 22 -16 30 -4 s 18 8 26 -6`}
          stroke={dark ? '#e9c977' : '#8f9a6a'}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          pathLength={1}
          className="cp-draw"
          style={delay(300 + i * 180)}
        />,
      );
    });
  }

  if (kind === 'sculpt') {
    items.push(
      <path key="sail-1" d={`M${CX - 20} ${top.top} L${CX - 2} ${top.top - 46} L${CX + 4} ${top.top} Z`} fill="#e2ada5" className="cp-pop" style={delay(0)} />,
      <path key="sail-2" d={`M${CX - 4} ${top.top + 1} L${CX + 20} ${top.top - 34} L${CX + 24} ${top.top} Z`} fill="#626047" className="cp-pop" style={delay(140)} />,
      <circle key="orb" cx={CX - 30} cy={top.top - 8} r="9" fill="url(#cp-gold)" className="cp-pop cp-shimmer" style={delay(280)} />,
      <circle key="orb-2" cx={CX + 34} cy={top.top - 5} r="5" fill="#f3d2cc" className="cp-pop" style={delay(380)} />,
    );
  }

  return <g className="cp-deco">{items}</g>;
}

function Flower({ x, y, r, c, style }: { x: number; y: number; r: number; c: string; style?: CSSProperties }) {
  return (
    <g className="cp-pop" style={style}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={x} cy={y - r * 0.5} rx={r * 0.42} ry={r * 0.6} fill={c} transform={`rotate(${a} ${x} ${y})`} />
      ))}
      <circle cx={x} cy={y} r={r * 0.28} fill="#c99a3e" />
    </g>
  );
}

function Leaf({ x, y, rot, style }: { x: number; y: number; rot: number; style?: CSSProperties }) {
  return (
    <g className="cp-pop" style={style}>
      <ellipse cx={x} cy={y} rx="10" ry="4.5" fill="#8f9a6a" transform={`rotate(${rot} ${x} ${y})`} />
    </g>
  );
}

function Topper({ t, text }: { t: Tier; text: string }) {
  const x = CX + t.w * 0.18;
  const y = t.top - 4;
  return (
    <g className="cp-topper">
      <line x1={x} y1={y} x2={x} y2={y - 54} stroke="#c99a3e" strokeWidth="2" strokeLinecap="round" />
      <path d={`M${x} ${y - 54} h58 l-8 10 l8 10 h-58 Z`} fill="#fff" stroke="#e2ada5" strokeWidth="1.5" />
      <text x={x + 25} y={y - 40} textAnchor="middle" className="cp-topper__text">
        {text}
      </text>
    </g>
  );
}

function Sparkles() {
  const spots: [number, number, number][] = [
    [58, 64, 13],
    [304, 50, 15],
    [34, 168, 9],
    [328, 156, 10],
    [96, 14, 8],
    [266, 6, 9],
    [70, 236, 7],
    [298, 230, 8],
  ];
  return (
    <g className="cp-sparkles" aria-hidden="true">
      {spots.map(([x, y, r], k) => (
        <path
          key={k}
          d={`M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`}
          fill={k % 2 ? '#e2ada5' : '#c99a3e'}
          className="cp-sparkle"
          style={delay(k * 160)}
        />
      ))}
    </g>
  );
}
