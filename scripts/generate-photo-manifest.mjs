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

/** Write (or reuse) the compressed preview for a photo; returns its URL. */
async function previewFor(absPath) {
  if (!sharp) return null

  const rel = relative(photosDir, absPath).replace(/\.[^.]+$/, '.webp')
  const outAbs = join(previewsDir, rel)
  wantedPreviews.add(outAbs)

  // Skip files already newer than their source, so repeat runs stay fast.
  if (existsSync(outAbs) && statSync(outAbs).mtimeMs >= statSync(absPath).mtimeMs) {
    return urlFor(outAbs)
  }

  mkdirSync(dirname(outAbs), { recursive: true })
  await sharp(absPath)
    // Bake in EXIF orientation so the preview isn't sideways.
    .rotate()
    .resize({
      width: PREVIEW_EDGE,
      height: PREVIEW_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: PREVIEW_QUALITY })
    .toFile(outAbs)

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

// The home page's centrepiece. Whatever sits in public/photos/home/ becomes it;
// if there's more than one file the first by name wins.
const [heroPath] = listImages(join(photosDir, 'home'))
const hero = heroPath ? await describe(heroPath) : null

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

/** The home page's opening photograph, or null until one is dropped in. */
export const heroFile: PhotoFile | null = ${JSON.stringify(hero, null, 2)}

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
