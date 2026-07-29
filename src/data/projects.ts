export interface Project {
  slug: string
  title: string
  category: string
  year: number
  color: string
}

export const projects: Project[] = [
  { slug: 'coastline', title: 'Coastline', category: 'Landscape', year: 2025, color: 'from-slate-700 to-slate-900' },
  { slug: 'portraits-vol-2', title: 'Portraits Vol. 2', category: 'Portrait', year: 2025, color: 'from-rose-800 to-neutral-900' },
  { slug: 'night-market', title: 'Night Market', category: 'Street', year: 2024, color: 'from-amber-800 to-neutral-900' },
  { slug: 'quiet-rooms', title: 'Quiet Rooms', category: 'Interior', year: 2024, color: 'from-emerald-800 to-neutral-900' },
  { slug: 'field-notes', title: 'Field Notes', category: 'Documentary', year: 2023, color: 'from-sky-800 to-neutral-900' },
  { slug: 'monochrome', title: 'Monochrome', category: 'Studio', year: 2023, color: 'from-neutral-600 to-neutral-900' },
]
