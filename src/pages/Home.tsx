import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import CityCrossfade from '../components/CityCrossfade'
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
          on a wide screen, under them otherwise. The side-by-side only starts at
          lg — the picture is nearly a full screen tall, and half of a tablet's
          width leaves the two of them fighting over the same inch.

          The desktop padding is cut back to what the picture needs: at 90vh tall
          it and its margins come to 100vh on any screen down to 640px high, so
          it runs nearly the full height without pushing the page into a scroll. */}
      {/* Stacked, the words and the picture sit straight on top of each other:
          the picture's own top band is empty sky faded to nothing, which reads
          as space of its own without any gap being set. */}
      <section className="flex min-h-screen flex-col items-start justify-center gap-0 px-6 pt-28 pb-16 lg:flex-row lg:items-center lg:gap-8 lg:py-8">
        {/* Full width on its own line; a half-column only once they sit side by
            side. Without the base width the column would shrink to its contents
            and the lettering, which fills whatever it's given, would have
            nothing definite to fill. */}
        <div className={heroFile ? 'w-full lg:w-1/2 lg:max-w-2xl' : 'w-full'}>
          {/* The mark is two names crossing, which no single run of text can
              stand in for, so the heading itself is the plain reading of it. */}
          <h1 className="sr-only">San Francisco and Los Angeles</h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <CityCrossfade top="San Francisco" bottom="Los Angeles" />
            {/* The coordinates of each, in the order they're read above. They
                hold one line at every width — a wrapped pair reads as four
                numbers rather than two places — so the tracking and size come
                in a step where the column is narrowest. */}
            <div className="mt-5 flex justify-between gap-4 text-[10px] uppercase tracking-[0.08em] text-neutral-500 sm:gap-8 sm:text-[11px] sm:tracking-[0.12em]">
              <span className="whitespace-nowrap">37.7749° N, 122.4194° W</span>
              <span className="whitespace-nowrap">34.0522° N, 118.2437° W</span>
            </div>
          </motion.div>
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
              className="mt-28 inline-block border-b border-neutral-100 pb-1 text-lg tracking-wide text-neutral-100 transition-opacity hover:opacity-70"
            >
              Enter the garden →
            </Link>
          </motion.div>
        </div>

        {heroFile && (
          <div className="flex w-full justify-center lg:w-1/2">
            <motion.img
              // Rising a little as it fades is the same entrance the words make,
              // but it waits for them: the last line has been settled for a
              // second before the picture starts, so it arrives as its own
              // event rather than as part of the page loading.
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.6, delay: 1.9, ease: 'easeOut' }}
              src={heroFile.src}
              // Chosen on what the slot actually asks for — its width times the
              // screen's density — rather than on density alone. A phone at 3x
              // still only needs about 900px across, and would otherwise pull
              // the full-size file down a mobile connection to show it small.
              srcSet={`${heroFile.src} ${heroFile.srcWidth}w, ${heroFile.src2x} ${heroFile.src2xWidth}w`}
              sizes="(min-width: 1024px) 40vw, (min-width: 640px) 460px, 80vw"
              width={heroFile.width}
              height={heroFile.height}
              alt="A glass tower at night, its lit floors rising into the dark."
              // First thing on the page, so it loads with the page rather than
              // waiting its turn behind the deferred images elsewhere.
              fetchPriority="high"
              decoding="async"
              className="blend-edges h-auto w-full max-w-[19rem] object-contain sm:max-w-sm md:max-w-md lg:h-[90vh] lg:max-h-[64rem] lg:w-auto lg:max-w-none"
            />
          </div>
        )}
      </section>
    </PageTransition>
  )
}
