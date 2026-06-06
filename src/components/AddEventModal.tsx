import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'

type Props = {
  initialDay: number
  initialMonth: number
  initialYear: number
  initialTime: number
  initialLat: number
  initialLon: number
  onClose: () => void
  onSaved: () => void
}

type FormState = {
  name: string
  description: string
  tags: string
  day: number
  month: number
  year: number
  time: number
  lat: number
  lon: number
}

export function AddEventModal({
  initialDay, initialMonth, initialYear, initialTime, initialLat, initialLon, onClose, onSaved,
}: Props) {
  const [form, setForm] = useState<FormState>({
    name: '', description: '', tags: '',
    day: initialDay, month: initialMonth, year: initialYear,
    time: initialTime, lat: initialLat, lon: initialLon,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setStr = (field: keyof FormState, value: string) =>
    setForm(f => ({ ...f, [field]: value }))
  const setNum = (field: keyof FormState, value: number) =>
    setForm(f => ({ ...f, [field]: value }))

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('http://localhost:3002/api/createTimelineEvent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: crypto.randomUUID(),
          name: form.name.trim(),
          description: form.description,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          day: form.day, month: form.month, year: form.year,
          time: form.time, lat: form.lat, lon: form.lon,
        }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to save'); setLoading(false); return }
      onSaved()
      onClose()
    } catch {
      setError('Server unreachable')
      setLoading(false)
    }
  }

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onBackdrop}
    >
      <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md mx-4 flex flex-col gap-4 p-6">
        <h2 className="text-base font-semibold">Add Event</h2>

        {/* ── Main fields ── */}
        <div className="flex flex-col gap-3">
          <Field label="Name *">
            <input
              type="text"
              value={form.name}
              onChange={e => setStr('name', e.target.value)}
              placeholder="Event name"
              autoFocus
              className={inputCls}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={e => setStr('description', e.target.value)}
              rows={3}
              placeholder="Optional description"
              className={cn(inputCls, 'resize-none')}
            />
          </Field>

          <Field label="Tags">
            <input
              type="text"
              value={form.tags}
              onChange={e => setStr('tags', e.target.value)}
              placeholder="astronomy, history, …  (comma-separated)"
              className={inputCls}
            />
          </Field>
        </div>

        {/* ── Date & location ── */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Date & Location</p>
          <div className="flex flex-wrap gap-2">
            <NumField label="Day"    value={form.day}   min={1}     max={31}    onChange={v => setNum('day', v)} />
            <NumField label="Month"  value={form.month} min={1}     max={12}    onChange={v => setNum('month', v)} />
            <NumField label="Year"   value={form.year}  min={-9999} max={9999}  onChange={v => setNum('year', v)} />
            <NumField label="Time h" value={form.time}  min={0}     max={23.99} step={0.5}  onChange={v => setNum('time', v)} />
            <NumField label="Lat °"  value={form.lat}   min={-90}   max={90}    step={0.01} onChange={v => setNum('lat', v)} />
            <NumField label="Lon °"  value={form.lon}   min={-180}  max={180}   step={0.01} onChange={v => setNum('lon', v)} />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* ── Actions ── */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            disabled={loading}
            className={cn(buttonCls, 'bg-secondary text-secondary-foreground hover:bg-secondary/80')}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={loading}
            className={cn(buttonCls, 'bg-primary text-primary-foreground hover:bg-primary/90')}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputCls = cn(
  'w-full px-2 py-1.5 rounded bg-input border border-border text-sm',
  'focus:outline-none focus:ring-1 focus:ring-ring',
)

const buttonCls = 'flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

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
        className={cn(inputCls, 'w-20')}
      />
    </label>
  )
}
