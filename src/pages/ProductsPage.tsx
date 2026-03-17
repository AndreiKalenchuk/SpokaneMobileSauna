import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SITE_NAME, fullUrl, DEFAULT_OG_IMAGE } from '@/lib/site-config'
import { motion } from 'framer-motion'
import {
  Users,
  Flame,
  TreePine,
  Droplets,
  Ruler,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useProducts } from '@/hooks/useProducts'
import type { Product } from '@/types'

const primarySpecs = [
  { icon: Users, label: '6 Adults', detail: 'Comfortable seating' },
  { icon: Flame, label: 'Wood-Fired', detail: 'Authentic heat up to 190°F' },
  { icon: TreePine, label: 'Western Red Cedar', detail: 'Premium interior' },
  { icon: Droplets, label: 'Bucket & Ladle', detail: 'Traditional löyly' },
  { icon: Ruler, label: "8' × 12' Trailer", detail: 'Fits most driveways' },
  { icon: Sparkles, label: 'LED Mood Lighting', detail: 'Ambient atmosphere' },
]

const placeholderImages = [
  'https://images.unsplash.com/photo-1554244933-d876deb6b2ff?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80',
]

function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [current, setCurrent] = useState(0)
  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1))
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1))

  return (
    <div className="group relative overflow-hidden rounded-2xl">
      <img
        src={images[current]}
        alt={alt}
        width={1200}
        height={900}
        className="aspect-[4/3] w-full object-cover transition-transform duration-500"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/60 group-hover:opacity-100"
            aria-label="Previous image"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/60 group-hover:opacity-100"
            aria-label="Next image"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`size-2 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'bg-white/50'}`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <img
        src={product.image_url ?? placeholderImages[0]}
        alt={product.name}
        width={400}
        height={300}
        loading="lazy"
        decoding="async"
        className="aspect-[4/3] w-full object-cover"
      />
      <CardContent className="p-5">
        <h3 className="text-lg font-bold">{product.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {product.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xl font-bold text-primary">
            ${product.base_price}
            <span className="text-sm font-normal text-muted-foreground">
              /day
            </span>
          </p>
          <Button asChild size="sm">
            <Link to="/book">Book Now</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AddonCard({ product }: { product: Product }) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <img
        src={product.image_url ?? placeholderImages[0]}
        alt={product.name}
        width={400}
        height={400}
        loading="lazy"
        decoding="async"
        className="aspect-square w-full object-cover"
      />
      <CardContent className="p-4">
        <h3 className="font-semibold">{product.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>
        <p className="mt-3 text-sm font-bold text-primary">
          +${product.base_price.toFixed(2)}
        </p>
      </CardContent>
    </Card>
  )
}

function ProductsSkeleton() {
  return (
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="grid grid-cols-2 gap-3 pt-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Skeleton key={n} className="h-16 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-80 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const { data: products, isLoading } = useProducts()

  const primary = products?.find((p) => p.type === 'primary')
  const standalone = products?.filter((p) => p.type === 'standalone') ?? []
  const addons = products?.filter((p) => p.type === 'addon') ?? []

  return (
    <>
      <Helmet>
        <title>Our Rentals — {SITE_NAME}</title>
        <meta
          name="description"
          content="Explore our mobile sauna and add-on rentals. Premium wood-fired sauna, cold plunge tub, firewood bundles, venik, essential oils."
        />
        <meta property="og:title" content={`Our Rentals — ${SITE_NAME}`} />
        <meta
          property="og:description"
          content="Explore our mobile sauna and add-on rentals. Premium wood-fired sauna, cold plunge tub, firewood bundles, and more."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={fullUrl('/products')} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={fullUrl('/products')} />
        {!isLoading && products && products.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': products.map((p) => ({
                '@type': 'Product',
                name: p.name,
                description: p.description,
                image: p.image_url
                  ? p.image_url.startsWith('http')
                    ? p.image_url
                    : fullUrl(p.image_url)
                  : undefined,
                offers: {
                  '@type': 'Offer',
                  price: p.base_price,
                  priceCurrency: 'USD',
                  availability: 'https://schema.org/InStock',
                },
              })),
            })}
          </script>
        )}
      </Helmet>

      {isLoading ? (
        <ProductsSkeleton />
      ) : (
        <div>
          {/* Hero — Primary Product */}
          {primary && (
            <section className="py-16 md:py-24">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid items-center gap-12 md:grid-cols-2">
                  <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <ImageCarousel
                      images={
                        primary.image_url
                          ? [primary.image_url, ...placeholderImages.slice(1)]
                          : placeholderImages
                      }
                      alt={primary.name}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <Badge className="mb-4">Featured Rental</Badge>
                    <h1 className="text-4xl font-bold md:text-5xl">
                      {primary.name}
                    </h1>
                    <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                      {primary.description}
                    </p>

                    <div className="mt-8 grid grid-cols-2 gap-3">
                      {primarySpecs.map(({ icon: Icon, label, detail }) => (
                        <div
                          key={label}
                          className="flex items-start gap-3 rounded-xl bg-muted/60 px-4 py-3"
                        >
                          <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                          <div>
                            <p className="text-sm font-semibold">{label}</p>
                            <p className="text-xs text-muted-foreground">
                              {detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="mt-8 text-3xl font-bold text-primary">
                      From ${primary.base_price}
                      <span className="text-base font-normal text-muted-foreground">
                        /day
                      </span>
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button asChild size="lg" className="h-12 px-8 text-base">
                        <Link to="/book">Book Now</Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="h-12 px-8 text-base"
                      >
                        <Link to="/contact">Ask a Question</Link>
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>
          )}

          {/* Standalone Rentals */}
          {standalone.length > 0 && (
            <section className="bg-muted/40 py-16 md:py-24">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <h2 className="text-3xl font-bold md:text-4xl">
                    Standalone Rentals
                  </h2>
                  <p className="mt-3 text-muted-foreground">
                    Available on their own or alongside your sauna booking.
                  </p>
                </motion.div>

                <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {standalone.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-80px' }}
                      transition={{ duration: 0.4, delay: i * 0.1 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Add-Ons */}
          {addons.length > 0 && (
            <section className="py-16 md:py-24">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <h2 className="text-3xl font-bold md:text-4xl">Add-Ons</h2>
                  <p className="mt-3 text-muted-foreground">
                    Enhance your experience — available during booking.
                  </p>
                </motion.div>

                <div className="mt-12 grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {addons.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-80px' }}
                      transition={{ duration: 0.4, delay: i * 0.08 }}
                    >
                      <AddonCard product={product} />
                    </motion.div>
                  ))}
                </div>

                <div className="mt-10 text-center">
                  <Button asChild size="lg" className="h-11 px-6">
                    <Link to="/book">Build Your Package</Link>
                  </Button>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </>
  )
}
