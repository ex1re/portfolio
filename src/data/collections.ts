/** Stand-in for a photo, used until real files are added to the collection. */
export interface Placeholder {
  id: string
  color: string
  aspect: number
}

export interface Collection {
  slug: string
  /** The character the collection goes by. */
  title: string
  /** What it means, and nothing more — it sits under the character. */
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
    slug: 'people',
    title: '人',
    description: 'People',
    color: 'from-slate-700 to-neutral-900',
    placeholders: [
      { id: 'pe-1', color: 'from-slate-600 to-neutral-900', aspect: 0.75 },
      { id: 'pe-2', color: 'from-slate-700 to-neutral-900', aspect: 1.4 },
      { id: 'pe-3', color: 'from-zinc-700 to-neutral-900', aspect: 1 },
      { id: 'pe-4', color: 'from-slate-500 to-neutral-900', aspect: 0.66 },
      { id: 'pe-5', color: 'from-stone-700 to-neutral-900', aspect: 1.2 },
    ],
  },
  {
    slug: 'landscape',
    title: '景',
    description: 'Landscape',
    color: 'from-sky-900 to-neutral-900',
    placeholders: [
      { id: 'la-1', color: 'from-sky-800 to-neutral-900', aspect: 1.5 },
      { id: 'la-2', color: 'from-cyan-900 to-neutral-900', aspect: 1.3 },
      { id: 'la-3', color: 'from-blue-900 to-neutral-900', aspect: 1 },
      { id: 'la-4', color: 'from-teal-900 to-neutral-900', aspect: 1.6 },
      { id: 'la-5', color: 'from-sky-700 to-neutral-900', aspect: 0.75 },
    ],
  },
  {
    slug: 'constructions',
    title: '筑',
    description: 'Constructions',
    color: 'from-stone-600 to-neutral-900',
    placeholders: [
      { id: 'co-1', color: 'from-stone-500 to-neutral-900', aspect: 0.7 },
      { id: 'co-2', color: 'from-neutral-600 to-neutral-900', aspect: 1.4 },
      { id: 'co-3', color: 'from-stone-700 to-neutral-900', aspect: 1 },
      { id: 'co-4', color: 'from-zinc-600 to-neutral-900', aspect: 0.66 },
      { id: 'co-5', color: 'from-stone-800 to-neutral-900', aspect: 1.2 },
    ],
  },
  {
    slug: 'abstractions',
    title: '象',
    description: 'Abstractions',
    color: 'from-violet-900 to-neutral-900',
    placeholders: [
      { id: 'ab-1', color: 'from-violet-800 to-neutral-900', aspect: 1 },
      { id: 'ab-2', color: 'from-purple-900 to-neutral-900', aspect: 0.8 },
      { id: 'ab-3', color: 'from-indigo-900 to-neutral-900', aspect: 1.3 },
      { id: 'ab-4', color: 'from-fuchsia-900 to-neutral-900', aspect: 0.75 },
      { id: 'ab-5', color: 'from-violet-700 to-neutral-900', aspect: 1.5 },
    ],
  },
]
