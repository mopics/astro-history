export type TimeBand = {
  start: number
  end: number | null
  label: string
  color: string
}

export type BandStyle = {
  alpha: number       // fill alpha for the band rectangle
  labelAlpha: number  // alpha for the band's label text
  labelY: number      // label's vertical offset from the top of the canvas
  fontSize: number    // label font size, in px
}
