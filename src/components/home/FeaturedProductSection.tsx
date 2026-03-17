import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Flame, TreePine, Droplets } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProducts } from '@/hooks/useProducts'

const specs = [
  { icon: Users, label: 'Seats 6' },
  { icon: Flame, label: 'Wood-Fired' },
  { icon: TreePine, label: 'Cedar Interior' },
  { icon: Droplets, label: 'Bucket & Ladle Included' },
]

export function FeaturedProductSection() {
  const { data: products, isLoading } = useProducts()
  const primary = products?.find((p) => p.type === 'primary')

  if (isLoading) {
    return (
      <section className="py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="grid grid-cols-2 gap-3 pt-4">
              {[1, 2, 3, 4].map((n) => (
                <Skeleton key={n} className="h-10 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!primary) return null

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <img
              src={primary.image_url ?? '/gallery/exterior/exterior-1.jpg'}
              alt={primary.name}
              width={800}
              height={600}
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lg"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h2 className="text-3xl font-bold md:text-4xl">{primary.name}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {primary.description}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {specs.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl bg-muted/60 px-4 py-3"
                >
                  <Icon className="size-5 text-primary" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>

            <p className="mt-8 text-2xl font-bold text-primary">
              From ${primary.base_price}
              <span className="text-base font-normal text-muted-foreground">
                /day
              </span>
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-11 px-6">
                <Link to="/book">Book Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 px-6">
                <Link to="/products">Learn More</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
