import { useEffect, useRef, useState } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { Project } from '../data/projects'

export interface PhotoPlacement {
  left: number
  top: number
  width: number
  rotate: number
}

interface SelectionPhotoProps {
  project: Project
  placement: PhotoPlacement
  index: number
  isActive: boolean
  onActivate: () => void
  constraints: { left: number; right: number; top: number; bottom: number }
}

// Touch must hold before a photo is picked up, so an ordinary swipe across the
// pile still scrolls the page.
const HOLD_MS = 200
// Movement during the hold that means "this is a scroll, not a grab".
const HOLD_SLOP = 10
// Movement past which a gesture counts as a drag rather than a tap.
const DRAG_SLOP = 4

/**
 * One photo in the garden pile.
 *
 * Drag is armed per gesture instead of being always-on: framer-motion applies
 * `touch-action: none` whenever `drag` is truthy, and that would swallow the
 * swipe used to scroll the page. Keeping `drag` off until a pointer earns it
 * means the page only stops scrolling while a photo is genuinely being moved.
 */
export default function SelectionPhoto({
  project,
  placement,
  index,
  isActive,
  onActivate,
  constraints,
}: SelectionPhotoProps) {
  const dragControls = useDragControls()
  const [armed, setArmed] = useState(false)
  const [dragging, setDragging] = useState(false)

  const holdTimer = useRef<number | null>(null)
  const holdOrigin = useRef<{ x: number; y: number } | null>(null)
  const originEvent = useRef<PointerEvent | null>(null)
  const startRequested = useRef(false)
  const suppressClick = useRef(false)
  // Mirrors `armed` for synchronous reads inside event handlers.
  const armedRef = useRef(false)

  function cancelHold() {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
    holdOrigin.current = null
  }

  /**
   * Begin a drag from `event`. Arming is a one-way latch: once the drag feature
   * is mounted it stays mounted, so later gestures can start immediately and no
   * teardown can interrupt the spring that settles a photo back into bounds.
   * `dragListener` is false, so a mounted feature never grabs a gesture we
   * haven't explicitly handed it.
   */
  function arm(event: PointerEvent) {
    if (armedRef.current) {
      dragControls.start(event)
      return
    }
    originEvent.current = event
    startRequested.current = true
    armedRef.current = true
    setArmed(true)
  }

  // Hand the original pointer event to framer-motion once the drag feature has
  // mounted, so the gesture picks up from where the pointer already is.
  useEffect(() => {
    if (!armed || !startRequested.current || !originEvent.current) return
    startRequested.current = false
    dragControls.start(originEvent.current)
  }, [armed, dragControls])

  // `touch-action` is latched when a gesture begins, so it can't stop the page
  // scrolling for a drag that starts later. Cancel the scroll directly instead.
  useEffect(() => {
    if (!dragging) return
    const block = (event: TouchEvent) => event.preventDefault()
    document.addEventListener('touchmove', block, { passive: false })
    return () => document.removeEventListener('touchmove', block)
  }, [dragging])

  useEffect(
    () => () => {
      if (holdTimer.current !== null) window.clearTimeout(holdTimer.current)
    },
    [],
  )

  function handlePointerDown(event: React.PointerEvent) {
    suppressClick.current = false
    onActivate()

    if (event.pointerType === 'touch') {
      const native = event.nativeEvent
      holdOrigin.current = { x: event.clientX, y: event.clientY }
      holdTimer.current = window.setTimeout(() => {
        holdTimer.current = null
        holdOrigin.current = null
        // A deliberate hold is not a tap, so it shouldn't open the project.
        suppressClick.current = true
        navigator.vibrate?.(12)
        arm(native)
      }, HOLD_MS)
    } else {
      arm(event.nativeEvent)
    }
  }

  function handlePointerMove(event: React.PointerEvent) {
    if (holdTimer.current === null || !holdOrigin.current) return
    const dx = event.clientX - holdOrigin.current.x
    const dy = event.clientY - holdOrigin.current.y
    if (Math.hypot(dx, dy) > HOLD_SLOP) cancelHold()
  }

  return (
    <motion.div
      onPointerEnter={onActivate}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      // Suppress the long-press callout/context menu on touch.
      onContextMenu={(event) => event.preventDefault()}
      drag={armed}
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={constraints}
      // Low elasticity is what creates the "magnetic" feel: past the boundary
      // the photo only follows a fraction of the pointer's movement, then eases
      // back inside.
      dragElastic={0.12}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 260, bounceDamping: 42 }}
      onDragStart={() => setDragging(true)}
      onDrag={(_, info) => {
        if (Math.abs(info.offset.x) > DRAG_SLOP || Math.abs(info.offset.y) > DRAG_SLOP) {
          suppressClick.current = true
        }
      }}
      onDragEnd={() => setDragging(false)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: isActive ? 1.1 : 1,
        rotate: isActive ? 0 : placement.rotate,
        zIndex: isActive ? 50 : index + 1,
      }}
      // Picking a photo up should still feel immediate, so this stays quicker
      // than the hover transition below.
      whileDrag={{ scale: 1.14, zIndex: 60, transition: { duration: 0.15, ease: 'easeOut' } }}
      transition={{
        // Surfacing and sinking are eased rather than snapped, so moving the
        // cursor across the pile doesn't read as photos popping.
        default: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
        // Stacking order has to change at once: interpolating it would walk the
        // photo up through its neighbours instead of lifting it clear.
        zIndex: { duration: 0 },
        opacity: { duration: 0.5, delay: index * 0.06, ease: 'easeOut' },
      }}
      style={{
        position: 'absolute',
        left: `${placement.left}%`,
        top: `${placement.top}%`,
        width: `${placement.width}%`,
        touchAction: dragging ? 'none' : 'auto',
      }}
    >
      <Link
        to={`/garden/${project.slug}`}
        draggable={false}
        onClick={(event) => {
          if (suppressClick.current) {
            event.preventDefault()
            suppressClick.current = false
          }
        }}
        className="group block cursor-grab bg-neutral-400 p-1.5 shadow-xl shadow-black/60 select-none active:cursor-grabbing"
      >
        <div
          style={{ aspectRatio: String(project.aspect) }}
          className={`relative w-full overflow-hidden bg-gradient-to-br ${project.color}`}
        >
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-8 pb-2 opacity-0 transition-opacity group-hover:opacity-100">
            <h2 className="text-sm text-neutral-100">{project.title}</h2>
            <span className="text-xs text-neutral-300">{project.year}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
