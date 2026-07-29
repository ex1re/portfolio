export interface Project {
  slug: string
  title: string
  category: string
  year: number
  color: string
  aspect: number
}

export const projects: Project[] = [
  { slug: 'coastline', title: 'Coastline', category: 'Landscape', year: 2025, color: 'from-slate-700 to-slate-900', aspect: 1.4 },
  { slug: 'portraits-vol-2', title: 'Portraits Vol. 2', category: 'Portrait', year: 2025, color: 'from-rose-800 to-neutral-900', aspect: 0.75 },
  { slug: 'night-market', title: 'Night Market', category: 'Street', year: 2024, color: 'from-amber-800 to-neutral-900', aspect: 1 },
  { slug: 'quiet-rooms', title: 'Quiet Rooms', category: 'Interior', year: 2024, color: 'from-emerald-800 to-neutral-900', aspect: 0.8 },
  { slug: 'field-notes', title: 'Field Notes', category: 'Documentary', year: 2023, color: 'from-sky-800 to-neutral-900', aspect: 1.5 },
  { slug: 'monochrome', title: 'Monochrome', category: 'Studio', year: 2023, color: 'from-neutral-600 to-neutral-900', aspect: 0.66 },
  { slug: 'low-tide', title: 'Low Tide', category: 'Landscape', year: 2023, color: 'from-cyan-800 to-neutral-900', aspect: 1.2 },
  { slug: 'afterglow', title: 'Afterglow', category: 'Portrait', year: 2022, color: 'from-orange-800 to-neutral-900', aspect: 0.75 },
  { slug: 'passage', title: 'Passage', category: 'Documentary', year: 2022, color: 'from-indigo-800 to-neutral-900', aspect: 1 },
]
