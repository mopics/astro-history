import { AstroChartStore } from './AstroChartStore'
import { TimelineStore } from './TimelineStore'

export class RootStore {
  astroChart: AstroChartStore
  timeline: TimelineStore

  constructor() {
    this.astroChart = new AstroChartStore(this)
    this.timeline = new TimelineStore(this)
  }
}
