import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Flame,
  Users,
  CalendarDays,
  Clock,
  MapPin,
  Truck,
  Wrench,
  ArrowRight,
  Home,
  Droplets,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNextCommunityEvent } from '@/hooks/useCommunityEvents'
import { useProducts } from '@/hooks/useProducts'

function formatTime(time: string): string {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

const privateSteps = [
  'Pick your date & add-ons',
  'We deliver, set up & light the fire',
  'Enjoy a 24-hour private session',
]

const communitySteps = [
  'Pick a Thursday & arrival time',
  'Arrive with towel, robe & water',
  'Share one hour of heat with the community',
]

export function BookingOptionsSection() {
  const { data: nextEvent } = useNextCommunityEvent()
  const { data: products } = useProducts()

  const privateProduct = products?.find((p) => p.type === 'primary')
  const communityProduct = products?.find((p) => p.slug === 'community-sauna')

  const privatePrice = privateProduct?.base_price ?? 229
  const communityPrice = communityProduct?.base_price ?? 29.95

  return (
    <section
      id="booking-options"
      className="relative scroll-mt-16 bg-gradient-to-b from-background to-muted/40 py-10 md:py-14"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 md:mb-8"
        >
          <Badge variant="secondary" className="mb-3">
            Two ways to sauna
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            Choose your experience
          </h2>
          <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
            Bring the sauna home for a full day, or drop in for a one-hour
            community session.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Private rental */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full flex flex-col">
              <CardContent className="p-6 md:p-8 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/20">
                      <Home className="mr-1 size-3" />
                      Private Rental
                    </Badge>
                    <h3 className="text-2xl font-bold">Private Sauna Rental</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Delivered to your door for a 24-hour escape.
                    </p>
                  </div>
                </div>

                <div className="mb-5">
                  <p className="text-3xl font-bold text-primary">
                    From ${privatePrice.toFixed(0)}
                    <span className="text-sm text-muted-foreground font-normal">
                      {' '}
                      / day
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Seats up to 6 · wood-fired · setup included
                  </p>
                </div>

                <div className="space-y-2.5 mb-5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Truck className="size-4 text-secondary" />
                    Free delivery within 20 miles
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Wrench className="size-4 text-secondary" />
                    Professional setup & teardown
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Flame className="size-4 text-secondary" />
                    Firewood for heat-up + 40 min session
                  </div>
                </div>

                <div className="rounded-lg bg-muted/40 p-4 mb-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    How it works
                  </p>
                  <ol className="space-y-1.5 text-sm">
                    {privateSteps.map((s, i) => (
                      <li key={s} className="flex gap-2">
                        <span className="font-semibold text-primary shrink-0">
                          {i + 1}.
                        </span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <Button asChild size="lg" className="w-full h-12 mt-auto">
                  <Link to="/book" className="flex items-center justify-center gap-2">
                    Book Private Sauna
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Community sauna */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full flex flex-col border-accent/40">
              <CardContent className="p-6 md:p-8 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge className="mb-3 bg-accent/15 text-accent-foreground hover:bg-accent/25">
                      <Users className="mr-1 size-3" />
                      Community Event
                    </Badge>
                    <h3 className="text-2xl font-bold">Community Sauna</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Drop-in one-hour sauna sessions every week.
                    </p>
                  </div>
                </div>

                <div className="mb-5">
                  <p className="text-3xl font-bold text-primary">
                    ${communityPrice.toFixed(2)}
                    <span className="text-sm text-muted-foreground font-normal">
                      {' '}
                      / person
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    1-hour session · up to 10 per time slot
                  </p>
                </div>

                <div className="space-y-2.5 mb-5 text-sm">
                  {nextEvent ? (
                    <>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="size-4 text-accent" />
                        Next: {formatShortDate(nextEvent.event_date)}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-4 text-accent" />
                        {formatTime(nextEvent.start_time)} –{' '}
                        {formatTime(nextEvent.end_time)}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="size-4 text-accent" />
                        {nextEvent.location}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="size-4 text-accent" />
                        Every Thursday, 4:30 – 8:00 PM
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="size-4 text-accent" />
                        1921 W 10th Ave, Spokane, WA
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Droplets className="size-4 text-accent" />
                        Bring your own towel, robe & water
                      </div>
                    </>
                  )}
                </div>

                <div className="rounded-lg bg-muted/40 p-4 mb-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    How it works
                  </p>
                  <ol className="space-y-1.5 text-sm">
                    {communitySteps.map((s, i) => (
                      <li key={s} className="flex gap-2">
                        <span className="font-semibold text-accent-foreground shrink-0">
                          {i + 1}.
                        </span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="w-full h-12 mt-auto bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Link
                    to="/community"
                    className="flex items-center justify-center gap-2"
                  >
                    Book Community Sauna
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
