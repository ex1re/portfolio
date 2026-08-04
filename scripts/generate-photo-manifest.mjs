/**
 * Prepares everything in public/photos for the site:
 *
 *  1. Reads each file's real pixel dimensions (EXIF orientation applied), so
 *     frames can be shaped and their space reserved before anything loads.
 *  2. Writes a compressed preview of each photo, used for the pile, the album
 *     grids and the covers. Only the lightbox loads the full-size file.
 *  3. Emits both, plus dimensions, to src/data/generated/photo-manifest.ts.
 *
 * You drop one full-resolution file per photo; the preview is derived.
 *
 * Layout:
 *   public/photos/home/<name>.jpg                -> the home page's centrepiece
 *   public/photos/selections/<name>.jpg          -> referenced by `image` in projects.ts
 *   public/photos/collections/<slug>/<name>.jpg  -> becomes that collection's photos
 *   public/photos/previews/...                   -> generated, git-ignored
 *
 * Files are ordered by filename, so prefix them (01-, 02-, ...) to control order.
 * Run via `npm run photos`; also runs automatically before `dev` and `build`.
 */
import {
  readdirSync,
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  statSync,
  rmSync,
} from 'node:fs'
import { join, relative, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { imageSize } from 'image-size'

/** Long edge of a generated preview, in px. Covers the widest grid slot at 2x. */
const PREVIEW_EDGE = 1200
const PREVIEW_QUALITY = 78

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const photosDir = join(publicDir, 'photos')
const previewsDir = join(photosDir, 'previews')
const outFile = join(root, 'src', 'data', 'generated', 'photo-manifest.ts')

const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'])

// Previews are a nicety, not a requirement: if sharp can't load (native binary,
// unfamiliar platform) fall back to serving the full file everywhere rather than
// failing the build.
let sharp = null
try {
  sharp = (await import('sharp')).default
} catch {
  console.warn('photo manifest: sharp unavailable, serving full-size files as previews')
}

function listImages(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => !name.startsWith('.'))
    .filter((name) => EXTENSIONS.has(extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
    .map((name) => join(dir, name))
}

function listDirs(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => !name.startsWith('.'))
    .filter((name) => statSync(join(dir, name)).isDirectory())
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
}

/** Everything under public/ is served from the site root. */
function urlFor(absPath) {
  return '/' + relative(publicDir, absPath).split(/[\\/]/).join('/')
}

/**
 * Dimensions as displayed. A camera JPEG can carry an EXIF orientation that
 * swaps width and height, so a portrait shot reports landscape until it's
 * applied -- which would shape the frame wrongly.
 */
async function dimensionsOf(absPath) {
  if (sharp) {
    const meta = await sharp(absPath).metadata()
    const swap = typeof meta.orientation === 'number' && meta.orientation >= 5
    return {
      width: swap ? meta.height : meta.width,
      height: swap ? meta.width : meta.height,
    }
  }
  const { width, height } = imageSize(readFileSync(absPath))
  return { width, height }
}

const wantedPreviews = new Set()

/** Write (or reuse) one resized copy of a photo; returns its URL. */
async function renditionFor(absPath, edge, quality, suffix = '') {
  if (!sharp) return null

  const rel = relative(photosDir, absPath).replace(/\.[^.]+$/, `${suffix}.webp`)
  const outAbs = join(previewsDir, rel)
  wantedPreviews.add(outAbs)

  // Skip files already newer than their source, so repeat runs stay fast.
  if (existsSync(outAbs) && statSync(outAbs).mtimeMs >= statSync(absPath).mtimeMs) {
    return urlFor(outAbs)
  }

  mkdirSync(dirname(outAbs), { recursive: true })
  await sharp(absPath)
    // Bake in EXIF orientation so the copy isn't sideways.
    .rotate()
    .resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toFile(outAbs)

  return urlFor(outAbs)
}

const previewFor = (absPath) => renditionFor(absPath, PREVIEW_EDGE, PREVIEW_QUALITY)

/** The page's own background: what the picture's edges are blended into. */
const PAGE_BG = [10, 10, 10]
/** A pixel this bright is the subject, and is never touched by the fade. */
const SUBJECT_LUMA = 50
/** How much of the clear margin the fade uses, leaving the rest as headroom. */
const FADE_REACH = 0.95

const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b

/** Smootherstep: zero first and second derivative at both ends, so the fade
 *  arrives and departs without a corner. A corner is what the eye finds. */
const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (t * (t * 6 - 15) + 10))

/**
 * Deterministic dither, ±half a level. Rounding a smooth ramp to 8 bits lays
 * down flat steps — the rings — and a little noise under the rounding breaks
 * them up. Seeded from the pixel's own position so a rebuild is byte-identical.
 */
function dither(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return (n - Math.floor(n)) - 0.5
}

/**
 * How far in from each edge the picture can be faded without touching the
 * subject: the smaller clear margin on each axis, less a little headroom.
 */
function fadeBands(data, width, height) {
  let left = width, right = 0, top = height, bottom = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3
      if (luma(data[i], data[i + 1], data[i + 2]) < SUBJECT_LUMA) continue
      if (x < left) left = x
      if (x > right) right = x
      if (y < top) top = y
      if (y > bottom) bottom = y
    }
  }
  if (right < left) return { x: 0.12, y: 0.12 }
  return {
    x: (Math.min(left, width - 1 - right) / width) * FADE_REACH,
    y: (Math.min(top, height - 1 - bottom) / height) * FADE_REACH,
  }
}

/**
 * Writes a copy of the hero with the fade blended into the pixels themselves,
 * rather than masked over them at display time.
 *
 * A CSS mask is composited live and lands on whatever the browser's compositor
 * decides: over a wide band in near-black, its quantised alpha resolves into
 * visible rings. Blending once, here, in floating point and with the rounding
 * dithered, leaves the picture's border exactly the page's colour and nothing
 * in between for the eye to catch.
 */
async function blendedHeroFor(absPath, edge, quality, suffix) {
  if (!sharp) return null

  const rel = relative(photosDir, absPath).replace(/\.[^.]+$/, `${suffix}.webp`)
  const outAbs = join(previewsDir, rel)
  wantedPreviews.add(outAbs)

  if (existsSync(outAbs) && statSync(outAbs).mtimeMs >= statSync(absPath).mtimeMs) {
    return urlFor(outAbs)
  }

  const { data, info } = await sharp(absPath)
    .rotate()
    .resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height } = info
  const band = fadeBands(data, width, height)
  const out = Buffer.allocUnsafe(data.length)

  for (let y = 0; y < height; y++) {
    const v = y / (height - 1)
    const fadeY = ease(Math.min(v, 1 - v) / band.y)
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1)
      const alpha = fadeY * ease(Math.min(u, 1 - u) / band.x)
      const i = (y * width + x) * 3
      if (alpha >= 1) {
        out[i] = data[i]
        out[i + 1] = data[i + 1]
        out[i + 2] = data[i + 2]
        continue
      }
      const noise = dither(x, y)
      for (let k = 0; k < 3; k++) {
        const value = PAGE_BG[k] + (data[i + k] - PAGE_BG[k]) * alpha + noise
        out[i + k] = value < 0 ? 0 : value > 255 ? 255 : Math.round(value)
      }
    }
  }

  mkdirSync(dirname(outAbs), { recursive: true })
  await sharp(out, { raw: { width, height, channels: 3 } }).webp({ quality }).toFile(outAbs)

  return urlFor(outAbs)
}

async function describe(absPath) {
  const { width, height } = await dimensionsOf(absPath)
  if (!width || !height) {
    throw new Error(`Could not read dimensions from ${relative(root, absPath)}`)
  }
  const fullSrc = urlFor(absPath)
  const preview = await previewFor(absPath)
  return { src: preview ?? fullSrc, fullSrc, width, height }
}

/**
 * The home page's centrepiece. Whatever sits in public/photos/home/ becomes it;
 * if there's more than one file the first by name wins.
 *
 * It's the only photo shown large, so it gets its own pair of renditions rather
 * than the standard preview: one for ordinary displays, one for retina. The
 * camera original is never served — it's only the master these are cut from.
 *
 * Both are cut straight from that original at a quality where the encoder has
 * no visible say in the picture. The retina one is far larger than any screen
 * needs it to be, deliberately: this photograph is nearly all shadow, where
 * compression shows first, and it is the one image on the site that carries the
 * page on its own.
 */
const HERO_EDGE = 1600
const HERO_EDGE_2X = 3000
const HERO_QUALITY = 94

/** The width sharp will land on: fit inside, never enlarged. */
const widthAtEdge = (width, height, edge) =>
  Math.round(width * Math.min(1, edge / Math.max(width, height)))

async function describeHero(absPath) {
  const { width, height } = await dimensionsOf(absPath)
  if (!width || !height) {
    throw new Error(`Could not read dimensions from ${relative(root, absPath)}`)
  }
  const fallback = urlFor(absPath)
  return {
    src: (await blendedHeroFor(absPath, HERO_EDGE, HERO_QUALITY, '-1x')) ?? fallback,
    srcWidth: widthAtEdge(width, height, HERO_EDGE),
    src2x: (await blendedHeroFor(absPath, HERO_EDGE_2X, HERO_QUALITY, '-2x')) ?? fallback,
    src2xWidth: widthAtEdge(width, height, HERO_EDGE_2X),
    width,
    height,
  }
}

const [heroPath] = listImages(join(photosDir, 'home'))
const hero = heroPath ? await describeHero(heroPath) : null

const selections = {}
for (const file of listImages(join(photosDir, 'selections'))) {
  const name = file.split(/[\\/]/).pop()
  selections[name] = await describe(file)
}

const collections = {}
for (const slug of listDirs(join(photosDir, 'collections'))) {
  const files = listImages(join(photosDir, 'collections', slug))
  if (files.length === 0) continue
  collections[slug] = []
  for (const file of files) {
    collections[slug].push({
      id: `${slug}/${file.split(/[\\/]/).pop()}`,
      ...(await describe(file)),
    })
  }
}

/** Drop previews whose source photo is gone, so builds don't ship dead files. */
function pruneStalePreviews(dir) {
  if (!existsSync(dir)) return
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name)
    if (statSync(abs).isDirectory()) {
      pruneStalePreviews(abs)
      if (readdirSync(abs).length === 0) rmSync(abs, { recursive: true })
    } else if (!wantedPreviews.has(abs)) {
      rmSync(abs)
    }
  }
}
pruneStalePreviews(previewsDir)

const body = `// AUTO-GENERATED by scripts/generate-photo-manifest.mjs -- do not edit by hand.
// Regenerate with \`npm run photos\` (also runs before \`npm run dev\`/\`build\`).

/**
 * An image file on disk.
 *
 * \`src\` is the compressed preview used everywhere a photo appears in a grid or
 * the pile; \`fullSrc\` is the original, loaded only by the lightbox. \`width\` and
 * \`height\` are the full photo's displayed dimensions -- the preview shares the
 * same ratio, which is all the frames need.
 */
export interface PhotoFile {
  src: string
  fullSrc: string
  width: number
  height: number
}

export interface CollectionPhotoFile extends PhotoFile {
  id: string
}

/**
 * The home page's opening photograph, or null until one is dropped into
 * public/photos/home/. Two renditions of the same picture, each with its own
 * pixel width so the browser can pick on what the slot actually asks for;
 * \`width\` and \`height\` are the original's, which is never served.
 */
export interface HeroFile {
  src: string
  srcWidth: number
  src2x: string
  src2xWidth: number
  width: number
  height: number
}

export const heroFile: HeroFile | null = ${JSON.stringify(hero, null, 2)}

/** Keyed by filename, e.g. \`coastline.jpg\`, as referenced from projects.ts. */
export const selectionFiles: Record<string, PhotoFile> = ${JSON.stringify(selections, null, 2)}

/** Keyed by collection slug, in filename order. */
export const collectionFiles: Record<string, CollectionPhotoFile[]> = ${JSON.stringify(collections, null, 2)}
`

mkdirSync(dirname(outFile), { recursive: true })
writeFileSync(outFile, body)

const collectionPhotoCount = Object.values(collections).reduce((n, list) => n + list.length, 0)
console.log(
  `photo manifest: ${hero ? '1 hero, ' : 'no hero, '}` +
    `${Object.keys(selections).length} selection(s), ` +
    `${collectionPhotoCount} photo(s) across ${Object.keys(collections).length} collection(s)` +
    (sharp ? `, ${wantedPreviews.size} preview(s)` : ''),
)
