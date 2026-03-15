import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export function CtaBannerSection() {
  return (
    <section className="bg-primary py-16 text-primary-foreground md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8"
      >
        <h2 className="text-3xl font-bold md:text-4xl">
          Ready for Your Sauna Experience?
        </h2>
        <p className="mt-4 text-lg text-primary-foreground/80">
          Book today and we'll handle everything — delivery, setup, firewood,
          and pickup.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="h-12 bg-accent px-8 text-base text-accent-foreground hover:bg-accent/90"
          >
            <Link to="/book">Book Your Sauna</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 border-primary-foreground/30 bg-transparent px-8 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <Link to="/contact">Questions? Contact Us</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
