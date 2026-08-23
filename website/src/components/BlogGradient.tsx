/**
 * Premium aurora gradients — light, airy, OpenAI-inspired.
 * Each palette is a harmonious sweep; blobs are large, feathered pastels.
 * Deterministic per slug — same post always same gradient (stable across
 * navigation, good for caching). No per-load flicker.
 */

interface Palette {
  base: string;
  colors: [string, string, string, string];
}

/** Light, premium — near-white bases, soft pastels. Four distinct families. */
const PALETTES: Palette[] = [
  // Dawn — peach → pink → lavender → sky (warm sunrise)
  { base: "#FFFBEB", colors: ["#FDBA74", "#F472B6", "#C4B5FD", "#7DD3FC"] },
  // Mist — sky → indigo → violet → blush (cool twilight)
  { base: "#EFF6FF", colors: ["#7DD3FC", "#818CF8", "#C084FC", "#FDA4AF"] },
  // Meadow — mint → aqua → periwinkle → honey (fresh)
  { base: "#F0FDF4", colors: ["#6EE7B7", "#22D3EE", "#A5B4FC", "#FCD34D"] },
  // Dusk — indigo → violet → fuchsia → rose (cool violet-pink, distinct from Dawn)
  { base: "#F5F3FF", colors: ["#818CF8", "#A78BFA", "#C084FC", "#F472B6"] },
];

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function jitter(seed: number, salt: number, spread: number): number {
  const x = (seed * 1664525 + 1013904223 + salt * 747796405) >>> 0;
  return (x / 0x100000000) * 2 * spread - spread;
}

function hexRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function gradientStyle(seed: string): React.CSSProperties {
  const h = hashSeed(seed);
  const pal = PALETTES[h % PALETTES.length];

  const p0x = 22 + jitter(h, 11, 14);
  const p0y = 26 + jitter(h, 12, 10);
  const p1x = 78 + jitter(h, 13, 14);
  const p1y = 20 + jitter(h, 14, 10);
  const p2x = 52 + jitter(h, 15, 14);
  const p2y = 84 + jitter(h, 16, 10);
  const p3x = 70 + jitter(h, 17, 14);
  const p3y = 52 + jitter(h, 18, 12);

  const [c0, c1, c2, c3] = pal.colors;

  // More dark — saturated, premium.
  return {
    backgroundColor: pal.base,
    backgroundImage: [
      `radial-gradient(ellipse 110% 95% at ${p0x.toFixed(1)}% ${p0y.toFixed(1)}%, ${hexRgba(c0, 0.82)} 0%, ${hexRgba(c0, 0.48)} 32%, transparent 74%)`,
      `radial-gradient(ellipse 105% 100% at ${p1x.toFixed(1)}% ${p1y.toFixed(1)}%, ${hexRgba(c1, 0.80)} 0%, ${hexRgba(c1, 0.46)} 35%, transparent 74%)`,
      `radial-gradient(ellipse 115% 85% at ${p2x.toFixed(1)}% ${p2y.toFixed(1)}%, ${hexRgba(c2, 0.78)} 0%, ${hexRgba(c2, 0.44)} 30%, transparent 76%)`,
      `radial-gradient(ellipse 100% 95% at ${p3x.toFixed(1)}% ${p3y.toFixed(1)}%, ${hexRgba(c3, 0.76)} 0%, ${hexRgba(c3, 0.42)} 28%, transparent 72%)`,
      `linear-gradient(180deg, rgba(255,255,255,0.08), transparent 55%)`,
    ].join(", "),
  };
}

const NOISE_DATA_URI =
  "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E";

export default function BlogGradient({
  seed,
  className = "",
}: {
  seed: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={gradientStyle(seed)}>
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{ backgroundImage: `url("${NOISE_DATA_URI}")` }}
        aria-hidden="true"
      />
    </div>
  );
}
