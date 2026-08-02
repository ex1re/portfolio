/**
 * Builds the favicon from the logo mark.
 *
 * The source SVG sets "ex" as a <text> element in Pinyon Script. A favicon
 * can't pull in a webfont, so anywhere the face isn't installed — which is
 * almost everywhere — it would fall back to a default serif and lose the
 * script entirely. This converts the lettering to outlines so the file stands
 * on its own, then renders the PNG sizes that browsers still ask for.
 *
 * Usage: node scripts/build-favicon.mjs <font.ttf>
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import opentype from 'opentype.js'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')

// Matches the supplied logo: a hairline ring with the mark centred inside.
const SIZE = 1024
const INK = '#111111'
const PAPER = '#faf9f7'
// Weights are set for a favicon, not for the logo at full size: the artwork's
// 14-unit ring lands under a third of a pixel at 16px and greys out, and the
// script's hairlines disappear with it. These were picked by rendering the
// candidates at 16, 32 and 48px — heavier than this and the counters in the
// "e" start to close up.
// The radius shrinks as the ring thickens so the outer edge stays where the
// artwork put it — a stroke is centred on its path, so keeping r at 499 would
// push the ring past the viewBox and flatten it against the sides.
const RING = { cx: 512, cy: 512, r: 480, width: 52 }
const GLYPH_WEIGHT = 26
const TEXT = { value: 'ex', x: 252, y: 616, fontSize: 627 }

const fontPath = process.argv[2]
if (!fontPath) {
  console.error('usage: node scripts/build-favicon.mjs <font.ttf>')
  process.exit(1)
}

const font = opentype.parse(
  new Uint8Array(readFileSync(fontPath)).buffer.slice(0),
)

const glyphPath = font.getPath(TEXT.value, TEXT.x, TEXT.y, TEXT.fontSize)
const d = glyphPath.toPathData(3)
if (!d || d.length < 32) throw new Error('font produced no outline for the mark')

// The ring and the lettering need separate rules: a blanket `fill` would beat
// the ring's fill="none" attribute, since CSS outranks presentation attributes,
// and flood the circle solid.
const mark = `<circle cx="${RING.cx}" cy="${RING.cy}" r="${RING.r}" stroke-width="${RING.width}" class="ring"/>
  <path d="${d}" class="glyph"/>`

// The lettering is thickened by stroking the outline in its own colour, which
// widens every stroke of the script evenly. Round joins keep the flourishes
// from developing spikes where the contours meet at sharp angles.
const palette = (ink) =>
  `.ring { fill: none; stroke: ${ink}; } ` +
  `.glyph { fill: ${ink}; stroke: ${ink}; stroke-width: ${GLYPH_WEIGHT}; ` +
  `stroke-linejoin: round; stroke-linecap: round; }`

// The mark is near-black on nothing, so on a dark tab strip it would sit
// invisible. Browsers apply an SVG icon's own media query, so it inverts itself.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <style>
    ${palette(INK)}
    @media (prefers-color-scheme: dark) { ${palette(PAPER)} }
  </style>
  ${mark}
</svg>
`

writeFileSync(join(publicDir, 'favicon.svg'), svg)

// The PNG fallbacks can't adapt, so they carry a light disc behind the mark:
// legible on either tab colour, and round rather than a pasted-on square.
const opaque = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <style>${palette(INK)}</style>
  <circle cx="${RING.cx}" cy="${RING.cy}" r="${RING.r}" fill="${PAPER}"/>
  ${mark}
</svg>
`

const png = (size, name) =>
  sharp(Buffer.from(opaque)).resize(size, size).png().toFile(join(publicDir, name))

await png(96, 'favicon-96.png')
// iOS composites a touch icon onto black if it has any transparency.
await sharp(Buffer.from(opaque))
  .resize(180, 180)
  .flatten({ background: PAPER })
  .png()
  .toFile(join(publicDir, 'apple-touch-icon.png'))

console.log(`favicon.svg (outlined, ${svg.length} bytes) · favicon-96.png · apple-touch-icon.png`)
