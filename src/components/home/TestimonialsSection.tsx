import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTestimonials } from '@/hooks/useTestimonials'

export function TestimonialsSection() {
  const { data: testimonials, isLoading } = useTestimonials()
  const [current, setCurrent] = useState(0)
  const count = testimonials?.length ?? 0

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % count),
    [count],
  )
  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + count) % count),
    [count],
  )

  useEffect(() => {
    if (count <= 1) return
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [count, next])

  const t = testimonials?.[current]

  return (
    <section className="bg-muted/50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            What Our Customers Say
          </h2>
          <p className="mt-3 text-muted-foreground">
            Real experiences from real people.
          </p>
        </div>

        <div className="relative mx-auto mt-12 max-w-2xl">
          {isLoading ? (
            <div className="space-y-4 text-center">
              <Skeleton className="mx-auto h-5 w-32" />
              <Skeleton className="mx-auto h-20 w-full" />
              <Skeleton className="mx-auto h-4 w-24" />
            </div>
          ) : t ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col items-center text-center"
              >
                <Quote className="size-8 text-primary/20" />

                <div className="mt-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-5 ${
                        i < t.rating
                          ? 'fill-accent text-accent'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>

                <blockquote className="mt-6 text-lg leading-relaxed italic text-foreground/90">
                  "{t.text}"
                </blockquote>

                <p className="mt-4 font-semibold">{t.customer_name}</p>
              </motion.div>
            </AnimatePresence>
          ) : null}

          {count > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={prev}
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <div className="flex gap-1.5">
                {testimonials?.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`size-2 rounded-full transition-colors ${
                      i === current ? 'bg-primary' : 'bg-primary/20'
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={next}
                aria-label="Next testimonial"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
