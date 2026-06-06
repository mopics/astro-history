import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { StoreProvider } from './stores/StoreContext'
import { AstroChart } from './components/AstroChart'
import { InfiniteTimeline } from './components/InfiniteTimeline'

export default function App() {
  return (
    <StoreProvider>
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
        <header className="shrink-0 px-4 py-2 border-b border-border flex items-center gap-3">
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Astro History
          </span>
        </header>

        <div className="flex-1 overflow-hidden">
          <PanelGroup direction="vertical" className="h-full">
            <Panel defaultSize={45} minSize={20}>
              <AstroChart />
            </Panel>

            <PanelResizeHandle className="h-[3px] bg-border hover:bg-primary/40 transition-colors cursor-row-resize" />

            <Panel defaultSize={55} minSize={20}>
              <InfiniteTimeline />
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </StoreProvider>
  )
}
