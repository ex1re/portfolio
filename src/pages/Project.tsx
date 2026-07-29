import { Link, useParams } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import { projects } from '../data/projects'

export default function Project() {
  const { slug } = useParams()
  const project = projects.find((p) => p.slug === slug)

  if (!project) {
    return (
      <PageTransition>
        <section className="flex min-h-screen flex-col items-start justify-center px-6">
          <p className="text-neutral-400">Project not found.</p>
          <Link to="/work" className="mt-4 text-sm text-neutral-100 underline">
            Back to work
          </Link>
        </section>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <section className="min-h-screen px-6 pt-32 pb-20">
        <Link to="/work" className="text-sm text-neutral-500 hover:text-neutral-200">
          ← Back to work
        </Link>
        <h1 className="mt-6 text-4xl font-semibold text-neutral-100">{project.title}</h1>
        <p className="mt-2 text-neutral-500">
          {project.category} — {project.year}
        </p>
        <div className={`mt-10 aspect-video w-full rounded-sm bg-gradient-to-br ${project.color}`} />
        <p className="mt-8 max-w-xl text-neutral-400">
          Replace this with a real gallery of images and project notes for {project.title}.
        </p>
      </section>
    </PageTransition>
  )
}
