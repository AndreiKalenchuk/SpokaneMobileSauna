import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SITE_NAME, fullUrl, DEFAULT_OG_IMAGE } from '@/lib/site-config'
import { motion } from 'framer-motion'
import {
  Heart,
  Leaf,
  Users,
  Sparkles,
  Flame,
  TreePine,
  Ruler,
  Droplets,
  Thermometer,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const values = [
  {
    icon: Heart,
    title: 'Authenticity',
    description:
      'We honor the centuries-old Nordic sauna tradition — real wood, real fire, real warmth. No shortcuts.',
  },
  {
    icon: Sparkles,
    title: 'Wellness for Everyone',
    description:
      'We believe everyone deserves access to the restorative power of sauna. We bring it to your doorstep.',
  },
  {
    icon: Leaf,
    title: 'Sustainability',
    description:
      'Locally sourced cedar, carbon-conscious delivery routes, and a commitment to leaving no trace.',
  },
  {
    icon: Users,
    title: 'Community',
    description:
      'Sauna is better together. We foster connection — between friends, families, and neighbors.',
  },
]

const saunaSpecs = [
  { icon: Ruler, label: 'Dimensions', value: "8' × 12' on trailer" },
  { icon: TreePine, label: 'Interior', value: 'Western Red Cedar' },
  { icon: Flame, label: 'Heating', value: 'Wood-fired stove (Harvia)' },
  { icon: Thermometer, label: 'Temperature', value: 'Up to 190°F / 88°C' },
  { icon: Users, label: 'Capacity', value: '6 adults comfortably' },
  { icon: Droplets, label: 'Amenities', value: 'Bucket, ladle, thermometer, LED lighting' },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About Us — {SITE_NAME}</title>
        <meta
          name="description"
          content="Learn about our passion for sauna culture, wellness, and community. Discover our handcrafted cedar sauna and what drives us."
        />
        <meta property="og:title" content={`About Us — ${SITE_NAME}`} />
        <meta
          property="og:description"
          content="Learn about our passion for sauna culture, wellness, and community. Discover our handcrafted cedar sauna."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={fullUrl('/about')} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={fullUrl('/about')} />
      </Helmet>

      <div>
        {/* Our Story */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <img
                  src="https://images.unsplash.com/photo-1554244933-d876deb6b2ff?auto=format&fit=crop&w=800&q=80"
                  alt="Our founders"
                  width={800}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lg"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <h1 className="text-4xl font-bold md:text-5xl">Our Story</h1>
                <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">
                  <p>
                    It started with a trip to Finland and a sauna session that
                    changed everything. The warmth, the stillness, the feeling of
                    community around the stove — we knew we had to bring that
                    experience home.
                  </p>
                  <p>
                    Back in the States, we couldn't find anything like it. So we
                    built one — a handcrafted, wood-fired mobile sauna made from
                    western red cedar, designed to go wherever the good times are.
                    Backyards, lake houses, corporate retreats, birthday parties —
                    you name it.
                  </p>
                  <p>
                    What began as a passion project has grown into a mission: to
                    make authentic sauna culture accessible to everyone. We handle
                    the logistics — delivery, setup, firewood, pickup — so you can
                    focus on what matters: slowing down, warming up, and connecting
                    with the people around you.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Our Sauna */}
        <section className="bg-muted/40 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold md:text-4xl">Our Sauna</h2>
              <p className="mt-3 text-lg text-muted-foreground">
                Handcrafted for the authentic experience you deserve.
              </p>
            </motion.div>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-2 gap-3"
              >
                <img
                  src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80"
                  alt="Sauna interior with cedar benches"
                  width={600}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full rounded-xl object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80"
                  alt="Sauna exterior view"
                  width={600}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full rounded-xl object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1554244933-d876deb6b2ff?auto=format&fit=crop&w=600&q=80"
                  alt="Sauna stove detail"
                  width={600}
                  height={300}
                  loading="lazy"
                  decoding="async"
                  className="col-span-2 aspect-[2/1] w-full rounded-xl object-cover"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid content-start gap-3"
              >
                {saunaSpecs.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-start gap-4 rounded-xl bg-background p-4 shadow-sm"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{label}</p>
                      <p className="text-sm text-muted-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold md:text-4xl">Our Values</h2>
              <p className="mt-3 text-muted-foreground">
                What drives everything we do.
              </p>
            </motion.div>

            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {values.map(({ icon: Icon, title, description }) => (
                <motion.div key={title} variants={item}>
                  <Card className="h-full text-center">
                    <CardContent className="flex flex-col items-center p-6">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                        <Icon className="size-7 text-primary" />
                      </div>
                      <h3 className="mt-4 text-lg font-bold">{title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Service Area */}
        <section className="bg-muted/40 py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5 }}
            >
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                <MapPin className="size-8 text-primary" />
              </div>
              <h2 className="mt-6 text-3xl font-bold md:text-4xl">
                Service Area
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Serving the greater metro area and surrounding communities
                within 50 miles. Delivery and pickup are included in every
                rental.
              </p>
              <div className="mt-8 overflow-hidden rounded-2xl bg-muted">
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  <p className="text-sm">
                    [Embedded Google Map — coming soon]
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary py-16 text-primary-foreground md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8"
          >
            <h2 className="text-3xl font-bold md:text-4xl">
              Ready to Try It?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Book today and experience authentic sauna culture — delivered to
              your door.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-12 bg-accent px-8 text-base text-accent-foreground hover:bg-accent/90"
            >
              <Link to="/book">Book Now</Link>
            </Button>
          </motion.div>
        </section>
      </div>
    </>
  )
}
