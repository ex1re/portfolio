import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'

export default function Cellar() {
  return (
    <PageTransition>
      <section className="flex min-h-screen flex-col items-center justify-center px-6">
        <motion.a
          href="https://exire.darkroom.com/"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="font-nav rounded-full border border-neutral-700 px-8 py-3 text-sm tracking-wide text-neutral-100 transition-colors hover:border-neutral-100"
        >
          visit the store →
        </motion.a>
      </section>
    </PageTransition>
  )
}
