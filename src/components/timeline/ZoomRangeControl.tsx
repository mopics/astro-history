import { useState } from 'react'
import { useTimelineStore } from '../../stores/StoreContext'

type Unit = 'Bya' | 'Mya' | 'Kya' | 'year'

const UNITS: Unit[] = ['Bya', 'Mya', 'Kya', 'year']

const UNIT_MULTIPLIER: Record<Unit, number> = {
  Bya: 1_000_000_000,
  Mya: 1_000_000,
  Kya: 1_000,
  year: 1,
}

// Sign is explicit and uniform across units: negative = past, positive =
// future, e.g. -3 Bya = -3_000_000_000, matching the internal year axis.
function toInternalYear(value: number, unit: Unit): number {
  return value * UNIT_MULTIPLIER[unit]
}

function YearField({
  label, value, unit, onValueChange, onUnitChange,
}: {
  label: string
  value: string
  unit: Unit
  onValueChange: (v: string) => void
  onUnitChange: (u: Unit) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <label className="w-8 text-[10px] text-slate-500">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onValueChange(e.target.value)}
        className="w-20 rounded border border-slate-700/60 bg-slate-800/80 px-1.5 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-slate-500"
      />
      <select
        value={unit}
        onChange={e => onUnitChange(e.target.value as Unit)}
        className="rounded border border-slate-700/60 bg-slate-800/80 px-1 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-slate-500"
      >
        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
      </select>
    </div>
  )
}

export function ZoomRangeControl() {
  const store = useTimelineStore()
  const [startValue, setStartValue] = useState('-13.8')
  const [startUnit, setStartUnit] = useState<Unit>('Bya')
  const [endValue, setEndValue] = useState(String(new Date().getFullYear()))
  const [endUnit, setEndUnit] = useState<Unit>('year')

  const handleZoom = () => {
    const startNum = parseFloat(startValue)
    const endNum = parseFloat(endValue)
    if (Number.isNaN(startNum) || Number.isNaN(endNum)) return
    store.zoomToRange(toInternalYear(startNum, startUnit), toInternalYear(endNum, endUnit))
  }

  return (
    <div
      className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 rounded-md border border-slate-700/60 bg-slate-900/80 px-3 py-2 backdrop-blur-sm pointer-events-auto"
      onMouseDown={e => e.stopPropagation()}
      onMouseUp={e => e.stopPropagation()}
    >
      <p className="text-[9px] uppercase tracking-widest text-slate-500">Zoom to range</p>
      <YearField label="Start" value={startValue} unit={startUnit} onValueChange={setStartValue} onUnitChange={setStartUnit} />
      <YearField label="End" value={endValue} unit={endUnit} onValueChange={setEndValue} onUnitChange={setEndUnit} />
      <button
        onClick={handleZoom}
        className="mt-0.5 rounded border border-slate-600/60 bg-slate-700/60 px-2 py-1 text-[10px] font-medium text-slate-200 hover:bg-slate-600/60"
      >
        Zoom
      </button>
    </div>
  )
}
