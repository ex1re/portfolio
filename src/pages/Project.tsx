import { Link, useParams } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import PhotoImage from '../components/PhotoImage'
import { projects } from '../data/projects'
import { selectionPhoto } from '../data/photos'

export default function Project() {
  const { slug } = useParams()
  const project = projects.find((p) => p.slug === slug)

  if (!project) {
    return (
      <PageTransition>
        <section className="flex min-h-screen flex-col items-start justify-center px-6">
          <p className="text-neutral-400">Project not found.</p>
          <Link to="/garden" className="mt-4 text-sm text-neutral-100 underline">
            Back
          </Link>
        </section>
      </PageTransition>
    )
  }

  const photo = selectionPhoto(project)
  const upright = photo.aspect < 1
  // What the camera was set to, in one line, with anything unknown left out.
  const settings = [
    photo.settings?.iso && `ISO ${photo.settings.iso}`,
    photo.settings?.aperture && `f/${photo.settings.aperture}`,
    photo.settings?.shutter,
  ].filter(Boolean)

  return (
    <PageTransition>
      <section className="min-h-screen px-6 pt-32 pb-20">
        <Link to="/garden" className="text-sm text-neutral-500 hover:text-neutral-200">
          ← Back
        </Link>

        {/* The photograph is the page, so it sits in the middle with its
            settings above it and its name below — the way a print is captioned
            rather than the way a page is titled.

            An upright frame is measured against the screen's height instead of
            its width: at the same width as a landscape it stood half again
            taller than the window. */}
        <figure className="mt-10">
          {settings.length > 0 && (
            <figcaption className="mb-4 text-center text-sm tracking-wide text-neutral-500">
              {settings.join('  ·  ')}
            </figcaption>
          )}

          <div
            className={`mx-auto w-full ${upright ? '' : 'max-w-5xl'}`}
            style={upright ? { maxWidth: `calc(84vh * ${photo.aspect})` } : undefined}
          >
            {/* The one place a photo is shown large enough to look into, so it
                gets the web master itself rather than the preview the pile and
                the grids share — that one is cut for size, and its compression
                shows in a smooth sky. */}
            <PhotoImage photo={photo} loading="eager" full className="rounded-sm" />
          </div>

          <figcaption className="mt-5 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
            <h1 className="text-2xl font-semibold text-neutral-100">{project.title}</h1>
            <p className="text-sm text-neutral-500">
              {project.category} — {project.year}
            </p>
          </figcaption>
        </figure>
      </section>
    </PageTransition>
  )
}
