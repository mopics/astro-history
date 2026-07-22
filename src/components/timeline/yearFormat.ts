export function niceInterval(rough: number): number {
  if (rough <= 0) return 1
  const steps = [
    0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500,
    1_000, 2_000, 5_000, 10_000, 50_000, 100_000, 500_000,
    1_000_000, 5_000_000, 10_000_000, 50_000_000, 100_000_000, 500_000_000,
    1_000_000_000, 5_000_000_000, 10_000_000_000,
  ]
  return steps.find(s => s >= rough) ?? steps[steps.length - 1]
}

export function formatYear(year: number): string {
  const abs = Math.abs(year)
  if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(abs % 500_000_000 === 0 ? 0 : 1)} Bya`
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(abs % 500_000 === 0 ? 0 : 1)} Mya`
  if (abs >= 10_000) return `${Math.round(abs / 1000)}k ${year < 0 ? 'BCE' : 'CE'}`
  if (year < 0) return `${abs} BCE`
  if (year === 0) return '0 CE'
  return `${year} CE`
}

export function decimalYearToDate(y: number): { year: number; month: number; day: number } {
  const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const year = Math.floor(y)
  const frac = y - year
  const monthFloat = frac * 12
  const month = Math.max(1, Math.min(12, Math.ceil(monthFloat) || 1))
  const isLeap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const dim = month === 2 && isLeap ? 29 : DAYS[month - 1]
  const dayFrac = monthFloat - Math.floor(monthFloat)
  const day = Math.max(1, Math.min(dim, Math.round(dayFrac * dim) || 1))
  return { year, month, day }
}
