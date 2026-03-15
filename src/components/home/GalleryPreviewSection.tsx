import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useGalleryImages } from '@/hooks/useGalleryImages'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
}

export function GalleryPreviewSection() {
  const { data: images, isLoading } = useGalleryImages()
  const preview = images?.slice(0, 8) ?? []

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Gallery</h2>
          <p className="mt-3 text-muted-foreground">
            See the sauna in action.
          </p>
        </div>

        {isLoading ? (
          <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4"
          >
            {preview.map((img) => (
              <motion.div
                key={img.id}
                variants={item}
                className="group overflow-hidden rounded-xl"
              >
                <img
                  src={img.url}
                  alt={img.alt_text ?? ''}
                  className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/gallery"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            View Full Gallery <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
