import { useLayoutEffect } from 'react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export default function PageTransition({ children }: { children: ReactNode }) {
  /**
   * A page opens at its top.
   *
   * Nothing does this on its own: the document never reloads between routes, so
   * the scroll position stays where the last page left it — open a photo from
   * halfway down the garden and you arrive halfway down the photo.
   *
   * On mount rather than on the location changing, and that distinction matters:
   * the router holds the outgoing page on screen until it has animated out, so
   * resetting when the location changes would yank that page to the top while
   * it's still being looked at. Mounting is the moment the new page appears.
   */
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
