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
   * Filename inside public/photos/selections, e.g. `benevolence.jpg`. Once set,
   * the frame takes the file's real dimensions instead of `aspect`.
   */
  image?: string
  /**
   * How the frame was taken, shown in one line above the photo on its own page.
   * Written as they'd be spoken: `400`, `2.8`, `1/250` (or `2s` for a long one).
   * The em dashes are placeholders — replace them; leave one out and it simply
   * isn't shown.
   */
  iso?: string
  aperture?: string
  shutter?: string
}

export const projects: Project[] = [
  { slug: 'benevolence', title: 'Benevolence', category: 'Portrait', year: 2024, iso: '—', aperture: '—', shutter: '—', color: 'from-slate-700 to-slate-900', aspect: 1.4, image: '8E928D42-8342-4262-8DFB-449EED535384.jpeg' },
  { slug: 'purgatory', title: 'Purgatory', category: 'Architecture', year: 2023, iso: '—', aperture: '—', shutter: '—', color: 'from-rose-800 to-neutral-900', aspect: 0.75, image: 'DD9AD218-A8B8-452B-837B-501B2B36D410.jpg' },
  { slug: 'transience', title: 'Transience', category: 'Street', year: 2024, iso: '—', aperture: '—', shutter: '—', color: 'from-amber-800 to-neutral-900', aspect: 1, image: 'DSCF0547.JPG' },
  { slug: 'interval', title: 'Interval', category: 'Street', year: 2025, iso: '—', aperture: '—', shutter: '—', color: 'from-stone-700 to-neutral-900', aspect: 1.5, image: 'DSCF0687.JPG' },
  { slug: 'synths', title: 'Synths', category: 'Architecture', year: 2024, iso: '—', aperture: '—', shutter: '—', color: 'from-emerald-800 to-neutral-900', aspect: 0.8, image: 'DSCF0952.JPG' },
  { slug: 'untitled1', title: 'Untitled', category: 'Street', year: 2025, iso: '—', aperture: '—', shutter: '—', color: 'from-sky-800 to-neutral-900', aspect: 1.5, image: 'DSCF1426.JPG' },
  { slug: 'untitled2', title: 'Untitled', category: 'Street', year: 2025, iso: '—', aperture: '—', shutter: '—', color: 'from-neutral-600 to-neutral-900', aspect: 0.66, image: 'DSCF1453.JPG' },
  { slug: 'untitled3', title: 'Untitled', category: 'Street', year: 2025, iso: '—', aperture: '—', shutter: '—', color: 'from-cyan-800 to-neutral-900', aspect: 1.2, image: 'DSCF1539.JPG' },
  { slug: 'arabesque', title: 'Arabesque', category: 'Street', year: 2025, iso: '—', aperture: '—', shutter: '—', color: 'from-orange-800 to-neutral-900', aspect: 0.75, image: 'DSCF1709.JPG' },
  { slug: 'mothership', title: 'Mothership', category: 'Architecture', year: 2023, iso: '—', aperture: '—', shutter: '—', color: 'from-indigo-800 to-neutral-900', aspect: 1, image: 'IMG_6579.jpg' },
]
