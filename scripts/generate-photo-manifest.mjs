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

/** The page's own background, and so the picture's own black. */
const PAGE_BG = 10
/**
 * Everything at or below this tone becomes that background exactly.
 *
 * This is the whole trick, and it is tonal rather than geometric: a night frame
 * has no edge to hide, it has a sky a few levels off the page. Crush that sky to
 * the page's colour and the picture simply has no border — there is nothing
 * there to see, at any brightness, in any corner. Masking the edges instead is
 * what produced every ring: a fade can only soften a boundary, and the boundary
 * was never at the edge.
 *
 * Raise it if a lighter sky still shows as a rectangle; lower it if the subject
 * is losing shadow detail it should keep. The run prints what it cost.
 */
const HERO_BLACK_POINT = 30

/**
 * Deterministic dither, ±half a level. Stretching what's left of the range
 * leaves gaps between neighbouring output values, and rounding into them lays
 * down flat steps; a little noise underneath breaks those up. Seeded from the
 * pixel's own position, so a rebuild is byte-identical.
 */
function dither(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return n - Math.floor(n) - 0.5
}

/**
 * Writes the hero with its black point set to the page's own colour, so the
 * photograph's background and the page's background are the same thing.
 *
 * Everything above the black point is stretched back up to fill the range, so
 * the picture keeps its full contrast rather than being dimmed into the page.
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
  const out = Buffer.allocUnsafe(data.length)
  const gain = (255 - PAGE_BG) / (255 - HERO_BLACK_POINT)
  let flattened = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3
      const noise = dither(x, y)
      for (let k = 0; k < 3; k++) {
        const source = data[i + k]
        if (source <= HERO_BLACK_POINT) {
          out[i + k] = PAGE_BG
          flattened++
          continue
        }
        const value = PAGE_BG + (source - HERO_BLACK_POINT) * gain + noise
        out[i + k] = value < 0 ? 0 : value > 255 ? 255 : Math.round(value)
      }
    }
  }

  mkdirSync(dirname(outAbs), { recursive: true })
  await sharp(out, { raw: { width, height, channels: 3 } }).webp({ quality }).toFile(outAbs)

  const share = ((100 * flattened) / (width * height * 3)).toFixed(1)
  console.log(`  hero ${width}x${height}: ${share}% of it is now the page's own black`)

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

// A camera file dropped straight in works, but it is committed at full weight
// and the lightbox hands visitors the whole thing. Say so rather than let it
// pass quietly. The home photograph is exempt: its fade is cut from the
// original at full resolution on purpose.
const oversized = []
for (const dir of ['selections', 'collections']) {
  const scan = (d) => {
    if (!existsSync(d)) return
    for (const name of readdirSync(d)) {
      if (name.startsWith('.')) continue
      const abs = join(d, name)
      if (statSync(abs).isDirectory()) scan(abs)
      else if (EXTENSIONS.has(extname(name).toLowerCase()) && statSync(abs).size > 3_000_000) {
        oversized.push({ rel: relative(photosDir, abs), mb: statSync(abs).size / 1048576 })
      }
    }
  }
  scan(join(photosDir, dir))
}
if (oversized.length) {
  const total = oversized.reduce((n, f) => n + f.mb, 0)
  console.warn(
    `\nphoto manifest: ${oversized.length} file(s) are camera-sized, ${total.toFixed(0)} MB in all:\n` +
      oversized.map((f) => `  ${f.rel} (${f.mb.toFixed(1)} MB)`).join('\n') +
      '\nRun `npm run trim` to cut web masters from them (originals are kept in ~/Pictures/exire-originals).\n',
  )
}

const collectionPhotoCount = Object.values(collections).reduce((n, list) => n + list.length, 0)
console.log(
  `photo manifest: ${hero ? '1 hero, ' : 'no hero, '}` +
    `${Object.keys(selections).length} selection(s), ` +
    `${collectionPhotoCount} photo(s) across ${Object.keys(collections).length} collection(s)` +
    (sharp ? `, ${wantedPreviews.size} preview(s)` : ''),
)
