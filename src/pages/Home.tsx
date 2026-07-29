import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PageTransition from '../components/PageTransition'

export default function Home() {
  return (
    <PageTransition>
      <section className="flex min-h-screen flex-col items-start justify-center px-6">
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
      </section>
    </PageTransition>
  )
}
