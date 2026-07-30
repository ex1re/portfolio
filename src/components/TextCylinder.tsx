import { Fragment, useEffect, useMemo, useState } from 'react'
import useMediaQuery from '../hooks/useMediaQuery'

/** Tilt off head-on, so the rings read as ellipses and the drum looks round. */
const TILT = -12
/** Matches the reverse material on the reference model. */
const REVERSE_OPACITY = 0.16
/** Dissolves the first and last rings rather than cutting them off square. */
const FADE = 'linear-gradient(to bottom, transparent 0%, #000 20%, #000 80%, transparent 100%)'

interface Glyph {
  ch: string
  angle: number
}

interface TextCylinderProps {
  text: string
  className?: string
}

const FONT_STACK = "'Instrument Serif', serif"

/** Wrapping the text needs its real glyph widths, which need the font loaded. */
function measureWidths(chars: string[], fontSize: number) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.font = `${fontSize}px ${FONT_STACK}`
  return chars.map((ch) => ctx.measureText(ch).width)
}

/**
 * Lay the text out around the cylinder, one full turn per ring.
 *
 * Rings break on whitespace so words stay intact, then each ring's glyphs are
 * spread across the full 360° — a ring that ends a little short would otherwise
 * leave a visible gap on the back of the cylinder as it turns. The last ring is
 * left at its natural spacing, since stretching a half-empty line would space it
 * out oddly.
 */
function buildRings(text: string, radius: number, fontSize: number, maxRings: number): Glyph[][] {
  const circumference = 2 * Math.PI * radius
  const tokens = text.split(/(\s+)/).filter(Boolean)
  const rings: string[] = []

  let current = ''
  let currentWidth = 0
  const widthOf = (s: string) => {
    const w = measureWidths([...s], fontSize)
    return w ? w.reduce((a, b) => a + b, 0) : 0
  }

  for (const token of tokens) {
    const tokenWidth = widthOf(token)
    if (currentWidth + tokenWidth > circumference && current.trim()) {
      rings.push(current.trim())
      if (rings.length >= maxRings) return finish(rings, circumference, fontSize)
      current = token.trim() ? token : ''
      currentWidth = current ? tokenWidth : 0
      continue
    }
    current += token
    currentWidth += tokenWidth
  }
  if (current.trim() && rings.length < maxRings) rings.push(current.trim())

  return finish(rings, circumference, fontSize)
}

function finish(rings: string[], circumference: number, fontSize: number): Glyph[][] {
  return rings.map((ring, index) => {
    const chars = [...ring]
    const widths = measureWidths(chars, fontSize)
    if (!widths) return []
    const total = widths.reduce((a, b) => a + b, 0)
    const isLast = index === rings.length - 1

    // A full ring is stretched to close the loop, so no gap shows on the back as
    // it turns. A short final ring keeps its natural spacing instead — stretching
    // its few remaining words around the whole circumference would strand them.
    // Either way a ring starts at 0°, so every line begins on the same face.
    const denom = isLast && total < circumference * 0.8 ? circumference : Math.max(total, 1)

    let x = 0
    return chars.map((ch, i) => {
      const angle = ((x + widths[i] / 2) / denom) * 360
      x += widths[i]
      return { ch, angle }
    })
  })
}

export default function TextCylinder({ text, className = '' }: TextCylinderProps) {
  const compact = useMediaQuery('(max-width: 767px)')
  const [rings, setRings] = useState<Glyph[][]>([])

  const config = useMemo(
    () =>
      // maxRings is a ceiling, not a target — the poem currently runs out first.
      // It only clips a text long enough to make the drum unreasonably tall.
      compact
        ? { radius: 92, fontSize: 16, lineHeight: 26, maxRings: 18 }
        : { radius: 148, fontSize: 23, lineHeight: 37, maxRings: 18 },
    [compact],
  )

  useEffect(() => {
    let cancelled = false
    const build = () => {
      if (cancelled) return
      setRings(buildRings(text, config.radius, config.fontSize, config.maxRings))
    }
    // Measuring before the webfont lands would wrap against the fallback metrics.
    if (document.fonts?.ready) {
      document.fonts.ready.then(build)
    } else {
      build()
    }
    return () => {
      cancelled = true
    }
  }, [text, config])

  const height = config.lineHeight * Math.max(rings.length, 1)

  return (
    <div className={className}>
      {/* The turning text is decorative; screen readers get the poem as prose.
          The mask sits outside the 3D scene: applying it to a preserve-3d
          element would flatten the subtree and collapse the cylinder. */}
      <div
        aria-hidden
        className="relative mx-auto"
        style={{
          width: config.radius * 2,
          height,
          maskImage: FADE,
          WebkitMaskImage: FADE,
        }}
      >
        <div className="absolute inset-0" style={{ perspective: 1000 }}>
          <div
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d', transform: `rotateX(${TILT}deg)` }}
          >
            <div
              className="animate-cylinder absolute inset-0"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {rings.map((ring, r) => (
                <div
                  key={r}
                  className="absolute left-1/2 top-0"
                  style={{ transformStyle: 'preserve-3d', transform: `translateY(${r * config.lineHeight}px)` }}
                >
                  {ring.map((glyph, i) => {
                    const seat = `rotateY(${glyph.angle}deg) translateZ(${config.radius}px)`
                    const style = {
                      fontSize: config.fontSize,
                      lineHeight: 1,
                      backfaceVisibility: 'hidden' as const,
                      whiteSpace: 'pre' as const,
                    }
                    return (
                      <Fragment key={`${r}-${i}`}>
                        <span
                          className="font-serif absolute text-neutral-200"
                          style={{ ...style, transform: seat }}
                        >
                          {glyph.ch}
                        </span>
                        {/* The same glyph turned to face inward, so it appears
                            only while on the far side — seen through the drum,
                            and mirrored, the way the model's reverse material
                            shows the back of the text at low opacity. */}
                        <span
                          className="font-serif absolute text-neutral-200"
                          style={{
                            ...style,
                            transform: `${seat} rotateY(180deg)`,
                            opacity: REVERSE_OPACITY,
                          }}
                        >
                          {glyph.ch}
                        </span>
                      </Fragment>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="sr-only">{text}</p>
    </div>
  )
}
