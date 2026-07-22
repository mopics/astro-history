import { useEffect, useRef, useCallback, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { autorun } from 'mobx'
import { useRootStore } from '../stores/StoreContext'
import { ViewSelection } from './timeline/ViewSelection'
import { ZoomRangeControl } from './timeline/ZoomRangeControl'
import { draw, type MarkerHit } from './timeline/drawTimeline'
import { decimalYearToDate } from './timeline/yearFormat'

// ── Component ────────────────────────────────────────────────────────────────

export const InfiniteTimeline = observer(() => {
  const root = useRootStore()
  const store = root.timeline
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // Track drag state + whether mouse moved (to distinguish click from pan)
  const drag = useRef<{ x: number; center: number; moved: boolean } | null>(null)
  // Hoverable/clickable marker regions from the most recent draw
  const hitsRef = useRef<MarkerHit[]>([])
  const [hover, setHover] = useState<{ x: number; y: number; label: string; description: string } | null>(null)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Access decimalYear here so MobX autorun tracks it
    const sel = root.astroChart.decimalYear
    hitsRef.current = draw(ctx, store, sel, canvas.width, canvas.height)
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
      store.setCanvasWidth(canvas.width)
      redraw()
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [redraw, store])

  // MobX → redraw
  useEffect(() => autorun(redraw), [redraw])

  // drag / click
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    drag.current = { x: e.clientX, center: store.viewCenterYear, moved: false }
  }, [store])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return
    if (drag.current) {
      const dx = e.clientX - drag.current.x
      if (Math.abs(dx) > 4) drag.current.moved = true
      store.panTo(drag.current.center - dx * store.yearPerPx)
      setHover(null)
      return
    }

    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const hit = hitsRef.current.find(h => Math.hypot(h.x - mx, h.y - my) <= h.radius)
    setHover(hit ? { x: mx, y: my, label: hit.label, description: hit.description } : null)
  }, [store])

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (drag.current && !drag.current.moved && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const px = e.clientX - rect.left
      const my = e.clientY - rect.top
      const hit = hitsRef.current.find(h => Math.hypot(h.x - px, h.y - my) <= h.radius)
      if (hit) {
        setHover({ x: px, y: my, label: hit.label, description: hit.description })
      } else {
        const decYear = store.pixelToYear(px, canvasRef.current.width)
        const { year, month, day } = decimalYearToDate(decYear)
        root.astroChart.setYear(year)
        root.astroChart.setMonth(month)
        root.astroChart.setDay(day)
      }
    }
    drag.current = null
  }, [store, root])

  const onMouseLeave = useCallback(() => { drag.current = null; setHover(null) }, [])

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
      className={`h-full w-full relative overflow-hidden select-none ${hover ? 'cursor-help' : 'cursor-crosshair'}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onWheel={onWheel}
    >
      <canvas ref={canvasRef} className="block" />
      <ViewSelection />
      <ZoomRangeControl />
      {hover && (
        <div
          className="absolute z-20 max-w-xs pointer-events-none rounded-md border border-slate-700/60 bg-slate-900/95 px-3 py-2 text-xs text-slate-200 shadow-lg backdrop-blur-sm"
          style={{
            left: Math.max(8, Math.min(hover.x + 14, (canvasRef.current?.width ?? 9999) - 288)),
            top: hover.y < 100 ? hover.y + 14 : hover.y - 14,
            transform: hover.y < 100 ? undefined : 'translateY(-100%)',
          }}
        >
          <div className="mb-1 font-semibold text-slate-100">{hover.label}</div>
          <div className="leading-snug text-slate-300">{hover.description}</div>
        </div>
      )}
      <span className="absolute bottom-2 right-3 text-[10px] text-slate-700 pointer-events-none">
        click to set date · drag to pan · scroll to zoom
      </span>
    </div>
  )
})
