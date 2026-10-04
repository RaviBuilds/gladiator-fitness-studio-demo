import type { FitnessToolId } from "@/lib/types";

/**
 * Illustrations for the Training Tools strip (components/sections/
 * TrainingTools.tsx). Inline SVG, Server Components, zero dependencies.
 *
 * Every drawing is decorative (aria-hidden) and coloured only through the
 * `.s05-viz*` CSS classes in app/globals.css, which resolve to Section 05's
 * paper tokens — so there is no colour literal in this file and a gym's accent
 * flows through automatically. Motion is CSS-only and lives in the same place.
 *
 * Each drawing illustrates what its tool actually produces:
 *   starting-point  -> a "you are here" pin on a 5-tick dial (5 questions)
 *   journey         -> a rising route with 3 / 6 / 12-month checkpoints
 *   first-30-days   -> a weekly rhythm over a 30-day grid
 * They are chosen by registry id; a tool without a drawing simply renders
 * without one.
 */

const VIEW = "0 0 240 120";
const r2 = (n: number) => Math.round(n * 100) / 100;

function StartingPoint() {
  const ticks = Array.from({ length: 5 }, (_, i) => {
    const a = ((-90 + 72 * i) * Math.PI) / 180;
    return {
      i,
      x1: r2(120 + Math.cos(a) * 46),
      y1: r2(64 + Math.sin(a) * 46),
      x2: r2(120 + Math.cos(a) * 54),
      y2: r2(64 + Math.sin(a) * 54),
    };
  });

  return (
    <svg viewBox={VIEW} className="s05-viz" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="s05-viz-dots" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="6" r="0.9" className="s05-viz-dot" />
        </pattern>
      </defs>
      <rect width="240" height="120" fill="url(#s05-viz-dots)" />
      <line x1="56" y1="64" x2="184" y2="64" className="s05-viz-cross" />
      <line x1="120" y1="6" x2="120" y2="118" className="s05-viz-cross" />
      <circle cx="120" cy="64" r="46" className="s05-viz-ring" />
      <circle cx="120" cy="64" r="30" className="s05-viz-ring" />
      <circle cx="120" cy="64" r="14" className="s05-viz-ring" />
      {ticks.map((t) => (
        <line key={t.i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} className="s05-viz-tick" />
      ))}
      <circle cx="120" cy="64" r="14" className="s05-viz-ping" />
      <circle cx="120" cy="64" r="2.4" className="s05-viz-pin" />
      <g className="s05-viz-drop">
        <path
          d="M120 64C120 64 110 55 110 46A10 10 0 0 1 130 46C130 55 120 64 120 64Z"
          className="s05-viz-pin"
        />
        <circle cx="120" cy="46" r="3.6" className="s05-viz-pin-hole" />
      </g>
      <text x="138" y="40" className="s05-viz-label">
        YOU ARE HERE
      </text>
    </svg>
  );
}

const CHECKPOINTS: { x: number; y: number; label: string }[] = [
  { x: 100, y: 68, label: "3 MO" },
  { x: 176, y: 40, label: "6 MO" },
  { x: 226, y: 18, label: "12 MO" },
];

function Journey() {
  return (
    <svg viewBox={VIEW} className="s05-viz" aria-hidden="true" focusable="false">
      <line x1="8" y1="100" x2="234" y2="100" className="s05-viz-axis" />
      {CHECKPOINTS.map((c) => (
        <line key={c.label} x1={c.x} y1={c.y} x2={c.x} y2="100" className="s05-viz-cross" />
      ))}
      <path
        d="M14 96Q56 94 100 68Q140 46 176 40Q208 34 226 18"
        className="s05-viz-route"
        pathLength={400}
      />
      <circle cx="14" cy="96" r="3.2" className="s05-viz-node s05-viz-node-start" />
      {CHECKPOINTS.map((c, i) => (
        <circle
          key={c.label}
          cx={c.x}
          cy={c.y}
          r="4.6"
          className={`s05-viz-node s05-viz-node-pop ${i === CHECKPOINTS.length - 1 ? "s05-viz-node-end" : ""}`}
          style={{ "--d": `${300 + i * 260}ms` } as React.CSSProperties}
        />
      ))}
      <text x="8" y="113" className="s05-viz-label">
        NOW
      </text>
      {CHECKPOINTS.map((c, i) => (
        <text
          key={c.label}
          x={c.x}
          y="113"
          textAnchor={i === CHECKPOINTS.length - 1 ? "end" : "middle"}
          dx={i === CHECKPOINTS.length - 1 ? 8 : 0}
          className="s05-viz-label"
        >
          {c.label}
        </text>
      ))}
    </svg>
  );
}

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
// Illustrative rhythm only (Mon / Wed / Fri) — not a recommendation.
const RHYTHM = new Set([0, 2, 4]);

function First30Days() {
  const cells = Array.from({ length: 30 }, (_, n) => ({
    n,
    x: 15 + (n % 15) * 14,
    y: 56 + Math.floor(n / 15) * 14,
    on: RHYTHM.has(n % 7),
  }));

  return (
    <svg viewBox={VIEW} className="s05-viz" aria-hidden="true" focusable="false">
      {WEEK.map((d, i) => (
        <g key={i}>
          <rect
            x={11 + i * 32}
            y="10"
            width="26"
            height="24"
            className={`s05-viz-day ${RHYTHM.has(i) ? "s05-viz-day-on" : ""}`}
          />
          <text
            x={11 + i * 32 + 13}
            y="26"
            textAnchor="middle"
            className={`s05-viz-day-text ${RHYTHM.has(i) ? "s05-viz-day-text-on" : ""}`}
          >
            {d}
          </text>
        </g>
      ))}
      {cells.map((c) => (
        <rect
          key={c.n}
          x={c.x}
          y={c.y}
          width="10"
          height="10"
          className={`s05-viz-cell ${c.on ? "s05-viz-cell-on" : ""} ${c.n === 0 ? "s05-viz-cell-first" : ""}`}
          style={{ "--i": c.n } as React.CSSProperties}
        />
      ))}
      <line x1="56" y1="96" x2="190" y2="96" className="s05-viz-axis" />
      <path d="M186 93L191 96L186 99" className="s05-viz-arrow" />
      <text x="15" y="109" className="s05-viz-label">
        DAY 1
      </text>
      <text x="225" y="109" textAnchor="end" className="s05-viz-label">
        DAY 30
      </text>
    </svg>
  );
}

/** The drawing for a tool, or null when a tool has none. */
export function ToolVisual({ id }: { id: FitnessToolId }) {
  switch (id) {
    case "starting-point":
      return <StartingPoint />;
    case "journey":
      return <Journey />;
    case "first-30-days":
      return <First30Days />;
    default:
      return null;
  }
}

/**
 * Wide route drawing for the strip's header (desktop only — hidden by CSS
 * below 1024px). One numbered node per tool, joined by a slowly travelling
 * dashed route. The numbers are the tools' own display indexes.
 */
export function ToolsRouteBanner({ indexes }: { indexes: string[] }) {
  const n = indexes.length;
  if (n === 0) return null;

  const pts = indexes.map((label, i) => {
    const t = n === 1 ? 0 : i / (n - 1);
    return { label, x: r2(40 + t * 320), y: r2(66 - t * 40) };
  });

  // Quadratic segments between node centres: each node sits exactly on the path.
  const d = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cx = r2((prev.x + p.x) / 2);
    const cy = r2((prev.y + p.y) / 2 + (i % 2 === 0 ? -16 : 16));
    return `${acc}Q${cx} ${cy} ${p.x} ${p.y}`;
  }, "");

  return (
    <svg viewBox="0 0 400 100" className="s05-viz-banner" aria-hidden="true" focusable="false">
      <path d={d} className="s05-viz-banner-route" />
      {pts.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="13" className="s05-viz-banner-node" />
          <text x={p.x} y={p.y + 3} textAnchor="middle" className="s05-viz-banner-text">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
