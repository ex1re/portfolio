import type { ReactNode } from 'react'
import type { DisplayPhoto } from '../data/photos'

interface PhotoImageProps {
  photo: DisplayPhoto
  /** Photos visible without scrolling should load eagerly; the rest lazily. */
  loading?: 'eager' | 'lazy'
  className?: string
  children?: ReactNode
}

/**
 * A frame shaped by its own photo.
 *
 * The wrapper carries the aspect ratio, so the space a photo will occupy is
 * reserved before the file loads — that's what keeps the scattered pile from
 * shifting around as images arrive. Because the ratio comes from the file's real
 * dimensions, `object-cover` fills the frame exactly without cropping anything.
 * The gradient sits behind as a load-time backdrop, and stands alone until a
 * file exists.
 */
export default function PhotoImage({
  photo,
  loading = 'lazy',
  className = '',
  children,
}: PhotoImageProps) {
  return (
    <div
      style={{ aspectRatio: String(photo.aspect) }}
      className={`relative w-full overflow-hidden bg-gradient-to-br ${photo.color} ${className}`}
    >
      {photo.src && (
        <img
          src={photo.src}
          width={photo.width}
          height={photo.height}
          alt={photo.alt}
          loading={loading}
          decoding="async"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {children}
    </div>
  )
}
