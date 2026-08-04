import { selectionFiles, collectionFiles } from './generated/photo-manifest'
import type { PhotoSettings } from './generated/photo-manifest'
import type { Project } from './projects'
import type { Collection, Placeholder } from './collections'

/**
 * A photo as the UI needs it, whether or not a real file exists yet.
 *
 * `aspect` is always set so a frame can be shaped and its space reserved before
 * anything loads. When `src` is present it came from an actual file under
 * public/photos and `aspect` is that file's true ratio; otherwise the gradient
 * in `color` stands in on its own.
 */
export interface DisplayPhoto {
  id: string
  /** width / height. >1 is landscape, <1 portrait. */
  aspect: number
  /** Gradient shown behind the image while it loads, or alone if there's no file. */
  color: string
  alt: string
  /** Compressed preview — what grids, covers and the pile display. */
  src?: string
  /** The web master, served whole when a photo is opened on its own page. */
  fullSrc?: string
  width?: number
  height?: number
  /** ISO, aperture and shutter, read from the file's own tags at build time. */
  settings?: PhotoSettings
}

/** Resolve the photo for a selections entry, falling back to its placeholder. */
export function selectionPhoto(project: Project): DisplayPhoto {
  const file = project.image ? selectionFiles[project.image] : undefined
  return {
    id: project.slug,
    aspect: file ? file.width / file.height : project.aspect,
    color: project.color,
    alt: project.title,
    src: file?.src,
    fullSrc: file?.fullSrc,
    width: file?.width,
    height: file?.height,
    // What the camera recorded, unless the entry overrides it by hand.
    settings: {
      ...file?.settings,
      ...(project.iso ? { iso: project.iso } : {}),
      ...(project.aperture ? { aperture: project.aperture } : {}),
      ...(project.shutter ? { shutter: project.shutter } : {}),
    },
  }
}

/**
 * Every photo in a collection. Real files win; until they're added the
 * hand-written placeholders keep the album populated.
 */
export function collectionPhotos(collection: Collection): DisplayPhoto[] {
  const files = collectionFiles[collection.slug]

  if (files?.length) {
    return files.map((file, i) => ({
      id: file.id,
      aspect: file.width / file.height,
      // Cycle the collection's placeholder gradients so each frame still has a
      // tinted backdrop while its file loads.
      color: tint(collection.placeholders, i),
      alt: `${collection.title} — photo ${i + 1}`,
      src: file.src,
      fullSrc: file.fullSrc,
      width: file.width,
      height: file.height,
    }))
  }

  return collection.placeholders.map((placeholder, i) => ({
    id: placeholder.id,
    aspect: placeholder.aspect,
    color: placeholder.color,
    alt: `${collection.title} — photo ${i + 1}`,
  }))
}

function tint(placeholders: Placeholder[], index: number): string {
  if (placeholders.length === 0) return 'from-neutral-700 to-neutral-900'
  return placeholders[index % placeholders.length].color
}
