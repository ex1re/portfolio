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
/**
 * How much of the finger's travel the photograph takes. Tracking it exactly
 * makes a large picture swing about under the finger; at a little over half it
 * still plainly answers the hand, and the movement is calm enough to watch.
 * Only what's drawn is damped — how far the finger went is what decides
 * whether to page, and that's measured raw.
 */
const FOLLOW = 0.55

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
    // Rounded to whole pixels. A photograph this size parked on a fraction of a
    // pixel is resampled every frame, and with a blurred backdrop behind it
    // that resampling shimmers — the picture looks like it's vibrating rather
    // than moving. On whole pixels it simply moves.
    shift.set(Math.round(dx * FOLLOW))
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
      // Centred at once rather than slid back. The photograph arriving is a
      // different one that fades up in place, so animating the frame home at
      // the same time put two unrelated movements on screen at once and read
      // as a lurch. The one that carries meaning is the fade.
      shift.set(0)
    } else {
      // Critically damped — stiffness 400 against damping 40 puts the ratio at
      // exactly 1, so an abandoned swipe returns and stops. Anything springier
      // overshoots centre and wobbles, which is the shake it's meant to avoid.
      animate(shift, 0, { type: 'spring', stiffness: 400, damping: 40, mass: 1 })
    }
  }
  // The preview is already cached from the grid, so it can show instantly while
  // the full-size file downloads behind it.
  const [fullLoaded, setFullLoaded] = useState(false)
  const hasSeparateFull = Boolean(photo?.fullSrc && photo.fullSrc !== photo.src)

  useEffect(() => {
    setFullLoaded(false)
  }, [photo?.id])

  /**
   * Hold the page still underneath.
   *
   * The lightbox covers the window, but the document behind it went on
   * scrolling: a swipe with any drift in it panned the grid, and because that
   * grid shows through a blurred backdrop the whole background slid while the
   * photograph stayed put. It looked like the photograph was the thing shaking.
   *
   * Locked on the root element, which is this site's scroll container. Removing
   * the scrollbar would otherwise let the page widen by its width and shift
   * everything sideways as the lightbox opens, so that width is handed back as
   * padding. On a phone there is no scrollbar and the gap is zero.
   */
  const open = Boolean(photo)
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const gap = window.innerWidth - root.clientWidth
    const previous = { overflow: root.style.overflow, padding: root.style.paddingRight }
    root.style.overflow = 'hidden'
    if (gap > 0) root.style.paddingRight = `${gap}px`
    return () => {
      root.style.overflow = previous.overflow
      root.style.paddingRight = previous.padding
    }
  }, [open])

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
          // No panning in either direction, which does two things at once: the
          // page behind can't be dragged while the lightbox is up, and the
          // browser can't decide partway through a swipe that the touch was a
          // pan, take the pointer back, and leave the swipe unseen. Pinching to
          // zoom is deliberately still allowed — it costs nothing here, since
          // zooming isn't panning, and it's worth keeping on a photograph.
          className="fixed inset-0 z-[100] flex touch-pinch-zoom items-center justify-center overscroll-contain bg-neutral-950/95 px-6 backdrop-blur-sm select-none"
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
            // Kept on its own compositing layer, so following the finger moves
            // a finished layer instead of repainting the picture each frame.
            style={{ x: shift, willChange: 'transform' }}
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
