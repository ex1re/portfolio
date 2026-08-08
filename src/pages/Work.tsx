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
            changing how much they overlap. That is why the monitor sizes are
            added here and nowhere else in the pile: the searched arrangement
            is in percentages and the shape is unchanged, so the whole thing
            scales up exactly as composed, with every overlap as it was.

            Above xl the cap stopped at 80rem, so on a 2560px screen the pile
            sat at half the width available to it and every photograph in it
            was half the size it could have been.

            104rem at 4xl rather than more: the collections below run the full
            width of the page, and their cards land near 600px there. The pile
            is held where its largest photograph stays under that, so the two
            sections keep their order — the collections are the doors into the
            work and read as the larger of the two. */}
        <div className="relative mx-auto aspect-square w-full max-w-5xl sm:aspect-[4/3] lg:aspect-[16/9] lg:max-w-6xl xl:max-w-7xl 3xl:max-w-[96rem] 4xl:max-w-[104rem]">
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
        {/* One column, then two. Three would strand the fourth on a row of its
            own, so two even rows it is — until there's room for all four side
            by side, which is the other arrangement that comes out even.

            That row is deliberately uncapped, so on a monitor it runs the width
            of the page while the pile above stays held to its frame. The two
            sections are doing different jobs: the pile is a composition, and
            fixing its width is what keeps the arrangement as it was searched,
            whereas these are doors into the work and should be the largest
            things on the page. Below 3xl it is two columns and unchanged.

            Four across waits for 4xl rather than starting at 3xl. At 1920 the
            page is only wide enough for four if each is cut to about 440px,
            which is smaller than the photographs in the pile above — the wrong
            way round. Two columns there are larger still.

            The gutter opens up with them — 24px between cards over 600px wide
            reads as a crack rather than a space. */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 4xl:grid-cols-4 4xl:gap-x-8">
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
                  {/* The character carries the collection, so it's set large
                      and centred under its cover; the translation sits beneath
                      it in the quiet grey the rest of the page uses for a
                      second line. */}
                  <div className="mt-4 text-center">
                    <h3 className="text-3xl font-semibold text-neutral-100">{collection.title}</h3>
                    <p className="mt-1 text-sm text-neutral-500">{collection.description}</p>
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
