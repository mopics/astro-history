import type { ChartBody } from '../stores/AstroChartStore'

// ── Layout constants ──────────────────────────────────────────────────────────

const CX = 200, CY = 200
const R_OUT   = 190   // outer rim
const R_ZIN   = 154   // inner edge of zodiac band
const R_PLA   = 128   // planet glyph nominal radius
const R_ASP   = 104   // aspect line endpoint radius
const R_CORE  = 100   // innermost filled circle

// ── Static data ───────────────────────────────────────────────────────────────

type Element = 'fire' | 'earth' | 'air' | 'water'

const ZODIAC: { glyph: string; el: Element }[] = [
  { glyph: '♈', el: 'fire'  },   // Aries      0°
  { glyph: '♉', el: 'earth' },   // Taurus    30°
  { glyph: '♊', el: 'air'   },   // Gemini    60°
  { glyph: '♋', el: 'water' },   // Cancer    90°
  { glyph: '♌', el: 'fire'  },   // Leo      120°
  { glyph: '♍', el: 'earth' },   // Virgo    150°
  { glyph: '♎', el: 'air'   },   // Libra    180°
  { glyph: '♏', el: 'water' },   // Scorpio  210°
  { glyph: '♐', el: 'fire'  },   // Sagittarius 240°
  { glyph: '♑', el: 'earth' },   // Capricorn 270°
  { glyph: '♒', el: 'air'   },   // Aquarius  300°
  { glyph: '♓', el: 'water' },   // Pisces    330°
]

const EL_FILL: Record<Element, string> = {
  fire:  '#9a1f0f1a', earth: '#14532d1a',
  air:   '#78350f1a', water: '#1e3a5f1a',
}
const EL_STROKE: Record<Element, string> = {
  fire:  '#dc2626', earth: '#16a34a',
  air:   '#ca8a04', water: '#2563eb',
}

const PLANET_GLYPHS: Record<string, string> = {
  'Sun':        '☉', 'Moon':       '☽', 'Mercury':  '☿',
  'Venus':      '♀', 'Mars':       '♂', 'Jupiter':  '♃',
  'Saturn':     '♄', 'Uranus':     '♅', 'Neptune':  '♆',
  'Pluto':      '♇', 'North Node': '☊', 'South Node': '☋',
}

const PLANET_COLORS: Record<string, string> = {
  'Sun':        '#fbbf24', 'Moon':       '#e2e8f0', 'Mercury':  '#a78bfa',
  'Venus':      '#f9a8d4', 'Mars':       '#f87171', 'Jupiter':  '#fb923c',
  'Saturn':     '#94a3b8', 'Uranus':     '#67e8f9', 'Neptune':  '#818cf8',
  'Pluto':      '#c084fc', 'North Node': '#4ade80', 'South Node': '#4ade80',
}

const ASPECT_DEFS = [
  { angle: 0,   orb: 8, color: '#ffd700', dash: ''        },  // conjunction
  { angle: 60,  orb: 6, color: '#60a5fa', dash: '4 3'     },  // sextile
  { angle: 90,  orb: 8, color: '#f87171', dash: ''        },  // square
  { angle: 120, orb: 8, color: '#4ade80', dash: ''        },  // trine
  { angle: 180, orb: 8, color: '#fb923c', dash: '2 2'     },  // opposition
  { angle: 150, orb: 3, color: '#c084fc', dash: '6 3 2 3' },  // quincunx
]

// ── Geometry helpers ──────────────────────────────────────────────────────────

// Ecliptic longitude → SVG (x, y).
// Convention: 0° (Pisces/Aries cusp) at 12-o'clock, signs go counter-clockwise.
// angle = (270 − lon)° maps: 0°→top, 90°→left, 180°→bottom, 270°→right.
function pt(lon: number, r: number): [number, number] {
  const a = (270 - lon) * (Math.PI / 180)
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)]
}

// Donut-sector SVG path for a 30° zodiac sign.
// pt() maps increasing longitude to counter-clockwise screen motion (decreasing SVG angle),
// so the outer arc uses sweep=0 (CCW) and the inner return arc sweep=1 (CW).
function sectorPath(i: number): string {
  const [ox1, oy1] = pt(i * 30,      R_OUT)
  const [ox2, oy2] = pt(i * 30 + 30, R_OUT)
  const [ix2, iy2] = pt(i * 30 + 30, R_ZIN)
  const [ix1, iy1] = pt(i * 30,      R_ZIN)
  return [
    `M ${ox1} ${oy1}`,
    `A ${R_OUT} ${R_OUT} 0 0 0 ${ox2} ${oy2}`,
    `L ${ix2} ${iy2}`,
    `A ${R_ZIN} ${R_ZIN} 0 0 1 ${ix1} ${iy1}`,
    'Z',
  ].join(' ')
}

// ── Aspect computation ────────────────────────────────────────────────────────

type AspectLine = { lon1: number; lon2: number; color: string; dash: string }

function computeAspects(bodies: ChartBody[]): AspectLine[] {
  const lines: AspectLine[] = []
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const diff = Math.abs(bodies[i].longitude - bodies[j].longitude)
      const angle = diff > 180 ? 360 - diff : diff
      for (const def of ASPECT_DEFS) {
        if (Math.abs(angle - def.angle) <= def.orb) {
          lines.push({ lon1: bodies[i].longitude, lon2: bodies[j].longitude, color: def.color, dash: def.dash })
          break
        }
      }
    }
  }
  return lines
}

// ── Planet deconfliction ──────────────────────────────────────────────────────
// Planets within 7° of each other alternate between two radii to reduce overlap.

function planetRadii(bodies: ChartBody[]): Map<string, number> {
  const sorted = [...bodies].sort((a, b) => a.longitude - b.longitude)
  const map = new Map<string, number>()
  for (let i = 0; i < sorted.length; i++) {
    const prev = i > 0 ? sorted[i - 1].longitude : null
    const tooClose = prev !== null && (sorted[i].longitude - prev) < 7
    const prevR = prev !== null ? (map.get(sorted[i - 1].name) ?? R_PLA) : R_PLA
    map.set(sorted[i].name, tooClose && prevR === R_PLA ? R_PLA - 15 : R_PLA)
  }
  return map
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AstroWheel({ bodies }: { bodies: ChartBody[] }) {
  const aspects = computeAspects(bodies)
  const radii   = planetRadii(bodies)

  return (
    <svg
      viewBox="0 0 400 400"
      className="w-full h-full"
      style={{ fontFamily: 'Georgia, serif', background: '#07090f' }}
    >
      {/* ── Zodiac band ── */}
      {ZODIAC.map((z, i) => (
        <path key={i} d={sectorPath(i)} fill={EL_FILL[z.el]} stroke="#1a2535" strokeWidth="0.6" />
      ))}

      {/* Outer rim */}
      <circle cx={CX} cy={CY} r={R_OUT} fill="none" stroke="#1e3048" strokeWidth="1.5" />

      {/* Sign dividers */}
      {ZODIAC.map((_, i) => {
        const [x1, y1] = pt(i * 30, R_OUT)
        const [x2, y2] = pt(i * 30, R_ZIN)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#243447" strokeWidth="0.8" />
      })}

      {/* Zodiac glyphs */}
      {ZODIAC.map((z, i) => {
        const [x, y] = pt(i * 30 + 15, (R_OUT + R_ZIN) / 2)
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central"
            fontSize="14" fill={EL_STROKE[z.el]} opacity="0.85">
            {z.glyph}
          </text>
        )
      })}

      {/* Degree ticks every 5° */}
      {Array.from({ length: 72 }, (_, i) => i * 5).map(deg => {
        const major = deg % 10 === 0
        const [x1, y1] = pt(deg, R_ZIN)
        const [x2, y2] = pt(deg, R_ZIN - (major ? 8 : 4))
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#253447" strokeWidth={major ? 0.9 : 0.5} />
      })}

      {/* Inner zodiac ring edge */}
      <circle cx={CX} cy={CY} r={R_ZIN} fill="none" stroke="#1e3048" strokeWidth="0.8" />

      {/* Core fill */}
      <circle cx={CX} cy={CY} r={R_CORE} fill="#07090f" stroke="#1a2535" strokeWidth="0.8" />

      {/* Aspect lines */}
      {aspects.map((asp, i) => {
        const [x1, y1] = pt(asp.lon1, R_ASP)
        const [x2, y2] = pt(asp.lon2, R_ASP)
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={asp.color} strokeWidth="0.75" strokeDasharray={asp.dash} opacity="0.45" />
        )
      })}

      {/* Planet position ticks on inner zodiac edge */}
      {bodies.map(body => {
        const color = PLANET_COLORS[body.name] ?? '#e2e8f0'
        const [x1, y1] = pt(body.longitude, R_ZIN)
        const [x2, y2] = pt(body.longitude, R_ZIN - 13)
        return <line key={body.name} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={color} strokeWidth="1" opacity="0.55" />
      })}

      {/* Planet glyphs */}
      {bodies.map(body => {
        const r     = radii.get(body.name) ?? R_PLA
        const [x, y] = pt(body.longitude, r)
        const color = PLANET_COLORS[body.name] ?? '#e2e8f0'
        const glyph = PLANET_GLYPHS[body.name] ?? '●'
        return (
          <g key={body.name}>
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
              fontSize="13" fill={color}>
              {glyph}
            </text>
            {body.retrograde && (
              <text x={x + 8} y={y - 6} fontSize="7" fill={color} opacity="0.75">℞</text>
            )}
          </g>
        )
      })}

      {/* Centre dot */}
      <circle cx={CX} cy={CY} r="2.5" fill="#334155" />
    </svg>
  )
}
