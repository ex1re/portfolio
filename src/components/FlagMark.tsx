/**
 * The little round flag beside a publication.
 *
 * Drawn rather than served as an image. These sit at about 14px, where a 512px
 * PNG is thirteen hundred times the pixels actually shown and still softens on
 * a retina screen once the browser resamples it; drawn shapes stay exact at any
 * size and cost no request at all. The whole set below is smaller than one of
 * the PNGs, and it inherits the page rather than baking in a background.
 *
 * They are circular crops of each flag, as the source images are: a flag scaled
 * to cover the circle, so the American canton reads large and the Greek one
 * fills its corner. Detail that can't survive at this size is left out — fifty
 * stars would be a grey smudge — but nothing is moved.
 */
import { useId } from 'react'
import type { ReactNode } from 'react'

export type Country = 'dk' | 'gr' | 'us' | 'sct'

const NAMES: Record<Country, string> = {
  dk: 'Denmark',
  gr: 'Greece',
  us: 'United States',
  sct: 'Scotland',
}

interface FlagMarkProps {
  country: Country
  className?: string
}

export default function FlagMark({ country, className = '' }: FlagMarkProps) {
  // Per instance, not per country: the same flag can appear twice on a page,
  // and two elements sharing an id is invalid and brittle — the second one's
  // clip would quietly resolve to the first.
  const clip = `flag-${useId()}`
  return (
    <svg
      viewBox="0 0 512 512"
      width="1em"
      height="1em"
      role="img"
      aria-label={NAMES[country]}
      className={`inline-block h-[0.9em] w-[0.9em] shrink-0 align-[-0.08em] ${className}`}
    >
      <defs>
        <clipPath id={clip}>
          <circle cx="256" cy="256" r="256" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>{FLAGS[country]}</g>
    </svg>
  )
}

/** Stripes from the top, alternating, filling the circle's full height. */
function stripes(count: number, colour: string) {
  const height = 512 / count
  return Array.from({ length: count }, (_, i) =>
    i % 2 === 0 ? <rect key={i} y={i * height} width="512" height={height} fill={colour} /> : null,
  )
}

/** One five-pointed star, point upwards. */
function star(cx: number, cy: number, radius: number) {
  const inner = radius * 0.382
  let d = ''
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? radius : inner
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const x = (cx + r * Math.cos(angle)).toFixed(1)
    const y = (cy + r * Math.sin(angle)).toFixed(1)
    d += `${i === 0 ? 'M' : 'L'}${x} ${y} `
  }
  return `${d}Z`
}

/**
 * The canton's fifty stars, in the flag's own arrangement: nine rows
 * alternating six and five, on an eleven-column grid.
 *
 * They are the reason this flag is drawn rather than served as a picture. At
 * the size these marks are shown a star is smaller than a pixel, so a photograph
 * of one resolves to a grey smear; as a path it stays a star at any size, and
 * softens into an even speckle rather than a smudge where it can't be resolved.
 */
function starField(width: number, height: number, radius: number) {
  let d = ''
  for (let row = 1; row <= 9; row++) {
    const count = row % 2 === 1 ? 6 : 5
    for (let i = 0; i < count; i++) {
      const column = row % 2 === 1 ? 1 + i * 2 : 2 + i * 2
      d += star((column * width) / 12, (row * height) / 10, radius)
    }
  }
  return d
}

const FLAGS: Record<Country, ReactNode> = {
  dk: (
    <>
      <rect width="512" height="512" fill="#c60c30" />
      {/* The cross sits toward the hoist, as it does on the flag itself. */}
      <rect x="196" width="76" height="512" fill="#fff" />
      <rect y="218" width="512" height="76" fill="#fff" />
    </>
  ),
  gr: (
    <>
      <rect width="512" height="512" fill="#fff" />
      {stripes(9, '#0d5eaf')}
      <rect width="290" height="290" fill="#0d5eaf" />
      <rect x="117" width="56" height="290" fill="#fff" />
      <rect y="117" width="290" height="56" fill="#fff" />
    </>
  ),
  us: (
    <>
      <rect width="512" height="512" fill="#fff" />
      {stripes(13, '#b22234' /* the flag's own red */)}
      <rect width="390" height="276" fill="#3c3b6e" />
      <path d={starField(390, 276, 12)} fill="#fff" />
    </>
  ),
  sct: (
    <>
      <rect width="512" height="512" fill="#0065bd" />
      <path
        d="M-40 20 L20 -40 L552 492 L492 552 Z M492 -40 L552 20 L20 552 L-40 492 Z"
        fill="#fff"
      />
    </>
  ),
}
