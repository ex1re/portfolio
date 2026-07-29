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

  return (
    <PageTransition>
      <section className="min-h-screen px-6 pt-32 pb-20">
        <Link to="/garden" className="text-sm text-neutral-500 hover:text-neutral-200">
          ← Back
        </Link>
        <h1 className="mt-6 text-4xl font-semibold text-neutral-100">{project.title}</h1>
        <p className="mt-2 text-neutral-500">
          {project.category} — {project.year}
        </p>
        <div className="mt-10 max-w-3xl">
          <PhotoImage photo={selectionPhoto(project)} loading="eager" className="rounded-sm" />
        </div>
        <p className="mt-8 max-w-xl text-neutral-400">
          Replace this with a real gallery of images and project notes for {project.title}.
        </p>
      </section>
    </PageTransition>
  )
}
