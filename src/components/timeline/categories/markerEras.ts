export type MarkerEra = { year: number; label: string; color: string; priority: number; size: number, description?: string }

// Point-in-time cosmic/historical milestones drawn as markers on the
// timeline axis. Distinct from the TimeBand-based period categories in
// this same folder (e.g. `eras.ts`'s GEOLOGICAL_ERAS, which are bands).
export const MARKER_ERAS: MarkerEra[] = [
  { year: -13_800_000_000, label: 'BIG BANG', color: '#ff6b35', priority: 1, size: 13 },
  { year: -13_500_000_000, label: 'First Stars', color: '#ffd700', priority: 2, size: 11 },
  { year: -13_200_000_000, label: 'First Galaxies', color: '#a78bfa', priority: 2, size: 11 },
  { year: -4_600_000_000, label: 'Solar System', color: '#60a5fa', priority: 1, size: 12 },
  { year: -3_800_000_000, label: 'Life on Earth', color: '#4ade80', priority: 1, size: 12, description: `Het eerste leven op aarde, dat zo'n 3,8 tot 4 miljard jaar geleden ontstond, bestond uit microscopisch kleine, eencellige organismen. Deze oerbacteriën (prokaryoten) hadden geen celkern, dreven rond in de oceanen en leefden waarschijnlijk in de buurt van hete, onderwater-warmwaterbronnen.` },
  { year: -2_460_000_000, label: 'Great Oxidation Event', color: '#a78bfa', priority: 2, size: 11, description: `The Great Oxidation Event (GOE) or Great Oxygenation Event, also called the Oxygen Catastrophe, Oxygen Revolution, Oxygen Crisis, or Oxygen Holocaust,[2] was a time interval during the Earth's Paleoproterozoic era when the Earth's atmosphere and shallow seas first experienced a rise in the concentration of free oxygen.[3] This began approximately 2.46–2.426 billion years ago (Ga) during the Siderian period and ended around 2.06 billion years ago during the Rhyacian.[4] Geological, isotopic, and chemical evidence suggests that biologically produced molecular oxygen (dioxygen or O2) started to accumulate in the Archean prebiotic atmosphere by microbial photosynthesis. It changed the atmosphere from a weakly reducing state practically devoid of oxygen into an oxidizing one containing abundant free oxygen,[5] with oxygen levels being as high as 10% of the modern atmospheric level by the end of the GOE.` },
  { year: -2_000_000_000, label: 'Cells with Cores', color: '#4ade80', priority: 1, size: 12, description: `https://www.uu.nl/nieuws/tijdlijn-van-vroege-eukaryote-evolutie` },
  { year: -1_200_000_000, label: 'Development of Sexes', color: '#4ade80', priority: 2, size: 11, description: `Distinct biological sexes evolved over a billion years ago. The earliest evidence of sexual reproduction dates back to roughly \(1.2\) billion years ago with the appearance of Bangiomorpha pubescens, an ancient type of algae. This species utilized distinct male and female reproductive cells rather than cloning.` },
  { year: -541_000_000, label: 'Cambrian', color: '#86efac', priority: 2, size: 11 },
  { year: -252_000_000, label: 'Great Dying', color: '#f87171', priority: 2, size: 11 },
  { year: -66_000_000, label: 'K-Pg Extinction', color: '#fb923c', priority: 2, size: 11, description: `De Krijt-Paleogeengrens (ook wel Krijt-Tertiairgrens, afgekort K-Pg-grens of K-T-grens; in het Engels: K-T Boundary) is de overgang tussen de geologische tijdperken Krijt (K) en Paleogeen (Pg). In gesteenten is deze overgang terug te vinden als een dunne sedimentlaag, die verrijkt is met het zeldzame element iridium. Tijdens deze overgang vond een massa-extinctie plaats, waarbij veel soorten dieren en planten verdwenen. Deze gebeurtenis wordt de Krijt-Paleogeenmassa-extinctie (of Krijt-Tertiairmassa-extinctie) genoemd. Recente dateringen wijzen op een ouderdom van 65,95 miljoen jaar.[1]` },
  { year: -3_300_000, label: 'Hominids', color: '#d4a574', priority: 3, size: 10 },
  { year: -10_000, label: 'Agriculture', color: '#fbbf24', priority: 3, size: 10 },
  { year: -3_000, label: 'Bronze Age', color: '#e2b96a', priority: 4, size: 10 },
  { year: 0, label: 'Common Era', color: '#cbd5e1', priority: 3, size: 10 },
  { year: 1440, label: 'Printing Press', color: '#c4b5fd', priority: 4, size: 10 },
  { year: 1969, label: 'Moon Landing', color: '#a78bfa', priority: 4, size: 10 },
]
