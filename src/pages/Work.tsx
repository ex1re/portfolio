import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import useFinePointer from '../hooks/useFinePointer'
import { projects } from '../data/projects'
import { collections } from '../data/collections'

// How far a photo may be dragged from its resting spot, in px. Deliberately
// bounded per-photo (rather than to the container) so the pile keeps its
// edge-bleeding look while no photo can reach the header or the collections
// section below.
const DRAG_X = 90
const DRAG_Y = 60

// Distance in px past which a pointer gesture counts as a drag rather than a
// click, so dragging a photo doesn't also navigate to its page.
const DRAG_SLOP = 4

// Percent-based positions, deliberately irregular (not a grid): mixed sizes,
// wide rotation range, and edges that bleed past the frame so the pile reads
// as a genuine scattered stack rather than tidy rows.
const layout = [
  { left: -6, top: -6, width: 38, rotate: -12 },
  { left: 30, top: -9, width: 30, rotate: 8 },
  { left: 62, top: -3, width: 40, rotate: -9 },
  { left: -4, top: 30, width: 33, rotate: 10 },
  { left: 33, top: 26, width: 28, rotate: -6 },
  { left: 64, top: 34, width: 38, rotate: 11 },
  { left: 0, top: 60, width: 36, rotate: -8 },
  { left: 33, top: 65, width: 31, rotate: 7 },
  { left: 63, top: 56, width: 39, rotate: -10 },
]

export default function Work() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const didDrag = useRef(false)
  // Drag is mouse/trackpad only: a draggable photo gets `touch-action: none`,
  // which on a phone would swallow the swipe used to scroll the page.
  const canDrag = useFinePointer()

  return (
    <PageTransition>
      <section className="px-6 pt-44 pb-56 sm:pb-72 lg:pb-96">
        <h1 className="mb-10 text-sm tracking-wide text-neutral-500">selections</h1>
        <div className="relative mx-auto aspect-[3/4] w-full max-w-5xl sm:aspect-[4/3] lg:aspect-[16/9]">
          {projects.map((project, i) => {
            const pos = layout[i % layout.length]
            const isActive = activeIndex === i
            return (
              <motion.div
                key={project.slug}
                onPointerEnter={() => setActiveIndex(i)}
                drag={canDrag}
                dragConstraints={{ left: -DRAG_X, right: DRAG_X, top: -DRAG_Y, bottom: DRAG_Y }}
                // Low elasticity is what creates the "magnetic" feel: past the
                // boundary the photo only follows a fraction of the pointer's
                // movement, then eases back inside.
                dragElastic={0.12}
                dragMomentum={false}
                dragTransition={{ bounceStiffness: 260, bounceDamping: 42 }}
                onDragStart={() => {
                  didDrag.current = false
                  setActiveIndex(i)
                }}
                onDrag={(_, info) => {
                  if (Math.abs(info.offset.x) > DRAG_SLOP || Math.abs(info.offset.y) > DRAG_SLOP) {
                    didDrag.current = true
                  }
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: isActive ? 1.1 : 1,
                  rotate: isActive ? 0 : pos.rotate,
                  zIndex: isActive ? 50 : i + 1,
                }}
                whileDrag={{ scale: 1.14, zIndex: 60 }}
                transition={{
                  default: { duration: 0.2, ease: 'easeOut' },
                  opacity: { duration: 0.5, delay: i * 0.06, ease: 'easeOut' },
                }}
                style={{
                  position: 'absolute',
                  left: `${pos.left}%`,
                  top: `${pos.top}%`,
                  width: `${pos.width}%`,
                }}
              >
                <Link
                  to={`/garden/${project.slug}`}
                  draggable={false}
                  onClick={(e) => {
                    if (didDrag.current) {
                      e.preventDefault()
                      didDrag.current = false
                    }
                  }}
                  className={`group block bg-neutral-400 p-1.5 shadow-xl shadow-black/60 select-none ${
                    canDrag ? 'cursor-grab active:cursor-grabbing' : ''
                  }`}
                >
                  <div
                    style={{ aspectRatio: String(project.aspect) }}
                    className={`relative w-full overflow-hidden bg-gradient-to-br ${project.color}`}
                  >
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-8 pb-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <h2 className="text-sm text-neutral-100">{project.title}</h2>
                      <span className="text-xs text-neutral-300">{project.year}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>

      <section className="px-6 pt-4 pb-24">
        <h2 className="mb-10 text-sm tracking-wide text-neutral-500">collections</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection, i) => (
            <motion.div
              key={collection.slug}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
            >
              <Link to={`/garden/collections/${collection.slug}`} className="group block">
                <div
                  className={`aspect-[4/3] w-full rounded-sm bg-gradient-to-br ${collection.color} transition-transform duration-300 group-hover:scale-[1.02]`}
                />
                <div className="mt-3">
                  <h3 className="text-base text-neutral-100">{collection.title}</h3>
                  <p className="text-sm text-neutral-500">{collection.photos.length} photos</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </PageTransition>
  )
}
