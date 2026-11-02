/*
 * Hand-drawn-style spot illustrations.
 * Rules: 3px ink stroke, round caps, flat fills from the brand palette, slight wobble.
 */
const INK = "#121412";
const LIME = "#B8F28F";
const FOREST = "#2D6A4F";
const CREAM = "#FAF6EF";
const AMBER = "#FFC94D";
const EMBER = "#FF7A2F";

const s = {
  stroke: INK,
  strokeWidth: 3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type P = { className?: string };

export function OpenWindow({ className }: P) {
  return (
    <svg viewBox="0 0 240 220" className={className} aria-hidden="true">
      <rect x="62" y="32" width="116" height="150" fill={LIME} {...s} />
      <circle cx="94" cy="66" r="12" fill={CREAM} {...s} />
      <path
        d="M62 132c22-18 44-20 62-8s36 10 54-6v64H62z"
        fill={FOREST}
        {...s}
      />
      <path d="M143 126V98" {...s} />
      <path
        d="M143 70c-9 0-14 9-13 18 1 8 6 12 13 12s12-5 13-12c1-9-4-18-13-18z"
        fill={INK}
        {...s}
      />
      <path d="M62 32 22 16v182l40-16z" fill={CREAM} {...s} />
      <path d="M178 32l40-16v182l-40-16z" fill={CREAM} {...s} />
      <path d="M22 107l40-1M218 107l-40-1" {...s} />
      <path d="M34 50l10-14M34 140l10-14M196 50l10-14M196 140l10-14" {...s} strokeWidth={2.4} />
      <path d="M200 6l6-8M212 12l10-4M188 2l-1-9" {...s} strokeWidth={2.4} />
    </svg>
  );
}

export function CrackedHourglass({ className }: P) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <rect x="26" y="12" width="68" height="12" rx="4" fill={INK} {...s} />
      <rect x="26" y="96" width="68" height="12" rx="4" fill={INK} {...s} />
      <path
        d="M34 24c0 22 22 26 22 36S34 74 34 96h52c0-22-22-26-22-36s22-14 22-36z"
        fill={CREAM}
        {...s}
      />
      <path d="M42 96c4-10 14-14 18-14s14 4 18 14z" fill={AMBER} {...s} />
      <path d="M44 34h32c-4 8-12 12-16 16-4-4-12-8-16-16z" fill={AMBER} {...s} />
      <path d="M70 30l-6 10 8 6-6 12" {...s} strokeWidth={2.4} />
      <path d="M96 40l12-6M98 54h12M14 40 2 34" {...s} strokeWidth={2.4} />
    </svg>
  );
}

export function TagLens({ className }: P) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <path
        d="M14 22h40l46 46-36 36-50-46z"
        fill={CREAM}
        {...s}
      />
      <circle cx="32" cy="38" r="6" fill={INK} {...s} />
      <path d="M48 60h22M48 72h14" {...s} />
      <circle cx="78" cy="52" r="20" fill={LIME} fillOpacity={0.85} {...s} />
      <path d="M92 66l18 18" {...s} strokeWidth={6} />
      <path d="M70 46c2-5 6-7 10-7" stroke={CREAM} strokeWidth={3} strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Sprout({ className }: P) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <path d="M60 92V54" {...s} />
      <path d="M60 64C46 64 30 56 28 40c16-2 32 6 32 24z" fill={LIME} {...s} />
      <path d="M60 56c4-18 18-28 34-26-2 18-16 28-34 26z" fill={LIME} {...s} />
      <path
        d="M18 108c4-14 20-20 42-20s38 6 42 20z"
        fill={INK}
        {...s}
      />
      <path d="M100 18l3 8 8 3-8 3-3 8-3-8-8-3 8-3zM20 66l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill={CREAM} {...s} strokeWidth={2.2} />
    </svg>
  );
}

export function Network({ className }: P) {
  const nodes: [number, number, string][] = [
    [20, 24, CREAM],
    [62, 16, LIME],
    [100, 28, INK],
    [36, 62, CREAM],
    [78, 58, CREAM],
    [18, 98, INK],
    [58, 100, LIME],
    [100, 92, LIME],
  ];
  const edges = [
    [0, 1], [1, 2], [0, 3], [1, 3], [1, 4], [2, 4], [3, 4],
    [3, 5], [3, 6], [4, 6], [4, 7], [5, 6], [6, 7], [2, 7],
  ];
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      {edges.map(([a, b], i) => (
        <path
          key={i}
          d={`M${nodes[a][0]} ${nodes[a][1]}L${nodes[b][0]} ${nodes[b][1]}`}
          {...s}
          strokeWidth={2.2}
        />
      ))}
      {nodes.map(([x, y, f], i) => (
        <circle key={i} cx={x} cy={y} r={i === 4 ? 10 : 7} fill={f} {...s} strokeWidth={2.6} />
      ))}
    </svg>
  );
}

export function ScanLens({ className }: P) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <rect x="10" y="18" width="84" height="70" rx="8" fill={CREAM} {...s} />
      <path d="M10 34h84" {...s} />
      <circle cx="20" cy="26" r="2" fill={INK} />
      <circle cx="28" cy="26" r="2" fill={INK} />
      <path d="M22 48h40M22 60h28" {...s} strokeWidth={2.6} />
      <rect x="22" y="68" width="26" height="10" rx="3" fill={EMBER} {...s} strokeWidth={2.4} />
      <circle cx="74" cy="72" r="20" fill={LIME} fillOpacity={0.85} {...s} />
      <path d="M88 86l20 20" {...s} strokeWidth={6} />
    </svg>
  );
}

export function Wand({ className }: P) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <path d="M22 98l56-56" {...s} strokeWidth={8} />
      <path d="M22 98l56-56" stroke={CREAM} strokeWidth={3} strokeLinecap="round" />
      <path d="M78 42l8-8" stroke={LIME} strokeWidth={8} strokeLinecap="round" />
      <path d="M92 14l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill={LIME} {...s} strokeWidth={2.4} />
      <path d="M50 18l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM100 62l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill={CREAM} {...s} strokeWidth={2.2} />
    </svg>
  );
}

export function AirFryer({ className }: P) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <ellipse cx="100" cy="182" rx="66" ry="8" fill={INK} opacity={0.12} />
      <path
        d="M46 40c0-14 10-22 24-22h60c14 0 24 8 24 22v116c0 12-8 20-20 20H66c-12 0-20-8-20-20z"
        fill={CREAM}
        {...s}
      />
      <rect x="66" y="34" width="68" height="26" rx="10" fill={INK} {...s} />
      <circle cx="84" cy="47" r="4" fill={LIME} />
      <path d="M96 47h26" stroke={LIME} strokeWidth={3} strokeLinecap="round" />
      <path d="M52 94h96v54c0 10-6 16-16 16H68c-10 0-16-6-16-16z" fill={FOREST} {...s} />
      <rect x="80" y="84" width="40" height="18" rx="9" fill={INK} {...s} />
      <path d="M64 112h72" stroke={CREAM} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
      <path d="M58 76h84" {...s} strokeWidth={2.4} />
    </svg>
  );
}
