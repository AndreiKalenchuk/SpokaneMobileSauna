import { motion } from 'framer-motion'
import {
  Brain,
  Dumbbell,
  Moon,
  HeartPulse,
  ShieldCheck,
  Users,
} from 'lucide-react'

const benefits = [
  {
    icon: Brain,
    title: 'Stress Relief',
    description:
      'Heat triggers endorphin release and activates your parasympathetic nervous system, melting away tension.',
  },
  {
    icon: Dumbbell,
    title: 'Muscle Recovery',
    description:
      'Increased blood flow delivers oxygen to sore muscles, speeding recovery after workouts or long days.',
  },
  {
    icon: Moon,
    title: 'Better Sleep',
    description:
      'A sauna session 1-2 hours before bed promotes deeper, more restorative sleep cycles.',
  },
  {
    icon: HeartPulse,
    title: 'Heart Health',
    description:
      'Regular sauna use is linked to lower cardiovascular risk and improved circulation.',
  },
  {
    icon: ShieldCheck,
    title: 'Immune Boost',
    description:
      'Heat stress activates heat shock proteins that strengthen your body\u2019s natural defenses.',
  },
  {
    icon: Users,
    title: 'Social Connection',
    description:
      'Shared warmth, no phones, real conversation. The sauna is where bonds deepen.',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}

export function BenefitsSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Why Sauna?</h2>
          <p className="mt-3 text-muted-foreground">
            Scientifically backed benefits you can feel after a single session.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {benefits.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={item}
              className="rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="size-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
