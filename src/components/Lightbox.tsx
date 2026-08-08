import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, animate, useMotionValue } from 'framer-motion'
import type { DisplayPhoto } from '../data/photos'

interface LightboxProps {
  photos: DisplayPhoto[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}

/**
 * How far a finger travels before the gesture decides whether it's a swipe or a
 * scroll. Small, because the decision only has to beat the noise in holding
 * still — past this the photograph starts following the finger.
 */
const AXIS_LOCK = 6
/** A slow, deliberate drag pages once it has carried the photo this far. */
const SWIPE_DISTANCE = 28
/**
 * A flick pages on speed instead, in px per ms. Distance alone can't serve
 * both: a flick is over in 60ms and barely travels, and lowering the distance
 * far enough to catch one would let a shaky tap page as well. This sits well
 * under a real flick, which runs several px per ms, and well over the drift of
 * a finger being set down.
 */
const SWIPE_FLICK = 0.45
/** A flick still has to be a movement, not a twitch during a tap. */
const SWIPE_FLICK_MIN = 12

export default function Lightbox({ photos, index, onClose, onNavigate }: LightboxProps) {
  const photo = photos[index]
  const swiped = useRef(false)
  /** How far the photograph is currently pulled from centre. */
  const shift = useMotionValue(0)
  const gesture = useRef<{ x: number; y: number; axis: '?' | 'x' | 'y' } | null>(null)
  /** The last sample, and the speed between it and the one before. */
  const last = useRef({ x: 0, t: 0 })
  const speed = useRef(0)

  const step = useCallback(
    (by: number) => onNavigate((index + by + photos.length) % photos.length),
    [index, photos.length, onNavigate],
  )

  /**
   * On a phone the arrows sit over the photograph rather than beside it, so
   * they're hidden there and this takes their place. Touch only — a mouse drag
   * across a picture is how you'd save it, not how you'd page.
   *
   * The photograph tracks the finger while the gesture is live. That's most of
   * what makes it feel responsive: the page answers from the first few pixels,
   * so how far to go is something you can see rather than guess.
   */
  function onPointerDown(event: React.PointerEvent) {
    // Cleared here rather than when the click arrives: a swipe across the
    // photograph produces a click the photograph swallows, so the flag would
    // otherwise still be up for the next tap and eat that one instead.
    swiped.current = false
    if (event.pointerType !== 'touch' || photos.length < 2) {
      gesture.current = null
      return
    }
    gesture.current = { x: event.clientX, y: event.clientY, axis: '?' }
    last.current = { x: event.clientX, t: event.timeStamp }
    speed.current = 0
  }

  function onPointerMove(event: React.PointerEvent) {
    const from = gesture.current
    if (!from) return
    const dx = event.clientX - from.x
    const dy = event.clientY - from.y

    // Which way this gesture is going is settled once, on the first real
    // movement, and then held. Deciding afresh on every sample would let a
    // swipe that drifts vertically at the end fall out of being a swipe.
    if (from.axis === '?') {
      if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return
      from.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    }
    if (from.axis !== 'x') return

    const elapsed = event.timeStamp - last.current.t
    if (elapsed > 0) speed.current = (event.clientX - last.current.x) / elapsed
    last.current = { x: event.clientX, t: event.timeStamp }
    shift.set(dx)
  }

  /**
   * Called for a lift and for a cancel alike. A cancel is not a failure to
   * treat as nothing: the browser takes the pointer away mid-gesture when it
   * claims the touch for itself, and the finger has still travelled — left
   * unhandled, exactly the swiftest swipes would be the ones that did nothing.
   *
   * Where it ended is passed in rather than read off the event, because the two
   * endings know it differently: a lift carries the final position, while a
   * cancel is a notification after the fact and its coordinates can be stale.
   * A cancel is judged on the last position actually seen moving.
   */
  function endGesture(endedAt: number) {
    const from = gesture.current
    gesture.current = null
    if (!from || from.axis !== 'x') return

    const dx = endedAt - from.x
    const far = Math.abs(dx) >= SWIPE_DISTANCE
    const flicked = Math.abs(speed.current) >= SWIPE_FLICK && Math.abs(dx) >= SWIPE_FLICK_MIN

    if (far || flicked) {
      // A swipe that starts on the photo and finishes on the backdrop still
      // resolves to a click on the backdrop, which is the gesture for closing.
      swiped.current = true
      // Dragging leftwards brings the next photo in from the right.
      step(dx < 0 ? 1 : -1)
      // The incoming photograph settles into place from where the finger left
      // off, so paging is one continuous movement rather than a snap and a fade.
      animate(shift, 0, { duration: 0.25, ease: [0.22, 1, 0.36, 1] })
    } else {
      animate(shift, 0, { type: 'spring', stiffness: 500, damping: 40 })
    }
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
          // The sideways axis is claimed here, and that is what makes the
          // gesture reliable rather than merely tuned: left to itself the
          // browser decides partway through a swipe that the touch is a page
          // pan, takes the pointer back, and the swipe is never seen. Up and
          // down, and pinching to zoom, are left to the browser.
          className="fixed inset-0 z-[100] flex touch-pan-y touch-pinch-zoom items-center justify-center bg-neutral-950/95 px-6 backdrop-blur-sm select-none"
          onClick={() => {
            if (!swiped.current) onClose()
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(event) => endGesture(event.clientX)}
          onPointerCancel={() => endGesture(last.current.x)}
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

          {/* Two elements rather than one: the outer carries the finger, the
              inner carries the entrance. They'd otherwise write over each
              other's transform, and the photograph would jump back to centre
              the moment a new one started fading in. */}
          <motion.div
            style={{ x: shift }}
            className="flex w-full max-w-3xl items-center justify-center"
          >
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full items-center justify-center"
            >
              {photo.src ? (
                // Contained rather than cropped: the full frame should be
                // visible here. The preview establishes the box; the full-size
                // file fades in over it once decoded, so the photo appears at
                // once and then sharpens instead of arriving late.
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
