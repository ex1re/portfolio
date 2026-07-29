import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import { projects } from '../data/projects'

export default function Work() {
  return (
    <PageTransition>
      <section className="min-h-screen px-6 pt-32 pb-20">
        <h1 className="mb-10 text-sm tracking-wide text-neutral-500">SELECTED WORK</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <motion.div
              key={project.slug}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
            >
              <Link to={`/work/${project.slug}`} className="group block">
                <div
                  className={`aspect-[4/5] w-full rounded-sm bg-gradient-to-br ${project.color} transition-transform duration-300 group-hover:scale-[1.02]`}
                />
                <div className="mt-3 flex items-baseline justify-between">
                  <h2 className="text-base text-neutral-100">{project.title}</h2>
                  <span className="text-xs text-neutral-500">{project.year}</span>
                </div>
                <p className="text-sm text-neutral-500">{project.category}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </PageTransition>
  )
}
