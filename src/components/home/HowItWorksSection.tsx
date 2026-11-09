import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, Flame, Sparkles, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDeliverySettings } from '@/hooks/useDeliverySettings'
import { formatMiles, formatMoney, pickupPriceText } from '@/lib/delivery'
import type { DeliverySettings } from '@/lib/delivery'

function buildSteps(s: DeliverySettings) {
  const deliveryText = `We deliver within ${formatMiles(s.delivery_included_miles)} miles for ${formatMoney(s.delivery_base_fee)}`
  const pickupPrice = s.pickup_fee > 0 ? `for ${pickupPriceText(s)}` : 'free'
  const pickupText = `grab it ${pickupPrice} right off ${s.pickup_exit} (${s.pickup_street})`

  const fulfillment =
    s.delivery_enabled && s.pickup_enabled
      ? { title: 'Delivery or Pickup', description: `${deliveryText}, or ${pickupText}.` }
      : s.delivery_enabled
        ? { title: 'We Deliver', description: `${deliveryText} — setup included.` }
        : { title: 'Easy Pickup', description: `Just ${pickupText}.` }

  return [
    {
      icon: CalendarDays,
      title: 'Pick Your Date',
      description:
        'See live availability and lock in your day in about two minutes. Weekdays are the best value.',
    },
    { icon: Truck, ...fulfillment },
    {
      icon: Flame,
      title: 'Set Up & Fire It Up',
      description: s.delivery_enabled
        ? 'Delivery includes full setup and a safety walkthrough. Light the wood stove and it’s sauna-hot in about an hour.'
        : 'We walk you through setup and fire safety at pickup. Light the wood stove and it’s sauna-hot in about an hour.',
    },
    {
      icon: Sparkles,
      title: 'Sweat, Plunge, Recover',
      description:
        'A full day of deep cedar heat — melt stress, soothe sore muscles, and sleep like you haven’t in years.',
    },
  ]
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function HowItWorksSection() {
  const steps = buildSteps(useDeliverySettings())

  return (
    <section id="how-it-works" className="scroll-mt-16 bg-muted/50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">
            From Booking to Bliss in Four Steps
          </h2>
          <p className="mt-3 text-muted-foreground">
            No membership, no crowds — your own wood-fired sauna for the day.
          </p>
        </div>

        <motion.ol
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6"
        >
          {/* Connector: horizontal on desktop, vertical on mobile */}
          <div
            aria-hidden
            className="absolute top-10 right-[12.5%] left-[12.5%] hidden h-0.5 bg-gradient-to-r from-primary/20 via-accent/60 to-primary/20 md:block"
          />
          <div
            aria-hidden
            className="absolute top-10 bottom-10 left-10 w-0.5 bg-gradient-to-b from-primary/20 via-accent/60 to-primary/20 md:hidden"
          />

          {steps.map((step, i) => (
            <motion.li
              key={step.title}
              variants={item}
              className="relative flex gap-5 md:flex-col md:items-center md:text-center"
            >
              <div className="relative shrink-0">
                <div className="flex size-20 items-center justify-center rounded-2xl bg-card shadow-sm ring-1 ring-border">
                  <step.icon className="size-8 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {i + 1}
                </span>
              </div>
              <div className="pt-1 md:pt-0">
                <h3 className="text-lg font-semibold md:mt-6">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:mx-auto md:max-w-[16rem]">
                  {step.description}
                </p>
              </div>
            </motion.li>
          ))}
        </motion.ol>

        <div className="mt-12 text-center">
          <Button asChild size="lg" className="h-12 px-8 text-base">
            <Link to="/book" className="inline-flex items-center gap-2">
              Start With Step 1 — Pick Your Date
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
