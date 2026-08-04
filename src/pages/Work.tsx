import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import SiteFooter from '../components/SiteFooter'
import SelectionPhoto from '../components/SelectionPhoto'
import useMediaQuery from '../hooks/useMediaQuery'
import { projects } from '../data/projects'
import { collections } from '../data/collections'
import { collectionPhotos } from '../data/photos'

// How far a photo may be dragged from its resting spot, in px. Deliberately
// bounded per-photo (rather than to the container) so the pile keeps its
// edge-bleeding look while no photo can reach the header or the collections
// section below.
//
// The vertical range is smaller on phones: the surrounding gaps have to be at
// least this big to stay clear of the heading, and on a small screen a 75px
// reach would force more empty space than the layout can spare.
const DRAG_X = 40
const DRAG_X_COMPACT = 30
const DRAG_Y = 75
const DRAG_Y_COMPACT = 45

/** Below Tailwind's `sm`, i.e. phone widths. */
const COMPACT_QUERY = '(max-width: 639px)'

// Percent-based positions, deliberately irregular (not a grid): mixed sizes and
// a wide rotation range, with neighbours overlapping so the pile reads as a
// scattered stack rather than tidy rows.
//
// The span is inset from the container on every side. Rotation widens a photo's
// footprint, hovering scales it up, and dragging moves it further still — the
// margin absorbs all three so no photo is ever clipped by the edge of the
// screen. `top` stays >= 0 for the same reason at the heading.
//
// The widths follow each photo's own shape rather than the slot's: a portrait
// at a landscape's width stands nearly twice as tall, and towered over the pile.
// They're set from the ratio (width ∝ ratio^0.4), which leaves portraits a
// little the larger of the two by area but no longer dominant.
//
// The positions are searched rather than eyeballed — the rotated rectangles are
// stacked in the same order the page paints them and scored on how much of each
// one is left showing. Every photo here keeps at least half of itself in view,
// and the pile averages 69%. Moving one by hand is fine; just check it hasn't
// buried the photo underneath.
const layout = [
  { left: 50.2, top: 3.4, width: 23.6, rotate: -11 },
  { left: 3.2, top: 54.2, width: 29.7, rotate: 7 },
  { left: 18.1, top: 57.1, width: 31.5, rotate: -8 },
  { left: 38.1, top: 59.5, width: 30.0, rotate: 9 },
  { left: 64.7, top: 58.3, width: 32.3, rotate: -6 },
  { left: 3.5, top: 17.6, width: 30.6, rotate: 10 },
  { left: 32.5, top: 2.9, width: 23.5, rotate: -9 },
  { left: 74.4, top: 24.5, width: 21.9, rotate: 6 },
  { left: 15.5, top: 4.6, width: 31.5, rotate: -10 },
  { left: 66.9, top: 2.3, width: 30.2, rotate: 5 },
]

// A phone gets its own arrangement rather than the same one squeezed. Its frame
// is the width of the screen and can afford to be square, and the photos are
// half again as wide in it — at the shared widths they came out barely bigger
// than a thumbnail beside the collection covers below. Searched the same way,
// against a square frame: nothing here shows less than half of itself either.
const layoutCompact = [
  { left: 6.8, top: 51.0, width: 30.9, rotate: -11 },
  { left: 3.6, top: 32.1, width: 38.9, rotate: 7 },
  { left: 23.6, top: 66.7, width: 41.3, rotate: -8 },
  { left: 57.0, top: 19.3, width: 39.2, rotate: 9 },
  { left: 54.1, top: 69.0, width: 42.2, rotate: -6 },
  { left: 37.8, top: 42.6, width: 40.0, rotate: 10 },
  { left: 25.8, top: 2.3, width: 30.7, rotate: -9 },
  { left: 67.2, top: 42.3, width: 28.7, rotate: 6 },
  { left: 4.1, top: 4.5, width: 41.2, rotate: -10 },
  { left: 51.5, top: 1.7, width: 39.6, rotate: 5 },
]

export default function Work() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const compact = useMediaQuery(COMPACT_QUERY)
  const slots = compact ? layoutCompact : layout

  const dragConstraints = useMemo(() => {
    const x = compact ? DRAG_X_COMPACT : DRAG_X
    const y = compact ? DRAG_Y_COMPACT : DRAG_Y
    return { left: -x, right: x, top: -y, bottom: y }
  }, [compact])

  return (
    <PageTransition>
      {/* The space below the pile is clearance, not styling: a photo dragged
          downwards reaches 75px past its resting place on a desktop and 45 on a
          phone, and grows a little under the cursor. This leaves that room and
          a margin over it, rather than the half-screen it used to hold. */}
      <section className="px-6 pt-28 pb-16 sm:pt-44 sm:pb-20 lg:pb-28">
        <h1 className="mb-20 text-sm tracking-wide text-neutral-500 sm:mb-32">selections</h1>
        {/* The frame's shape is the pile's vertical spread: the positions are
            percentages, so a taller frame pulls the same photos apart. Square on
            a phone, where the photos are large and need the room; 16:9 once
            there's width to open out into.

            The cap is what sets the pile's size on a desktop — the photos are
            percentages of it, so widening the frame enlarges everything without
            changing how much they overlap. */}
        <div className="relative mx-auto aspect-square w-full max-w-5xl sm:aspect-[4/3] lg:aspect-[16/9] lg:max-w-6xl xl:max-w-7xl">
          {projects.map((project, i) => (
            <SelectionPhoto
              key={project.slug}
              project={project}
              placement={slots[i % slots.length]}
              index={i}
              isActive={activeIndex === i}
              onActivate={() => setActiveIndex(i)}
              constraints={dragConstraints}
            />
          ))}
        </div>
      </section>

      <section className="px-6 pt-4 pb-24">
        <h2 className="mb-10 text-sm tracking-wide text-neutral-500">collections</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection, i) => {
            const photos = collectionPhotos(collection)
            const cover = photos[0]
            return (
              <motion.div
                key={collection.slug}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
              >
                <Link to={`/garden/collections/${collection.slug}`} className="group block">
                  {/* Covers stay a uniform 4:3 so the grid reads evenly, which is
                      why this one frame crops its photo instead of following it. */}
                  <div
                    className={`relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-gradient-to-br ${collection.color} transition-transform duration-300 group-hover:scale-[1.02]`}
                  >
                    {cover?.src && (
                      <img
                        src={cover.src}
                        alt={`${collection.title} cover`}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="mt-3">
                    <h3 className="text-base text-neutral-100">{collection.title}</h3>
                    <p className="text-sm text-neutral-500">{photos.length} photos</p>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>

      <SiteFooter />
    </PageTransition>
  )
}
