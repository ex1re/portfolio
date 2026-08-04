import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import SiteFooter from '../components/SiteFooter'
import Lightbox from '../components/Lightbox'
import PhotoImage from '../components/PhotoImage'
import { collections } from '../data/collections'
import { collectionPhotos } from '../data/photos'

export default function CollectionDetail() {
  const { slug } = useParams()
  const collection = collections.find((c) => c.slug === slug)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const photos = collection ? collectionPhotos(collection) : []

  if (!collection) {
    return (
      <PageTransition>
        <section className="flex min-h-screen flex-col items-start justify-center px-6">
          <p className="text-neutral-400">Collection not found.</p>
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
        <h1 className="mt-6 text-4xl font-semibold text-neutral-100">{collection.title}</h1>
        <p className="mt-2 max-w-xl text-neutral-400">{collection.description}</p>

        <div className="mt-10 columns-2 gap-4 sm:columns-3">
          {photos.map((photo, i) => (
            <motion.button
              key={photo.id}
              type="button"
              onClick={() => setOpenIndex(i)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: 'easeOut' }}
              aria-label={`Open ${photo.alt}`}
              className="mb-4 block w-full break-inside-avoid transition-transform duration-300 hover:scale-[1.02]"
            >
              <PhotoImage photo={photo} loading={i < 6 ? 'eager' : 'lazy'} className="rounded-sm" />
            </motion.button>
          ))}
        </div>
      </section>

      <SiteFooter />

      {openIndex !== null && (
        <Lightbox
          photos={photos}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </PageTransition>
  )
}
