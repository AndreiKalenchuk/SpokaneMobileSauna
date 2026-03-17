import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Flame, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SITE_NAME } from '@/lib/site-config'

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>Page Not Found — {SITE_NAME}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-primary/10">
            <Flame className="size-12 text-primary" />
          </div>
          <h1 className="mt-6 text-4xl font-bold md:text-5xl">
            Page Not Found
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            The page you're looking for doesn't exist or has been moved. Let's get
            you back to the warmth.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <Home className="size-5" />
              Back to Home
            </Link>
          </Button>
        </motion.div>
      </div>
    </>
  )
}
