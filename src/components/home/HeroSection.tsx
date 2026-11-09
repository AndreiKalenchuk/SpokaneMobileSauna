import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HERO_IMAGE_URL } from '@/lib/site-config'
import { useDeliverySettings } from '@/hooks/useDeliverySettings'

export function HeroSection() {
  const settings = useDeliverySettings()
  const both = settings.delivery_enabled && settings.pickup_enabled

  const badges = [
    { icon: Users, label: 'Seats 6' },
    { icon: Flame, label: 'Wood-Fired Cedar' },
    {
      icon: MapPin,
      label: both
        ? `Delivery or Pickup off ${settings.pickup_exit}`
        : settings.delivery_enabled
          ? 'Delivered & Set Up'
          : `Pickup off ${settings.pickup_exit}`,
    },
  ]

  const subtitle = both
    ? 'delivered and set up at your place, or picked up a minute off the interstate.'
    : settings.delivery_enabled
      ? 'delivered and set up at your place.'
      : `picked up right off ${settings.pickup_exit}.`

  return (
    <section className="relative -mt-16 flex min-h-[clamp(480px,62svh,680px)] items-center justify-center overflow-hidden">
      <img
        src={HERO_IMAGE_URL}
        alt=""
        width={2000}
        height={1333}
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/20" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 mx-auto max-w-3xl px-4 pt-20 pb-8 text-center text-white sm:px-6 md:pt-20 md:pb-10"
      >
        <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Your Private Sauna, for a Whole Day
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
          A wood-fired cedar sauna for 24 hours — {subtitle}
        </p>

        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="h-12 bg-accent px-8 text-base text-accent-foreground hover:bg-accent/90"
          >
            <Link to="/book">Book Your Date</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 border-white/30 bg-white/10 px-7 text-base text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
          >
            <a href="#how-it-works">How It Works</a>
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3 md:gap-5"
        >
          {badges.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm"
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
