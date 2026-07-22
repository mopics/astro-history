import type { TimeBand, BandStyle } from './band'

// Precession of the equinoxes ("Earth's wobble"): gravitational torque from
// the Sun and Moon on Earth's equatorial bulge slowly drags the rotational
// axis around a cone, completing one cycle (a "Great Year") in about 25,772
// years. This drags the equinox point backward through the zodiac. Here we
// use the equal-division convention: the cycle split into 12 ages of equal
// length, one per zodiac sign, moving in reverse zodiac order.
const CYCLE_YEARS = 25_772 // modern measured precession period
const AGE_LENGTH = CYCLE_YEARS / 12

// Tweak this to shift every age: the year the Age of Pisces is conventionally
// 1 said to have begun under equal-division dating (e.g. Neil Mann's table).
const ANCHOR_YEAR = 1 // ASC/DESC switch of short kali-yuga
const ANCHOR_SIGN_INDEX = 1 // Pisces' index in ZODIAC_RETROGRADE below

// How many full 25,772-year cycles to draw on either side of the anchor.
const CYCLES_EACH_DIRECTION = 2

// Order the ages actually occur in, moving forward through time — opposite
// to the familiar forward zodiac sequence, since precession is retrograde.
const ZODIAC_RETROGRADE = [
  'Aries', 'Pisces', 'Aquarius', 'Capricorn', 'Sagittarius', 'Scorpio',
  'Libra', 'Virgo', 'Leo', 'Cancer', 'Gemini', 'Taurus',
]

function ageColor(signIndex: number): string {
  return `hsl(${(signIndex * 30) % 360}, 65%, 55%)`
}

function generateAges(): TimeBand[] {
  const halfSpan = ZODIAC_RETROGRADE.length * CYCLES_EACH_DIRECTION
  const out: TimeBand[] = []
  for (let k = -halfSpan; k < halfSpan; k++) {
    const signIndex = ((ANCHOR_SIGN_INDEX + k) % ZODIAC_RETROGRADE.length + ZODIAC_RETROGRADE.length) % ZODIAC_RETROGRADE.length
    const start = ANCHOR_YEAR + k * AGE_LENGTH
    out.push({ start, end: start + AGE_LENGTH, label: `Age of ${ZODIAC_RETROGRADE[signIndex]}`, color: ageColor(signIndex) })
  }
  return out
}

export const PRECESSION_AGES: TimeBand[] = generateAges()

export const PRECESSION_STYLE: BandStyle = { alpha: 0.18, labelAlpha: 0.35, labelY: 72, fontSize: 8 }
