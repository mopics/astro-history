import type { TimelineStore } from '../../stores/TimelineStore'
import { TIMELINE_CATEGORIES } from './categories'
import { MARKER_ERAS } from './categories/markerEras'
import { niceInterval, formatYear } from './yearFormat'

// A hoverable/clickable marker region, in canvas pixel space, for a
// hard-coded era or a user timeline event that has a description.
export type MarkerHit = { x: number; y: number; radius: number; label: string; description: string }

function drawPeriods(
  ctx: CanvasRenderingContext2D,
  store: TimelineStore,
  W: number,
  H: number,
) {
  for (const category of TIMELINE_CATEGORIES) {
    if (!store.visibleCategories[category.key]) continue
    const { style } = category
    const bands = category.getBands ? category.getBands(store.yearPerPx) : category.bands

    for (const band of bands) {
      const startPx = store.yearToPixel(band.start, W)
      const endPx = store.yearToPixel(band.end ?? store.nowYear, W)
      if (endPx < 0 || startPx > W) continue

      const x0 = Math.max(0, startPx)
      const x1 = Math.min(W, endPx)
      const bw = x1 - x0
      if (bw < 2) continue

      ctx.save()

      ctx.globalAlpha = style.alpha
      ctx.fillStyle = band.color
      ctx.fillRect(x0, 0, bw, H)

      if (startPx >= 0 && startPx <= W) {
        ctx.globalAlpha = style.alpha * 1.5
        ctx.strokeStyle = band.color
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
        ctx.globalAlpha = style.labelAlpha
        ctx.fillStyle = '#c8d8e8'
        ctx.font = `${style.fontSize}px ui-monospace, monospace`
        ctx.textAlign = 'center'
        ctx.fillText(band.label.toUpperCase(), lx, style.labelY)
      }

      ctx.restore()
    }
  }
}

export function draw(
  ctx: CanvasRenderingContext2D,
  store: TimelineStore,
  selectedDecimalYear: number,
  W: number,
  H: number,
): MarkerHit[] {
  const hits: MarkerHit[] = []

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

  for (const era of MARKER_ERAS) {
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

    if (era.description) {
      hits.push({ x: px, y: lineY - 2, radius: 10, label: era.label, description: era.description })
    }
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

    if (ev.description) {
      hits.push({ x: px, y: lineY + 7.5, radius: 9, label: ev.name, description: ev.description })
    }
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

  return hits
}
