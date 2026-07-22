import { useCallback, useEffect, useRef, useState } from 'react'
import { autorun } from 'mobx'
import { useRootStore } from '../../stores/StoreContext'
import { draw, type MarkerHit, type ChartFields } from './drawTimeline'
import { decimalYearToDate } from './yearFormat'
import type { HoverInfo } from './TimelineHoverCard'

type ChartFieldSetters = {
  setDay: (v: number) => void
  setMonth: (v: number) => void
  setYear: (v: number) => void
  setTime: (v: number) => void
  setLat: (v: number) => void
  setLon: (v: number) => void
}

export function applyChartFields(chart: ChartFieldSetters, fields: ChartFields) {
  if (fields.day   !== undefined) chart.setDay(fields.day)
  if (fields.month !== undefined) chart.setMonth(fields.month)
  if (fields.year  !== undefined) chart.setYear(fields.year)
  if (fields.time  !== undefined) chart.setTime(fields.time)
  if (fields.lat   !== undefined) chart.setLat(fields.lat)
  if (fields.lon   !== undefined) chart.setLon(fields.lon)
}

function findHit(hits: MarkerHit[], x: number, y: number): MarkerHit | undefined {
  return hits.find(h => Math.hypot(h.x - x, h.y - y) <= h.radius)
}

export function useTimelineCanvas() {
  const root = useRootStore()
  const store = root.timeline
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // Track drag state + whether mouse moved (to distinguish click from pan)
  const drag = useRef<{ x: number; center: number; moved: boolean } | null>(null)
  // Hoverable/clickable marker regions from the most recent draw
  const hitsRef = useRef<MarkerHit[]>([])
  const [hover, setHover] = useState<HoverInfo | null>(null)

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
    const hit = findHit(hitsRef.current, mx, my)
    setHover(hit && hit.description ? { x: mx, y: my, label: hit.label, description: hit.description } : null)
  }, [store])

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (drag.current && !drag.current.moved && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const px = e.clientX - rect.left
      const my = e.clientY - rect.top
      const hit = findHit(hitsRef.current, px, my)
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

  return {
    containerRef,
    canvasRef,
    hover,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onWheel,
  }
}
