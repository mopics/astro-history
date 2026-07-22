import { observer } from 'mobx-react-lite'
import { ViewSelection } from './timeline/ViewSelection'
import { ZoomRangeControl } from './timeline/ZoomRangeControl'
import { TimelineHoverCard } from './timeline/TimelineHoverCard'
import { useTimelineCanvas } from './timeline/useTimelineCanvas'

export const InfiniteTimeline = observer(() => {
  const {
    containerRef, canvasRef, hover,
    onMouseDown, onMouseMove, onMouseUp, onMouseLeave, onWheel,
  } = useTimelineCanvas()

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
      <TimelineHoverCard hover={hover} canvasWidth={canvasRef.current?.width ?? 9999} />
      <span className="absolute bottom-2 right-3 text-[10px] text-slate-700 pointer-events-none">
        click marker to load info · click empty space to set date · drag to pan · scroll to zoom
      </span>
    </div>
  )
})
