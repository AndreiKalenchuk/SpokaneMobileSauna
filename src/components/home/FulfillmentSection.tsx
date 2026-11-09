import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, MapPin, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useDeliverySettings } from '@/hooks/useDeliverySettings'
import {
  fillDeliveryTokens,
  formatMiles,
  formatMoney,
} from '@/lib/delivery'

export function FulfillmentSection() {
  const settings = useDeliverySettings()
  const both = settings.delivery_enabled && settings.pickup_enabled

  const options = [
    settings.delivery_enabled && {
      icon: Truck,
      badge: 'Full service',
      title: 'Delivery & Setup',
      price: formatMoney(settings.delivery_base_fee),
      priceNote: `first ${formatMiles(settings.delivery_included_miles)} miles · then ${formatMoney(settings.delivery_rate_per_extra_mile)}/mile`,
      points: settings.delivery_points,
      highlight: false,
    },
    settings.pickup_enabled && {
      icon: MapPin,
      badge: settings.pickup_fee > 0 ? 'Easy' : 'Free',
      title: 'Easy Pickup',
      price: formatMoney(settings.pickup_fee),
      priceNote: `${settings.pickup_exit} · ${settings.pickup_street}`,
      points: settings.pickup_points,
      highlight: true,
    },
  ].filter((o) => !!o)

  return (
    <section id="delivery-pickup" className="scroll-mt-16 py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            {both
              ? 'Delivered or Picked Up — Your Call'
              : settings.delivery_enabled
                ? 'Delivered & Set Up for You'
                : 'Easy Pickup, Right Off the Interstate'}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {both
              ? 'Same sauna, same 24 hours. Choose what fits your plans at checkout.'
              : 'Same sauna, same 24 hours — no hassle.'}
          </p>
        </div>

        <div
          className={`mx-auto mt-12 grid gap-6 ${both ? 'md:grid-cols-2' : 'max-w-lg'}`}
        >
          {options.map(({ icon: Icon, badge, title, price, priceNote, points, highlight }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className={`flex flex-col rounded-2xl border bg-card p-6 md:p-8 ${
                highlight ? 'border-accent/50 ring-1 ring-accent/20' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex size-12 items-center justify-center rounded-xl ${
                    highlight ? 'bg-accent/15' : 'bg-primary/10'
                  }`}
                >
                  <Icon className={`size-6 ${highlight ? 'text-accent' : 'text-primary'}`} />
                </div>
                <Badge
                  variant="secondary"
                  className={highlight ? 'bg-accent/15 text-accent-foreground' : ''}
                >
                  {badge}
                </Badge>
              </div>

              <h3 className="mt-5 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-3xl font-bold text-primary">{price}</p>
              <p className="text-sm text-muted-foreground">{priceNote}</p>

              <ul className="mt-5 space-y-2.5 text-sm">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    {fillDeliveryTokens(point, settings)}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/book"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Check availability <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
