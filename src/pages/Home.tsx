import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import { heroFile } from '../data/generated/photo-manifest'

export default function Home() {
  return (
    <PageTransition>
      {/* The photograph shares the opening screen with the words: alongside them
          on desktop, under them once there isn't room. Both are centred on the
          same line, so the picture reads as the other half of the page rather
          than as decoration hung beside it. */}
      <section className="flex min-h-screen flex-col items-start justify-center gap-16 px-6 pt-32 pb-20 md:flex-row md:items-center md:gap-8 md:pt-24 md:pb-24">
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
            A short line about what you shoot and how you see the world. Replace this with your own voice.
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
              View the work →
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
              // density rather than layout: ordinary displays take the preview,
              // retina ones pull the full-resolution file.
              srcSet={`${heroFile.src} 1x, ${heroFile.fullSrc} 2x`}
              width={heroFile.width}
              height={heroFile.height}
              alt="A glass tower at night, its lit floors rising into the dark."
              // First thing on the page, so it loads with the page rather than
              // waiting its turn behind the deferred images elsewhere.
              fetchPriority="high"
              decoding="async"
              className="blend-edges h-auto w-full max-w-[19rem] object-contain sm:max-w-sm md:h-[74vh] md:max-h-[52rem] md:w-auto md:max-w-none"
            />
          </div>
        )}
      </section>
    </PageTransition>
  )
}
