import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Photo } from '../data/collections'

interface LightboxProps {
  photos: Photo[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export default function Lightbox({ photos, index, onClose, onNavigate }: LightboxProps) {
  const photo = photos[index]

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNavigate((index + 1) % photos.length)
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + photos.length) % photos.length)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [index, photos.length, onClose, onNavigate])

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/95 px-6 backdrop-blur-sm"
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            className="font-nav absolute top-6 right-6 text-sm text-neutral-400 hover:text-neutral-100"
            aria-label="Close"
          >
            close ✕
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onNavigate((index - 1 + photos.length) % photos.length)
            }}
            className="absolute left-4 text-2xl text-neutral-400 hover:text-neutral-100 sm:left-8"
            aria-label="Previous photo"
          >
            ←
          </button>

          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{ aspectRatio: String(photo.aspect) }}
            className={`max-h-[80vh] w-full max-w-3xl rounded-sm bg-gradient-to-br ${photo.color}`}
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onNavigate((index + 1) % photos.length)
            }}
            className="absolute right-4 text-2xl text-neutral-400 hover:text-neutral-100 sm:right-8"
            aria-label="Next photo"
          >
            →
          </button>

          <span className="font-nav absolute bottom-6 text-xs text-neutral-500">
            {index + 1} / {photos.length}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
