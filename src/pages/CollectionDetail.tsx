import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import SiteFooter from '../components/SiteFooter'
import Lightbox from '../components/Lightbox'
import PhotoImage from '../components/PhotoImage'
import useMediaQuery from '../hooks/useMediaQuery'
import { collections } from '../data/collections'
import { collectionPhotos } from '../data/photos'

/** Matches the `sm` breakpoint, where the third column appears. */
const WIDE_QUERY = '(min-width: 40rem)'

export default function CollectionDetail() {
  const { slug } = useParams()
  const collection = collections.find((c) => c.slug === slug)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  // Memoised so the packing below has a stable input: rebuilding this array on
  // every render would have the columns repacked on every render too.
  const photos = useMemo(() => (collection ? collectionPhotos(collection) : []), [collection])
  const columnCount = useMediaQuery(WIDE_QUERY) ? 3 : 2

  /**
   * The columns are packed here rather than by CSS.
   *
   * `columns-3` fills strictly in document order and cannot reorder, so it
   * chooses a height, pours photographs into the first column until the next
   * one won't fit, then the second — and the third column gets whatever is
   * left. With tall photographs that can't be split, the leftovers ran out
   * well before the bottom: two full columns and a third empty for most of
   * the page. Balancing that needs the freedom to put a photograph in a
   * different column than the order implies, which multicol will never do.
   *
   * Each photograph goes to whichever column is currently shortest. Heights
   * are known before anything loads — the columns are equal width, so a
   * photograph's height is just its width over its ratio — which means this
   * settles on the first render and doesn't reshuffle as files arrive.
   *
   * The index carried alongside is the photograph's place in `photos`, not in
   * its column: the lightbox pages through the original order, so that is what
   * has to be handed to it.
   */
  const columns = useMemo(() => {
    const packed = Array.from({ length: columnCount }, () => ({
      height: 0,
      items: [] as { photo: (typeof photos)[number]; index: number }[],
    }))
    photos.forEach((photo, index) => {
      const shortest = packed.reduce((a, b) => (b.height < a.height ? b : a))
      shortest.items.push({ photo, index })
      // In units of the column's own width, so no pixel measuring is needed.
      shortest.height += 1 / (photo.aspect || 1)
    })
    return packed
  }, [photos, columnCount])

  if (!collection) {
    return (
      <PageTransition>
        <section className="flex min-h-screen flex-col items-start justify-center px-6">
          <p className="text-neutral-400">Collection not found.</p>
          <Link to="/garden" className="mt-4 text-sm text-neutral-100 underline">
            Back
          </Link>
        </section>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <section className="min-h-screen px-6 pt-32 pb-20">
        <Link to="/garden" className="text-sm text-neutral-500 hover:text-neutral-200">
          ← Back
        </Link>
        <h1 className="mt-6 text-4xl font-semibold text-neutral-100">{collection.title}</h1>
        <p className="mt-2 max-w-xl text-neutral-400">{collection.description}</p>

        {/* `items-start` so a short column stays its own height rather than
            stretching to match the tallest one. */}
        <div className="mt-10 flex items-start gap-4">
          {columns.map((column, c) => (
            <div key={c} className="flex min-w-0 flex-1 flex-col gap-4">
              {column.items.map(({ photo, index }) => (
                <motion.button
                  key={photo.id}
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
                  aria-label={`Open ${photo.alt}`}
                  className="block w-full transition-transform duration-300 hover:scale-[1.02]"
                >
                  <PhotoImage
                    photo={photo}
                    loading={index < 6 ? 'eager' : 'lazy'}
                    className="rounded-sm"
                  />
                </motion.button>
              ))}
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />

      {/* Always mounted, and told which photograph to show — null for none.
          Removing it on close took its exit animation with it, and the
          lightbox vanished instead of fading. */}
      <Lightbox
        photos={photos}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </PageTransition>
  )
}
