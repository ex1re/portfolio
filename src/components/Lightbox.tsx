import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DisplayPhoto } from '../data/photos'

interface LightboxProps {
  photos: DisplayPhoto[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}

/** A swipe has to travel this far to count, in px. */
const SWIPE_DISTANCE = 45
/** And it has to be this much more sideways than up, so a scroll isn't one. */
const SWIPE_RATIO = 1.4

export default function Lightbox({ photos, index, onClose, onNavigate }: LightboxProps) {
  const photo = photos[index]
  const swipeFrom = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  const step = useCallback(
    (by: number) => onNavigate((index + by + photos.length) % photos.length),
    [index, photos.length, onNavigate],
  )

  /**
   * On a phone the arrows sit over the photograph rather than beside it, so
   * they're hidden there and the gesture takes their place. Touch only — a
   * mouse drag across a picture is how you'd save it, not how you'd page.
   */
  function onPointerDown(event: React.PointerEvent) {
    // Cleared here rather than when the click arrives: a swipe across the
    // photograph produces a click the photograph swallows, so the flag would
    // otherwise still be up for the next tap and eat that one instead.
    swiped.current = false
    swipeFrom.current =
      event.pointerType === 'touch' ? { x: event.clientX, y: event.clientY } : null
  }

  function onPointerUp(event: React.PointerEvent) {
    const from = swipeFrom.current
    swipeFrom.current = null
    if (!from || photos.length < 2) return
    const dx = event.clientX - from.x
    const dy = event.clientY - from.y
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return
    // A swipe that starts on the photo and finishes on the backdrop still
    // resolves to a click on the backdrop, which is the gesture for closing.
    swiped.current = true
    // Dragging leftwards brings the next photo in from the right.
    step(dx < 0 ? 1 : -1)
  }
  // The preview is already cached from the grid, so it can show instantly while
  // the full-size file downloads behind it.
  const [fullLoaded, setFullLoaded] = useState(false)
  const hasSeparateFull = Boolean(photo?.fullSrc && photo.fullSrc !== photo.src)

  useEffect(() => {
    setFullLoaded(false)
  }, [photo?.id])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, step])

  // Warm the neighbours so stepping through with the arrows is instant.
  useEffect(() => {
    if (photos.length < 2) return
    const neighbours = [
      photos[(index + 1) % photos.length],
      photos[(index - 1 + photos.length) % photos.length],
    ]
    for (const neighbour of neighbours) {
      if (!neighbour?.fullSrc) continue
      const preloader = new Image()
      preloader.src = neighbour.fullSrc
    }
  }, [index, photos])

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/95 px-6 backdrop-blur-sm"
          onClick={() => {
            if (!swiped.current) onClose()
          }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            swipeFrom.current = null
          }}
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
              step(-1)
            }}
            className="absolute left-4 hidden text-2xl text-neutral-400 hover:text-neutral-100 sm:left-8 sm:block"
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
            className="flex w-full max-w-3xl items-center justify-center"
          >
            {photo.src ? (
              // Contained rather than cropped: the full frame should be visible
              // here. The preview establishes the box; the full-size file fades
              // in over it once decoded, so the photo appears at once and then
              // sharpens instead of arriving late.
              <div className="relative flex items-center justify-center">
                <img
                  src={photo.src}
                  width={photo.width}
                  height={photo.height}
                  alt={photo.alt}
                  draggable={false}
                  className="max-h-[80vh] w-auto max-w-full rounded-sm object-contain"
                />
                {hasSeparateFull && (
                  <img
                    src={photo.fullSrc}
                    alt=""
                    aria-hidden
                    draggable={false}
                    onLoad={() => setFullLoaded(true)}
                    className={`absolute inset-0 h-full w-full rounded-sm object-contain transition-opacity duration-300 ${
                      fullLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                )}
              </div>
            ) : (
              <div
                style={{ aspectRatio: String(photo.aspect) }}
                className={`max-h-[80vh] w-full rounded-sm bg-gradient-to-br ${photo.color}`}
              />
            )}
          </motion.div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              step(1)
            }}
            className="absolute right-4 hidden text-2xl text-neutral-400 hover:text-neutral-100 sm:right-8 sm:block"
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
