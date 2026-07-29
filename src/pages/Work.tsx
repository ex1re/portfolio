import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import { projects } from '../data/projects'
import { collections } from '../data/collections'

const rotations = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', 'rotate-0', '-rotate-3', 'rotate-0']
const offsets = ['', '-mt-6', 'mt-4', '-mt-3', 'mt-6', '-mt-8', 'mt-2']

export default function Work() {
  return (
    <PageTransition>
      <section className="px-6 pt-32 pb-20">
        <h1 className="mb-10 text-sm tracking-wide text-neutral-500">selections</h1>
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
          {projects.map((project, i) => (
            <motion.div
              key={project.slug}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
              className={`group relative mb-4 break-inside-avoid ${offsets[i % offsets.length]} ${rotations[i % rotations.length]} transition-transform duration-300 hover:z-20 hover:rotate-0 hover:scale-105`}
            >
              <Link to={`/garden/${project.slug}`} className="block">
                <div
                  style={{ aspectRatio: String(project.aspect) }}
                  className={`w-full rounded-sm bg-gradient-to-br ${project.color} shadow-lg shadow-black/40`}
                />
                <div className="mt-2 flex items-baseline justify-between opacity-0 transition-opacity group-hover:opacity-100">
                  <h2 className="text-sm text-neutral-100">{project.title}</h2>
                  <span className="text-xs text-neutral-500">{project.year}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-6 pt-4 pb-24">
        <h2 className="mb-10 text-sm tracking-wide text-neutral-500">collections</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection, i) => (
            <motion.div
              key={collection.slug}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
            >
              <Link to={`/garden/collections/${collection.slug}`} className="group block">
                <div
                  className={`aspect-[4/3] w-full rounded-sm bg-gradient-to-br ${collection.color} transition-transform duration-300 group-hover:scale-[1.02]`}
                />
                <div className="mt-3">
                  <h3 className="text-base text-neutral-100">{collection.title}</h3>
                  <p className="text-sm text-neutral-500">{collection.photos.length} photos</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </PageTransition>
  )
}
