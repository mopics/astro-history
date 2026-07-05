import { observer } from 'mobx-react-lite'
import { useTimelineStore } from '../../stores/StoreContext'
import { TIMELINE_CATEGORIES } from './categories'

export const ViewSelection = observer(function ViewSelection() {
  const store = useTimelineStore()

  return (
    <div
      className="absolute top-3 left-3 z-10 bg-slate-900/80 border border-slate-700/60 rounded-md px-3 py-2 backdrop-blur-sm pointer-events-auto"
      onMouseDown={e => e.stopPropagation()}
      onMouseUp={e => e.stopPropagation()}
    >
      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1.5">View</p>
      <ul className="flex flex-col gap-1">
        {TIMELINE_CATEGORIES.map(({ key, label }) => (
          <li key={key} className="flex items-center gap-1.5">
            <input
              id={`cat-${key}`}
              type="checkbox"
              checked={store.visibleCategories[key]}
              onChange={() => store.toggleCategory(key)}
              className="accent-slate-400 w-3 h-3 cursor-pointer"
            />
            <label
              htmlFor={`cat-${key}`}
              className="text-[10px] text-slate-400 cursor-pointer select-none"
            >
              {label}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
})
