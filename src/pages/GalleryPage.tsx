import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SITE_NAME, fullUrl, DEFAULT_OG_IMAGE } from '@/lib/site-config'
import { motion } from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGalleryImages } from '@/hooks/useGalleryImages'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  'All',
  'Exterior',
  'Interior',
  'Events',
  'Scenery',
  'Cold Plunge',
] as const

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.35 } },
}

export default function GalleryPage() {
  const { data: images, isLoading } = useGalleryImages()
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  const filtered = useMemo(() => {
    if (!images) return []
    if (activeCategory === 'All') return images
    return images.filter(
      (img) => img.category.toLowerCase() === activeCategory.toLowerCase()
    )
  }, [images, activeCategory])

  const slides = filtered.map((img) => ({
    src: img.url,
    alt: img.alt_text ?? '',
    title: img.caption ?? undefined,
  }))

  return (
    <>
      <Helmet>
        <title>Gallery — {SITE_NAME}</title>
        <meta
          name="description"
          content="See our mobile sauna in action — from backyard retreats to lakeside escapes. Browse exterior, interior, event, and scenery photos."
        />
        <meta property="og:title" content={`Gallery — ${SITE_NAME}`} />
        <meta
          property="og:description"
          content="See our mobile sauna in action — from backyard retreats to lakeside escapes. Browse exterior, interior, event, and scenery photos."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={fullUrl('/gallery')} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={fullUrl('/gallery')} />
      </Helmet>

      <div className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold md:text-5xl">Gallery</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              See the sauna in action — from backyard retreats to lakeside
              escapes.
            </p>
          </motion.div>

          {/* Filter Tabs */}
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-medium transition-all',
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Image Grid */}
          {isLoading ? (
            <div className="mt-12 columns-2 gap-3 space-y-3 md:columns-3 lg:columns-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="w-full rounded-xl"
                  style={{ height: `${200 + (i % 3) * 80}px` }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="mt-16 text-center text-muted-foreground">
              No images in this category yet.
            </p>
          ) : (
            <motion.div
              key={activeCategory}
              variants={container}
              initial="hidden"
              animate="show"
              className="mt-12 columns-2 gap-3 space-y-3 md:columns-3 lg:columns-4"
            >
              {filtered.map((img, i) => (
                <motion.div
                  key={img.id}
                  variants={item}
                  className="group relative cursor-pointer break-inside-avoid overflow-hidden rounded-xl"
                  onClick={() => setLightboxIndex(i)}
                >
                  <img
                    src={img.url}
                    alt={img.alt_text ?? ''}
                    width={400}
                    height={300}
                    loading="lazy"
                    decoding="async"
                    className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {img.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="text-sm text-white">{img.caption}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Lightbox */}
          <Lightbox
            open={lightboxIndex >= 0}
            close={() => setLightboxIndex(-1)}
            index={lightboxIndex}
            slides={slides}
          />

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="mt-20 rounded-2xl bg-primary p-10 text-center text-primary-foreground md:p-16"
          >
            <h2 className="text-3xl font-bold md:text-4xl">
              Ready to Book?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Experience it for yourself — we handle everything.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-12 bg-accent px-8 text-base text-accent-foreground hover:bg-accent/90"
            >
              <Link to="/book">Book Now</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </>
  )
}
