import { useEffect, useRef, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { autorun } from 'mobx'
import { useRootStore } from '../stores/StoreContext'
import type { TimelineStore } from '../stores/TimelineStore'

// ── Cosmic event catalogue ──────────────────────────────────────────────────

type Era = { year: number; label: string; color: string; priority: number; size: number }

const ERAS: Era[] = [
  { year: -13_800_000_000, label: 'BIG BANG', color: '#ff6b35', priority: 1, size: 13 },
  { year: -13_500_000_000, label: 'First Stars', color: '#ffd700', priority: 2, size: 11 },
  { year: -13_200_000_000, label: 'First Galaxies', color: '#a78bfa', priority: 2, size: 11 },
  { year: -4_600_000_000, label: 'Solar System', color: '#60a5fa', priority: 1, size: 12 },
  { year: -3_800_000_000, label: 'Life on Earth', color: '#4ade80', priority: 1, size: 12 },
  { year: -541_000_000, label: 'Cambrian', color: '#86efac', priority: 2, size: 11 },
  { year: -252_000_000, label: 'Great Dying', color: '#f87171', priority: 2, size: 11 },
  { year: -66_000_000, label: 'K-Pg Extinction', color: '#fb923c', priority: 2, size: 11 },
  { year: -3_300_000, label: 'Hominids', color: '#d4a574', priority: 3, size: 10 },
  { year: -10_000, label: 'Agriculture', color: '#fbbf24', priority: 3, size: 10 },
  { year: -3_000, label: 'Bronze Age', color: '#e2b96a', priority: 4, size: 10 },
  { year: 0, label: 'Common Era', color: '#cbd5e1', priority: 3, size: 10 },
  { year: 1440, label: 'Printing Press', color: '#c4b5fd', priority: 4, size: 10 },
  { year: 1969, label: 'Moon Landing', color: '#a78bfa', priority: 4, size: 10 },
]

// ── Geological period catalogue ──────────────────────────────────────────────

type Period = {
  start: number
  end: number | null  // null = extends to present
  label: string
  color: string
  tags: string[]
  level: number  // 1 = eon, 2 = era, 3 = period
}


// Source: https://en.wikipedia.org/wiki/List_of_time_periods
const PERIODS: Period[] = [
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
]

// ── Helpers ─────────────────────────────────────────────────────────────────

function niceInterval(rough: number): number {
  if (rough <= 0) return 1
  const steps = [
    0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500,
    1_000, 2_000, 5_000, 10_000, 50_000, 100_000, 500_000,
    1_000_000, 5_000_000, 10_000_000, 50_000_000, 100_000_000, 500_000_000,
    1_000_000_000, 5_000_000_000, 10_000_000_000,
  ]
  return steps.find(s => s >= rough) ?? steps[steps.length - 1]
}

function formatYear(year: number): string {
  const abs = Math.abs(year)
  if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(abs % 500_000_000 === 0 ? 0 : 1)} Bya`
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(abs % 500_000 === 0 ? 0 : 1)} Mya`
  if (abs >= 10_000) return `${Math.round(abs / 1000)}k ${year < 0 ? 'BCE' : 'CE'}`
  if (year < 0) return `${abs} BCE`
  if (year === 0) return '0 CE'
  return `${year} CE`
}

function decimalYearToDate(y: number): { year: number; month: number; day: number } {
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

// ── Canvas renderer ──────────────────────────────────────────────────────────

function drawPeriods(
  ctx: CanvasRenderingContext2D,
  store: TimelineStore,
  W: number,
  H: number,
) {
  for (const p of PERIODS) {
    const startPx = store.yearToPixel(p.start, W)
    const endPx = store.yearToPixel(p.end ?? store.nowYear, W)
    if (endPx < 0 || startPx > W) continue

    const x0 = Math.max(0, startPx)
    const x1 = Math.min(W, endPx)
    const bw = x1 - x0
    if (bw < 2) continue

    const alpha = p.level === 1 ? 0.12 : p.level === 2 ? 0.16 : 0.22

    ctx.save()

    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.fillRect(x0, 0, bw, H)

    if (startPx >= 0 && startPx <= W) {
      ctx.globalAlpha = alpha * 1.5
      ctx.strokeStyle = p.color
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(startPx, 0)
      ctx.lineTo(startPx, H)
      ctx.stroke()
    }

    if (bw > 40) {
      ctx.beginPath()
      ctx.rect(x0 + 2, 0, bw - 4, H)
      ctx.clip()

      const lx = (x0 + x1) / 2
      const ly = p.level === 1 ? 12 : p.level === 2 ? 22 : 32
      const fs = p.level === 1 ? 10 : p.level === 2 ? 9 : 8
      ctx.globalAlpha = p.level === 1 ? 0.25 : p.level === 2 ? 0.30 : 0.35
      ctx.fillStyle = '#c8d8e8'
      ctx.font = `${fs}px ui-monospace, monospace`
      ctx.textAlign = 'center'
      ctx.fillText(p.label.toUpperCase(), lx, ly)
    }

    ctx.restore()
  }
}

function draw(
  ctx: CanvasRenderingContext2D,
  store: TimelineStore,
  selectedDecimalYear: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = '#07090f'
  ctx.fillRect(0, 0, W, H)

  const lineY = Math.round(H * 0.58)

  // ── geological period bands ──
  drawPeriods(ctx, store, W, H)

  // ── gradient history band ──
  const bbPx = store.yearToPixel(store.bigBangYear, W)
  const nowPx = store.yearToPixel(store.nowYear, W)
  const x0 = Math.max(0, bbPx)
  const x1 = Math.min(W, nowPx)
  if (x1 > x0) {
    const grad = ctx.createLinearGradient(x0, 0, x1, 0)
    grad.addColorStop(0, '#ff6b3530')
    grad.addColorStop(0.35, '#1e3a5f60')
    grad.addColorStop(0.85, '#16453060')
    grad.addColorStop(1, '#4ade8060')
    ctx.strokeStyle = grad
    ctx.lineWidth = 3
    ctx.globalAlpha = 0.4
    ctx.beginPath(); ctx.moveTo(x0, lineY); ctx.lineTo(x1, lineY); ctx.stroke()
    ctx.globalAlpha = 1
  }

  // base axis
  ctx.strokeStyle = '#1e2a3a'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(W, lineY); ctx.stroke()

  // ── tick marks ──
  const visibleYears = W * store.yearPerPx
  const interval = niceInterval(visibleYears / 8)
  const startYear = store.pixelToYear(0, W)
  const endYear = store.pixelToYear(W, W)
  const firstTick = Math.ceil(startYear / interval) * interval

  ctx.font = '10px ui-monospace, monospace'
  ctx.textAlign = 'center'

  for (let y = firstTick; y <= endYear + interval; y += interval) {
    const px = store.yearToPixel(y, W)
    if (px < -40 || px > W + 40) continue
    const isMajor = Math.abs((y / (interval * 5)) - Math.round(y / (interval * 5))) < 0.001
    const tickH = isMajor ? 9 : 4
    ctx.strokeStyle = isMajor ? '#334155' : '#1e293b'
    ctx.lineWidth = isMajor ? 1 : 0.5
    ctx.beginPath()
    ctx.moveTo(px, lineY - tickH); ctx.lineTo(px, lineY + tickH)
    ctx.stroke()
    if (isMajor) {
      ctx.fillStyle = '#475569'
      ctx.fillText(formatYear(y), px, lineY + tickH + 14)
    }
  }

  // ── era / event markers ──
  const minPriority =
    visibleYears < 500 ? 5
      : visibleYears < 50_000 ? 4
        : visibleYears < 1e8 ? 3
          : visibleYears < 2e9 ? 2
            : 1

  for (const era of ERAS) {
    if (era.priority > minPriority) continue
    const px = store.yearToPixel(era.year, W)
    if (px < -120 || px > W + 120) continue

    ctx.save()
    ctx.strokeStyle = era.color + '55'
    ctx.lineWidth = era.priority === 1 ? 1.5 : 1
    ctx.setLineDash([3, 4])
    ctx.beginPath()
    ctx.moveTo(px, lineY - 8); ctx.lineTo(px, lineY - 44)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = era.color
    ctx.beginPath()
    ctx.moveTo(px, lineY - 8)
    ctx.lineTo(px + 4, lineY - 2)
    ctx.lineTo(px, lineY + 4)
    ctx.lineTo(px - 4, lineY - 2)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = era.color
    ctx.font = `${era.priority === 1 ? 'bold ' : ''}${era.size}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(era.label, px, lineY - 52)
    ctx.restore()
  }

  // ── BIG BANG radial glow ──
  if (bbPx > -60 && bbPx < W + 60) {
    const rg = ctx.createRadialGradient(bbPx, lineY, 0, bbPx, lineY, 36)
    rg.addColorStop(0, '#ff6b3555')
    rg.addColorStop(0.5, '#ff6b3515')
    rg.addColorStop(1, 'transparent')
    ctx.fillStyle = rg
    ctx.beginPath()
    ctx.arc(bbPx, lineY, 36, 0, Math.PI * 2)
    ctx.fill()
  }

  // ── NOW marker ──
  if (nowPx > -4 && nowPx < W + 4) {
    ctx.save()
    ctx.strokeStyle = '#4ade80'
    ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.7
    ctx.setLineDash([3, 3])
    ctx.beginPath(); ctx.moveTo(nowPx, 8); ctx.lineTo(nowPx, H - 8); ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1
    ctx.fillStyle = '#4ade80'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = nowPx > W - 50 ? 'right' : 'left'
    ctx.fillText('NOW', nowPx + (nowPx > W - 50 ? -10 : 10), 20)
    ctx.restore()
  }

  // ── User timeline events ──
  for (const ev of store.events) {
    const decYear = ev.year + (ev.month - 1) / 12 + (ev.day - 1) / 365.25
    const px = store.yearToPixel(decYear, W)
    if (px < -150 || px > W + 150) continue

    ctx.save()
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 3])
    ctx.beginPath()
    ctx.moveTo(px, lineY + 8)
    ctx.lineTo(px, lineY + 32)
    ctx.stroke()
    ctx.setLineDash([])

    // square marker on the axis
    ctx.fillStyle = '#cbd5e1'
    const s = 5
    ctx.fillRect(px - s / 2, lineY + 5, s, s)

    // name label below
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(ev.name, px, lineY + 46)
    ctx.restore()
  }

  // ── Selected date marker ──
  const selPx = store.yearToPixel(selectedDecimalYear, W)
  if (selPx > -4 && selPx < W + 4) {
    ctx.save()
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 3])
    ctx.beginPath(); ctx.moveTo(selPx, 8); ctx.lineTo(selPx, H - 8); ctx.stroke()
    ctx.setLineDash([])

    // diamond on the axis
    ctx.fillStyle = '#38bdf8'
    ctx.beginPath()
    ctx.moveTo(selPx, lineY - 8)
    ctx.lineTo(selPx + 5, lineY)
    ctx.lineTo(selPx, lineY + 8)
    ctx.lineTo(selPx - 5, lineY)
    ctx.closePath()
    ctx.fill()

    ctx.font = 'bold 11px sans-serif'
    ctx.fillStyle = '#38bdf8'
    ctx.textAlign = selPx > W - 80 ? 'right' : 'left'
    ctx.fillText(formatYear(selectedDecimalYear), selPx + (selPx > W - 80 ? -10 : 10), H - 14)
    ctx.restore()
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export const InfiniteTimeline = observer(() => {
  const root = useRootStore()
  const store = root.timeline
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // Track drag state + whether mouse moved (to distinguish click from pan)
  const drag = useRef<{ x: number; center: number; moved: boolean } | null>(null)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Access decimalYear here so MobX autorun tracks it
    const sel = root.astroChart.decimalYear
    draw(ctx, store, sel, canvas.width, canvas.height)
  }, [store, root])

  // resize → redraw
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      canvas.width = Math.round(width)
      canvas.height = Math.round(height)
      redraw()
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [redraw])

  // MobX → redraw
  useEffect(() => autorun(redraw), [redraw])

  // drag / click
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    drag.current = { x: e.clientX, center: store.viewCenterYear, moved: false }
  }, [store])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag.current || !canvasRef.current) return
    const dx = e.clientX - drag.current.x
    if (Math.abs(dx) > 4) drag.current.moved = true
    store.panTo(drag.current.center - dx * store.yearPerPx)
  }, [store])

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (drag.current && !drag.current.moved && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const px = e.clientX - rect.left
      const decYear = store.pixelToYear(px, canvasRef.current.width)
      const { year, month, day } = decimalYearToDate(decYear)
      root.astroChart.setYear(year)
      root.astroChart.setMonth(month)
      root.astroChart.setDay(day)
    }
    drag.current = null
  }, [store, root])

  const onMouseLeave = useCallback(() => { drag.current = null }, [])

  // scroll to zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const px = e.clientX - rect.left
    const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15
    store.zoomAt(factor, px, canvasRef.current.width)
  }, [store])

  return (
    <div
      ref={containerRef}
      className="h-full w-full relative overflow-hidden select-none cursor-crosshair"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onWheel={onWheel}
    >
      <canvas ref={canvasRef} className="block" />
      <span className="absolute bottom-2 right-3 text-[10px] text-slate-700 pointer-events-none">
        click to set date · drag to pan · scroll to zoom
      </span>
    </div>
  )
})
