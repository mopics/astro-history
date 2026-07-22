export type HoverInfo = { x: number; y: number; label: string; description: string }

export function TimelineHoverCard({ hover, canvasWidth }: { hover: HoverInfo | null; canvasWidth: number }) {
  if (!hover) return null
  return (
    <div
      className="absolute z-20 max-w-xs pointer-events-none rounded-md border border-slate-700/60 bg-slate-900/95 px-3 py-2 text-xs text-slate-200 shadow-lg backdrop-blur-sm"
      style={{
        left: Math.max(8, Math.min(hover.x + 14, canvasWidth - 288)),
        top: hover.y < 100 ? hover.y + 14 : hover.y - 14,
        transform: hover.y < 100 ? undefined : 'translateY(-100%)',
      }}
    >
      <div className="mb-1 font-semibold text-slate-100">{hover.label}</div>
      <div className="leading-snug text-slate-300">{hover.description}</div>
    </div>
  )
}
