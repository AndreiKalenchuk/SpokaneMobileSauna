import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useProducts } from '@/hooks/useProducts'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export function AddOnsPreviewSection() {
  const { data: products, isLoading } = useProducts()
  const addons = products?.filter((p) => p.type === 'addon') ?? []

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Enhance Your Experience
          </h2>
          <p className="mt-3 text-muted-foreground">
            Customize your session with premium add-ons.
          </p>
        </div>

        {isLoading ? (
          <div className="mt-12 flex gap-6 overflow-hidden">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="w-64 shrink-0 space-y-3">
                <Skeleton className="aspect-square w-full rounded-2xl" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="-mx-4 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-4 md:overflow-visible"
          >
            {addons.map((addon) => (
              <motion.div
                key={addon.id}
                variants={item}
                className="w-60 shrink-0 snap-start rounded-2xl border bg-card transition-shadow hover:shadow-md md:w-auto"
              >
                <img
                  src={addon.image_url ?? '/gallery/sauna-exterior.jpg'}
                  alt={addon.name}
                  className="aspect-square w-full rounded-t-2xl object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold">{addon.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {addon.description}
                  </p>
                  <p className="mt-3 text-sm font-bold text-primary">
                    +${addon.base_price.toFixed(2)}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/book"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Add to Your Booking <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
