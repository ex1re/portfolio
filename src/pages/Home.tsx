import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import useMediaQuery from '../hooks/useMediaQuery'
import { heroFile } from '../data/generated/photo-manifest'

const CAMERAS = ['FujiFilm', 'Canon', 'iPhone']
const HOLD_MS = 2600

/**
 * The last word of the line, changing on a turn: each name rises out of sight
 * as the next comes up from below it.
 *
 * The names sit in a slot with its edges clipped, so they appear from nothing
 * rather than sliding over the sentence. Nothing follows them on the line, so
 * the slot can take each name's own width without moving anything else.
 */
function RotatingCamera() {
  const [index, setIndex] = useState(0)
  const still = useMediaQuery('(prefers-reduced-motion: reduce)')

  useEffect(() => {
    const id = setInterval(() => setIndex((n) => (n + 1) % CAMERAS.length), HOLD_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      {/* Read out as one settled line, rather than a word that keeps changing.
          With motion turned down the list is the whole of it, so it takes the
          serial comma; alongside the turning names it stays the shorter form. */}
      <span className="sr-only">
        {still ? 'FujiFilm, Canon, and iPhone.' : 'FujiFilm, Canon and iPhone.'}
      </span>
      <span aria-hidden className="relative inline-flex h-7 items-start overflow-hidden align-bottom">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={CAMERAS[index]}
            initial={{ y: still ? 0 : '110%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: still ? 0 : '-110%', opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="leading-7 whitespace-nowrap"
          >
            {/* The weight is on the name alone — the full stop belongs to the
                sentence, not to the camera. */}
            <span className="font-semibold">{CAMERAS[index]}</span>.
          </motion.span>
        </AnimatePresence>
      </span>
    </>
  )
}

export default function Home() {
  return (
    <PageTransition>
      {/* The photograph shares the opening screen with the words: alongside them
          on desktop, under them once there isn't room. Both are centred on the
          same line, so the picture reads as the other half of the page rather
          than as decoration hung beside it. */}
      {/* The desktop padding is cut back to what the picture needs: at 90vh tall
          it and its margins come to 100vh on any screen down to 640px high, so
          it runs nearly the full height without pushing the page into a scroll. */}
      <section className="flex min-h-screen flex-col items-start justify-center gap-12 px-6 pt-28 pb-16 md:flex-row md:items-center md:gap-8 md:py-8">
        <div className={heroFile ? 'md:w-1/2 md:max-w-2xl' : 'w-full'}>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-3xl text-5xl font-semibold tracking-tight text-neutral-100 sm:text-7xl"
          >
            Photography &amp; visual work.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            className="mt-6 max-w-xl text-lg text-neutral-400"
          >
            Shot on <RotatingCamera />
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          >
            <Link
              to="/garden"
              className="mt-10 inline-block border-b border-neutral-100 pb-1 text-sm tracking-wide text-neutral-100 transition-opacity hover:opacity-70"
            >
              Enter the garden →
            </Link>
          </motion.div>
        </div>

        {heroFile && (
          <div className="flex w-full justify-center md:w-1/2">
            <motion.img
              // Rising a little as it fades is the same entrance the words make,
              // just slower — it should still be arriving as they settle.
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
              src={heroFile.src}
              // The slot is a fixed size on screen, so this is a question of
              // density rather than layout: ordinary displays take the smaller
              // rendition, retina ones the larger.
              srcSet={`${heroFile.src} 1x, ${heroFile.src2x} 2x`}
              width={heroFile.width}
              height={heroFile.height}
              alt="A glass tower at night, its lit floors rising into the dark."
              // First thing on the page, so it loads with the page rather than
              // waiting its turn behind the deferred images elsewhere.
              fetchPriority="high"
              decoding="async"
              className="blend-edges h-auto w-full max-w-[19rem] object-contain sm:max-w-sm md:h-[90vh] md:max-h-[64rem] md:w-auto md:max-w-none"
            />
          </div>
        )}
      </section>
    </PageTransition>
  )
}
