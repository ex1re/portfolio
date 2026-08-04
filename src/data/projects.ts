export interface Project {
  slug: string
  title: string
  category: string
  year: number
  /** Gradient placeholder, also shown behind the photo while it loads. */
  color: string
  /** Fallback frame shape (width / height) used until `image` is added. */
  aspect: number
  /**
   * Filename inside public/photos/selections, e.g. `coastline.jpg`. Once set,
   * the frame takes the file's real dimensions instead of `aspect`.
   */
  image?: string
}

export const projects: Project[] = [
  { slug: 'coastline', title: 'Coastline', category: 'Landscape', year: 2025, color: 'from-slate-700 to-slate-900', aspect: 1.4, image: '8E928D42-8342-4262-8DFB-449EED535384.jpeg' },
  { slug: 'portraits-vol-2', title: 'Portraits Vol. 2', category: 'Portrait', year: 2025, color: 'from-rose-800 to-neutral-900', aspect: 0.75, image: 'DD9AD218-A8B8-452B-837B-501B2B36D410.jpg' },
  { slug: 'night-market', title: 'Night Market', category: 'Street', year: 2024, color: 'from-amber-800 to-neutral-900', aspect: 1, image: 'DSCF0547.JPG' },
  { slug: 'quiet-rooms', title: 'Quiet Rooms', category: 'Interior', year: 2024, color: 'from-emerald-800 to-neutral-900', aspect: 0.8, image: 'DSCF0952.JPG' },
  { slug: 'field-notes', title: 'Field Notes', category: 'Documentary', year: 2023, color: 'from-sky-800 to-neutral-900', aspect: 1.5, image: 'DSCF1426.JPG' },
  { slug: 'monochrome', title: 'Monochrome', category: 'Studio', year: 2023, color: 'from-neutral-600 to-neutral-900', aspect: 0.66, image: 'DSCF1453.JPG' },
  { slug: 'low-tide', title: 'Low Tide', category: 'Landscape', year: 2023, color: 'from-cyan-800 to-neutral-900', aspect: 1.2, image: 'DSCF1539.JPG' },
  { slug: 'afterglow', title: 'Afterglow', category: 'Portrait', year: 2022, color: 'from-orange-800 to-neutral-900', aspect: 0.75, image: 'DSCF1709.JPG' },
  { slug: 'passage', title: 'Passage', category: 'Documentary', year: 2022, color: 'from-indigo-800 to-neutral-900', aspect: 1, image: 'IMG_6579.jpg' },
]
