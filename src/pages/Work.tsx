import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import SelectionPhoto from '../components/SelectionPhoto'
import { projects } from '../data/projects'
import { collections } from '../data/collections'
import { collectionPhotos } from '../data/photos'

// How far a photo may be dragged from its resting spot, in px. Deliberately
// bounded per-photo (rather than to the container) so the pile keeps its
// edge-bleeding look while no photo can reach the header or the collections
// section below.
const DRAG_X = 90
const DRAG_Y = 75

const dragConstraints = { left: -DRAG_X, right: DRAG_X, top: -DRAG_Y, bottom: DRAG_Y }

// Percent-based positions, deliberately irregular (not a grid): mixed sizes,
// wide rotation range, and edges that bleed past the frame so the pile reads
// as a genuine scattered stack rather than tidy rows.
//
// Photos bleed sideways on purpose, but `top` stays >= 0 so the pile never
// reaches up over the "selections" heading, even hovered and dragged upward.
const layout = [
  { left: -6, top: 4, width: 38, rotate: -12 },
  { left: 30, top: 1, width: 30, rotate: 8 },
  { left: 62, top: 7, width: 40, rotate: -9 },
  { left: -4, top: 40, width: 33, rotate: 10 },
  { left: 33, top: 36, width: 28, rotate: -6 },
  { left: 64, top: 44, width: 38, rotate: 11 },
  { left: 0, top: 70, width: 36, rotate: -8 },
  { left: 33, top: 75, width: 31, rotate: 7 },
  { left: 63, top: 66, width: 39, rotate: -10 },
]

export default function Work() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <PageTransition>
      <section className="px-6 pt-44 pb-56 sm:pb-72 lg:pb-96">
        <h1 className="mb-32 text-sm tracking-wide text-neutral-500">selections</h1>
        <div className="relative mx-auto aspect-[3/4] w-full max-w-5xl sm:aspect-[4/3] lg:aspect-[16/9]">
          {projects.map((project, i) => (
            <SelectionPhoto
              key={project.slug}
              project={project}
              placement={layout[i % layout.length]}
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
    </PageTransition>
  )
}
