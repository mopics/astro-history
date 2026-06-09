export type Period = {
  start: number
  end: number | null
  label: string
  color: string
  tags: string[]
  level: number  // 1 = eon, 2 = era, 3 = period
}

// Source: https://en.wikipedia.org/wiki/List_of_time_periods
export const PERIODS: Period[] = [
  // Eons (level 1)
  { start: -4_600_000_000, end: -4_000_000_000, label: 'Hadean', color: '#6b21a8', tags: ['geological', 'eon'], level: 1 },
  { start: -4_000_000_000, end: -2_500_000_000, label: 'Archean', color: '#9f1239', tags: ['geological', 'eon'], level: 1 },
  { start: -2_500_000_000, end: -541_000_000, label: 'Proterozoic', color: '#0e4c7a', tags: ['geological', 'eon'], level: 1 },
  // Eras — Phanerozoic (level 2)
  { start: -541_000_000, end: -252_000_000, label: 'Paleozoic', color: '#1d4ed8', tags: ['geological', 'era'], level: 2 },
  { start: -252_000_000, end: -66_000_000, label: 'Mesozoic', color: '#15803d', tags: ['geological', 'era'], level: 2 },
  { start: -66_000_000, end: null, label: 'Cenozoic', color: '#b45309', tags: ['geological', 'era'], level: 2 },
  // Periods (level 3)
  { start: -541_000_000, end: -485_400_000, label: 'Cambrian', color: '#2563eb', tags: ['geological', 'period'], level: 3 },
  { start: -485_400_000, end: -443_800_000, label: 'Ordovician', color: '#0284c7', tags: ['geological', 'period'], level: 3 },
  { start: -443_800_000, end: -419_200_000, label: 'Silurian', color: '#0891b2', tags: ['geological', 'period'], level: 3 },
  { start: -419_200_000, end: -358_900_000, label: 'Devonian', color: '#0d9488', tags: ['geological', 'period'], level: 3 },
  { start: -358_900_000, end: -298_900_000, label: 'Carboniferous', color: '#059669', tags: ['geological', 'period'], level: 3 },
  { start: -298_900_000, end: -251_900_000, label: 'Permian', color: '#92400e', tags: ['geological', 'period'], level: 3 },
  { start: -251_900_000, end: -201_300_000, label: 'Triassic', color: '#c2410c', tags: ['geological', 'period'], level: 3 },
  { start: -201_300_000, end: -145_000_000, label: 'Jurassic', color: '#166534', tags: ['geological', 'period'], level: 3 },
  { start: -145_000_000, end: -66_000_000, label: 'Cretaceous', color: '#15803d', tags: ['geological', 'period'], level: 3 },
  { start: -66_000_000, end: -23_030_000, label: 'Paleogene', color: '#a16207', tags: ['geological', 'period'], level: 3 },
  { start: -23_030_000, end: -2_580_000, label: 'Neogene', color: '#b45309', tags: ['geological', 'period'], level: 3 },
  { start: -2_580_000, end: null, label: 'Quaternary', color: '#d97706', tags: ['geological', 'period'], level: 3 },

  // European periods
  { start: -3000, end: -1050, label: 'Bronze Age Europe', color: '#f97316', tags: ['european', 'period'], level: 4 },
  { start: -1050, end: 500, label: 'Iron Age Europe', color: '#f59e0b', tags: ['european', 'period'], level: 4 },
  { start: 476, end: 1492, label: 'Middle Ages Europe', color: '#d97706', tags: ['european', 'period'], level: 4 },
  { start: 1492, end: 1789, label: 'Early Modern Europe', color: '#b45309', tags: ['european', 'period'], level: 4 },
]

export const ALL_TAGS: string[] = Array.from(
  new Set(PERIODS.flatMap(p => p.tags))
).sort()
