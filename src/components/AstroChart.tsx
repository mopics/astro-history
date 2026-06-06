import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Loader2 } from 'lucide-react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useAstroChartStore, useRootStore } from '../stores/StoreContext'
import { AstroWheel } from './AstroWheel'
import { AddEventModal } from './AddEventModal'
import { cn } from '../lib/utils'

export const AstroChart = observer(() => {
  const root  = useRootStore()
  const store = useAstroChartStore()
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Controls ── */}
      <div className="shrink-0 flex flex-wrap gap-3 items-end px-4 pt-3 pb-2">
        <NumField label="Day"    value={store.day}   min={1}     max={31}    onChange={v => store.setDay(v)} />
        <NumField label="Month"  value={store.month} min={1}     max={12}    onChange={v => store.setMonth(v)} />
        <NumField label="Year"   value={store.year}  min={-9999} max={9999}  onChange={v => store.setYear(v)} />
        <NumField label="Time h" value={store.time}  min={0}     max={23.99} step={0.5}  onChange={v => store.setTime(v)} />
        <NumField label="Lat °"  value={store.lat}   min={-90}   max={90}    step={0.01} onChange={v => store.setLat(v)} />
        <NumField label="Lon °"  value={store.lon}   min={-180}  max={180}   step={0.01} onChange={v => store.setLon(v)} />
        {store.loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground self-center" />}
        <button
          onClick={() => setShowModal(true)}
          className="ml-auto self-end px-3 py-1 rounded text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          Add Event
        </button>
      </div>

      {showModal && (
        <AddEventModal
          initialDay={store.day}
          initialMonth={store.month}
          initialYear={store.year}
          initialTime={store.time}
          initialLat={store.lat}
          initialLon={store.lon}
          onClose={() => setShowModal(false)}
          onSaved={() => void root.timeline.fetchEvents()}
        />
      )}

      {store.error && (
        <p className="shrink-0 px-4 pb-1 text-destructive text-sm">{store.error}</p>
      )}

      {/* ── Data area ── */}
      {store.bodies.length > 0 ? (
        <PanelGroup direction="horizontal" className="flex-1 min-h-0">
          <Panel defaultSize={42} minSize={25} className="overflow-auto">
            <table className="w-full text-sm px-4">
              <thead className="sticky top-0 bg-background">
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-1 pl-4 pr-4 font-medium">Body</th>
                  <th className="text-left py-1 pr-4 font-medium">Sign</th>
                  <th className="text-right py-1 pr-4 font-medium">Sign °</th>
                  <th className="text-right py-1 pr-4 font-medium">Lon</th>
                  <th className="text-center py-1 pr-2 font-medium">℞</th>
                </tr>
              </thead>
              <tbody>
                {store.bodies.map(body => (
                  <tr key={body.name} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                    <td className="py-1.5 pl-4 pr-4 font-medium">{body.name}</td>
                    <td className="py-1.5 pr-4 text-accent-foreground">{body.sign}</td>
                    <td className="py-1.5 pr-4 text-right tabular-nums">{body.signDegree.toFixed(2)}°</td>
                    <td className="py-1.5 pr-4 text-right tabular-nums text-muted-foreground">{body.longitude.toFixed(2)}°</td>
                    <td className="py-1.5 pr-2 text-center">
                      {body.retrograde
                        ? <span className="text-amber-400">℞</span>
                        : <span className="text-muted-foreground/30">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <PanelResizeHandle className="w-[3px] bg-border hover:bg-primary/40 transition-colors cursor-col-resize" />

          <Panel defaultSize={58} minSize={25} className="overflow-hidden">
            <AstroWheel bodies={store.bodies} />
          </Panel>
        </PanelGroup>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          {!store.loading && !store.error && 'Waiting for server…'}
        </div>
      )}
    </div>
  )
})

function NumField({
  label, value, min, max, step = 1, onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        className={cn(
          'w-20 px-2 py-1 rounded bg-input border border-border text-sm',
          'focus:outline-none focus:ring-1 focus:ring-ring',
        )}
      />
    </label>
  )
}
