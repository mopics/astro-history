const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

export function longitudeToZodiac(longitude: number): { sign: string; signDegree: number } {
  const normalized = ((longitude % 360) + 360) % 360
  const sign = SIGNS[Math.floor(normalized / 30)]
  const signDegree = normalized % 30
  return { sign, signDegree }
}

export function isRetrograde(speedLon: number): boolean {
  return speedLon < 0
}
