import { motion } from 'framer-motion'
import { CalendarDays, Truck, Sparkles } from 'lucide-react'

const steps = [
  {
    icon: CalendarDays,
    title: 'Choose Your Date',
    description:
      'Pick an available date on our calendar and customize your add-ons.',
  },
  {
    icon: Truck,
    title: 'We Deliver & Set Up',
    description:
      'Our team delivers, fires up the sauna, and walks you through everything.',
  },
  {
    icon: Sparkles,
    title: 'Enjoy & We Pick Up',
    description: 'Relax for 24 hours. We handle teardown and pickup.',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">How It Works</h2>
          <p className="mt-3 text-muted-foreground">
            Three simple steps to your perfect sauna experience.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-12 grid gap-8 md:grid-cols-3"
        >
          {steps.map((step, i) => (
            <motion.div key={step.title} variants={item} className="relative">
              {i < steps.length - 1 && (
                <div className="absolute top-10 left-[calc(50%+2rem)] hidden h-px w-[calc(100%-4rem)] border-t-2 border-dashed border-border md:block" />
              )}
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10">
                    <step.icon className="size-8 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
