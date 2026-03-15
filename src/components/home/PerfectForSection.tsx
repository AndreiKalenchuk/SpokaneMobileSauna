import { motion } from 'framer-motion'
import {
  Heart,
  Cake,
  PartyPopper,
  Briefcase,
  Dumbbell,
  Snowflake,
} from 'lucide-react'

const occasions = [
  {
    icon: Heart,
    title: 'Date Nights',
    description: 'An unforgettable evening under the stars.',
  },
  {
    icon: Cake,
    title: 'Birthday Parties',
    description: 'The most unique celebration your guests will remember.',
  },
  {
    icon: PartyPopper,
    title: 'Bachelor/ette Parties',
    description: 'Elevate the weekend with heat and cold plunge.',
  },
  {
    icon: Briefcase,
    title: 'Corporate Events',
    description: 'Bond beyond the boardroom.',
  },
  {
    icon: Dumbbell,
    title: 'Post-Sport Recovery',
    description: 'Recover like a pro after the game or slopes.',
  },
  {
    icon: Snowflake,
    title: 'Winter Gatherings',
    description: 'The colder it gets, the better it feels.',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
}

export function PerfectForSection() {
  return (
    <section className="bg-muted/50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Perfect For Any Occasion
          </h2>
          <p className="mt-3 text-muted-foreground">
            From intimate date nights to group celebrations — there's always a reason to sauna.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {occasions.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={item}
              className="flex items-start gap-4 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/15">
                <Icon className="size-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
