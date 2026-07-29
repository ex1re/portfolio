import { selectionFiles, collectionFiles } from './generated/photo-manifest'
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
  src?: string
  width?: number
  height?: number
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
    width: file?.width,
    height: file?.height,
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
