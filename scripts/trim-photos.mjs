/**
 * Cuts web masters from camera files, in place.
 *
 * A photo off the camera is 10-25 MB. The site never serves anything near that
 * — previews are 1200px and the lightbox caps at 768px wide — but every one of
 * those megabytes would be committed to the repo forever and copied into every
 * deploy. This resizes the long edge to 2400px, which is still well above
 * anything shown, and copies the untouched original to ~/Pictures/exire-originals
 * first so nothing is lost.
 *
 * public/photos/home is left alone on purpose: the home page's fade is cut from
 * the original at full resolution.
 *
 *   npm run trim          # every folder that needs it
 *   npm run trim -- --dry # say what it would do, change nothing
 */
import { readdirSync, statSync, existsSync, mkdirSync, copyFileSync, renameSync } from 'node:fs'
import { join, relative, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import sharp from 'sharp'

/** Long edge of a web master, in px. */
const EDGE = 2400
const QUALITY = 92
const ARCHIVE = join(homedir(), 'Pictures', 'exire-originals')

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const photosDir = join(root, 'public', 'photos')
const SKIP = new Set(['previews', 'home'])
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
const dry = process.argv.includes('--dry')

function* walk(dir) {
  if (!existsSync(dir)) return
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || SKIP.has(name)) continue
    const abs = join(dir, name)
    if (statSync(abs).isDirectory()) yield* walk(abs)
    else if (EXTENSIONS.has(extname(name).toLowerCase())) yield abs
  }
}

let trimmed = 0
let saved = 0

for (const abs of walk(photosDir)) {
  const meta = await sharp(abs).metadata()
  const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0)
  if (longEdge <= EDGE) continue

  const rel = relative(photosDir, abs)
  const before = statSync(abs).size
  if (dry) {
    console.log(`would trim ${rel} (${longEdge}px, ${(before / 1048576).toFixed(1)} MB)`)
    trimmed++
    continue
  }

  const kept = join(ARCHIVE, rel)
  if (!existsSync(kept)) {
    mkdirSync(dirname(kept), { recursive: true })
    copyFileSync(abs, kept)
  }

  const tmp = join(dirname(abs), `.trim-${Date.now()}`)
  await sharp(kept)
    // EXIF orientation is baked in here, so the file on disk is upright.
    .rotate()
    .resize({ width: EDGE, height: EDGE, fit: 'inside', withoutEnlargement: true })
    // Keep the camera's own tags: the build reads ISO, aperture and shutter
    // back out of these, so stripping them would mean typing them in by hand.
    .withMetadata()
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(tmp)
  renameSync(tmp, abs)

  const after = statSync(abs).size
  trimmed++
  saved += before - after
  console.log(`${rel}: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1024).toFixed(0)} KB`)
}

if (!trimmed) console.log('nothing to trim: every photo is already 2400px or smaller')
else if (dry) console.log(`\n${trimmed} file(s) would be trimmed. Run \`npm run trim\` to do it.`)
else console.log(`\ntrimmed ${trimmed} file(s), saving ${(saved / 1048576).toFixed(0)} MB. Originals kept in ${ARCHIVE}`)
