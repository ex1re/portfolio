/** Stand-in for a photo, used until real files are added to the collection. */
export interface Placeholder {
  id: string
  color: string
  aspect: number
}

export interface Collection {
  slug: string
  title: string
  description: string
  color: string
  /**
   * Shown only while public/photos/collections/<slug>/ is empty. Once files are
   * added they replace these entirely, and their gradients become load-time
   * backdrops for the real photos.
   */
  placeholders: Placeholder[]
}

export const collections: Collection[] = [
  {
    slug: 'coastal-mornings',
    title: 'Coastal Mornings',
    description: 'Light along the shoreline before the world wakes up.',
    color: 'from-slate-700 to-slate-900',
    placeholders: [
      { id: 'cm-1', color: 'from-slate-600 to-slate-900', aspect: 0.75 },
      { id: 'cm-2', color: 'from-slate-700 to-neutral-900', aspect: 1.4 },
      { id: 'cm-3', color: 'from-blue-800 to-slate-900', aspect: 1 },
      { id: 'cm-4', color: 'from-slate-500 to-slate-900', aspect: 0.66 },
      { id: 'cm-5', color: 'from-cyan-800 to-slate-900', aspect: 1.2 },
      { id: 'cm-6', color: 'from-slate-600 to-neutral-900', aspect: 0.8 },
      { id: 'cm-7', color: 'from-sky-900 to-slate-900', aspect: 1.1 },
    ],
  },
  {
    slug: 'strangers',
    title: 'Strangers',
    description: 'Portraits of people met once, in passing.',
    color: 'from-rose-800 to-neutral-900',
    placeholders: [
      { id: 'st-1', color: 'from-rose-700 to-neutral-900', aspect: 0.75 },
      { id: 'st-2', color: 'from-rose-800 to-neutral-900', aspect: 0.8 },
      { id: 'st-3', color: 'from-pink-800 to-neutral-900', aspect: 0.7 },
      { id: 'st-4', color: 'from-rose-600 to-neutral-900', aspect: 1 },
      { id: 'st-5', color: 'from-red-900 to-neutral-900', aspect: 0.75 },
    ],
  },
  {
    slug: 'after-hours',
    title: 'After Hours',
    description: 'The city once the shops close and the neon stays on.',
    color: 'from-amber-800 to-neutral-900',
    placeholders: [
      { id: 'ah-1', color: 'from-amber-700 to-neutral-900', aspect: 1.3 },
      { id: 'ah-2', color: 'from-amber-800 to-neutral-900', aspect: 0.75 },
      { id: 'ah-3', color: 'from-orange-800 to-neutral-900', aspect: 1 },
      { id: 'ah-4', color: 'from-yellow-800 to-neutral-900', aspect: 1.5 },
      { id: 'ah-5', color: 'from-amber-600 to-neutral-900', aspect: 0.8 },
      { id: 'ah-6', color: 'from-amber-900 to-neutral-900', aspect: 1.1 },
      { id: 'ah-7', color: 'from-orange-700 to-neutral-900', aspect: 0.66 },
    ],
  },
]
