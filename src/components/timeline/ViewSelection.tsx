import { useState } from 'react'
import { ALL_TAGS } from './periods'

export function ViewSelection() {
  const [checked, setChecked] = useState<Record<string, boolean>>(
    () => Object.fromEntries(ALL_TAGS.map(t => [t, true]))
  )

  const toggle = (tag: string) =>
    setChecked(prev => ({ ...prev, [tag]: !prev[tag] }))

  return (
    <div
      className="absolute top-3 left-3 z-10 bg-slate-900/80 border border-slate-700/60 rounded-md px-3 py-2 backdrop-blur-sm pointer-events-auto"
      onMouseDown={e => e.stopPropagation()}
      onMouseUp={e => e.stopPropagation()}
    >
      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1.5">View</p>
      <ul className="flex flex-col gap-1">
        {ALL_TAGS.map(tag => (
          <li key={tag} className="flex items-center gap-1.5">
            <input
              id={`tag-${tag}`}
              type="checkbox"
              checked={checked[tag]}
              onChange={() => toggle(tag)}
              className="accent-slate-400 w-3 h-3 cursor-pointer"
            />
            <label
              htmlFor={`tag-${tag}`}
              className="text-[10px] text-slate-400 capitalize cursor-pointer select-none"
            >
              {tag}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
