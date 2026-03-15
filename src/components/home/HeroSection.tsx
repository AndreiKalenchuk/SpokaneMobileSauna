import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Users, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const badges = [
  { icon: Star, label: '4.9 Rating' },
  { icon: Users, label: '500+ Rentals' },
  { icon: Truck, label: 'Free Setup & Teardown' },
]

export function HeroSection() {
  return (
    <section className="relative -mt-16 flex min-h-svh items-center justify-center overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1554244933-d876deb6b2ff?auto=format&fit=crop&w=2000&q=80"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/20" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 mx-auto max-w-3xl px-4 py-24 text-center text-white sm:px-6"
      >
        <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
          Bring the Sauna to You
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/85 md:text-xl">
          Premium wood-fired mobile sauna delivered to your door for a 24-hour escape.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="h-12 px-8 text-base">
            <Link to="/book">Book Your Sauna</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 border-white/30 bg-white/10 px-8 text-base text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
          >
            <a href="#how-it-works">See How It Works</a>
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6"
        >
          {badges.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm"
            >
              <Icon className="size-4 text-accent" />
              {label}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
