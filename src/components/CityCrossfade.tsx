import { useCallback, useEffect, useRef } from 'react'

/** How far each name sits from the seam, in ems of its own size. */
const SPLIT = 0.2
/** Height of the band the two names fade through, as a % of the box. */
const BLEND = 30
/** Room given to each layer beyond the box, so the mask has somewhere to
 *  finish rather than ending on a cut. */
const BLEED = 0.55
/** The size the names are measured at, before the real one is worked out. */
const REF_SIZE = 100
const MIN_SIZE = 26
const MAX_SIZE = 136

interface CityCrossfadeProps {
  top: string
  bottom: string
  className?: string
}

/**
 * Two place names sharing one line: the upper one sinks into the lower as they
 * cross, so the pair reads as a single mark rather than two stacked words.
 *
 * Each name is stretched to the full width of the block, which is what lines
 * their edges up. The colour is the page's own — the greys through the middle
 * aren't painted, they're white letters dissolving into the background.
 */
export default function CityCrossfade({ top, bottom, className = '' }: CityCrossfadeProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const topLayer = useRef<HTMLDivElement>(null)
  const botLayer = useRef<HTMLDivElement>(null)
  const topSpan = useRef<HTMLSpanElement>(null)
  const botSpan = useRef<HTMLSpanElement>(null)

  const apply = useCallback(() => {
    const box = boxRef.current
    const layers = [topLayer.current, botLayer.current]
    const spans = [topSpan.current, botSpan.current]
    if (!box || layers.some((l) => !l) || spans.some((s) => !s)) return

    const width = box.clientWidth
    if (!width) return

    // Measure both names at a known size, then take the size at which their
    // mean width is the block's. One name is then stretched by as much as the
    // other is squeezed, instead of both being pulled the same way.
    box.style.fontSize = `${REF_SIZE}px`
    for (const span of spans) span!.style.transform = 'none'
    const natural = spans.map((span) => span!.offsetWidth)
    if (natural.some((n) => !n)) return

    const mean = (natural[0] + natural[1]) / 2
    const size = Math.min(MAX_SIZE, Math.max(MIN_SIZE, (REF_SIZE * width) / mean))
    box.style.fontSize = `${size}px`
    box.style.height = `${(0.82 + 2 * SPLIT).toFixed(3)}em`

    spans.forEach((span, i) => {
      const drawn = (natural[i] * size) / REF_SIZE
      const shift = i === 0 ? -SPLIT : SPLIT
      span!.style.transform = `translateY(${shift}em) scaleX(${(width / drawn).toFixed(4)})`
    })

    // The layers reach past the block so the gradient can run out beyond the
    // letters; the band itself stays centred on the seam either way.
    const bleed = BLEED * size
    const boxHeight = box.clientHeight
    const layerHeight = boxHeight + 2 * bleed
    for (const layer of layers) {
      layer!.style.top = `${-bleed}px`
      layer!.style.bottom = `${-bleed}px`
    }

    const band = (boxHeight * BLEND) / 100
    const from = ((100 * (layerHeight / 2 - band / 2)) / layerHeight).toFixed(3)
    const to = ((100 * (layerHeight / 2 + band / 2)) / layerHeight).toFixed(3)
    const mask = (layer: HTMLDivElement, gradient: string) => {
      layer.style.maskImage = gradient
      layer.style.webkitMaskImage = gradient
      layer.style.maskRepeat = layer.style.webkitMaskRepeat = 'no-repeat'
      layer.style.maskSize = layer.style.webkitMaskSize = '100% 100%'
    }
    mask(layers[0]!, `linear-gradient(to bottom, #000 0%, #000 ${from}%, transparent ${to}%, transparent 100%)`)
    mask(layers[1]!, `linear-gradient(to bottom, transparent 0%, transparent ${from}%, #000 ${to}%, #000 100%)`)
  }, [])

  useEffect(() => {
    apply()
    // The block is sized by its column, which moves with the layout rather
    // than only with the window.
    const observer = new ResizeObserver(apply)
    if (boxRef.current) observer.observe(boxRef.current)
    // Measuring before the face resolves would fit the names to the fallback.
    document.fonts?.ready.then(apply)
    return () => observer.disconnect()
  }, [apply, top, bottom])

  return (
    <div
      ref={boxRef}
      aria-hidden
      className={`relative w-full font-bold leading-none tracking-[-0.035em] text-neutral-100 ${className}`}
      style={{ height: `${0.82 + 2 * SPLIT}em` }}
    >
      <div ref={topLayer} className="absolute inset-0 flex items-center justify-center">
        <span ref={topSpan} className="inline-block origin-center whitespace-nowrap">
          {top}
        </span>
      </div>
      <div ref={botLayer} className="absolute inset-0 flex items-center justify-center">
        <span ref={botSpan} className="inline-block origin-center whitespace-nowrap">
          {bottom}
        </span>
      </div>
    </div>
  )
}
