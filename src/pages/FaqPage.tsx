import { useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useFaqs } from '@/hooks/useFaqs'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  'All',
  'Booking & Pricing',
  'Delivery & Setup',
  'Using the Sauna',
  'Payment & Cancellation',
] as const

export default function FaqPage() {
  const { data: faqs, isLoading } = useFaqs()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')

  const filtered = useMemo(() => {
    if (!faqs) return []
    let result = faqs

    if (activeCategory !== 'All') {
      result = result.filter((f) => f.category === activeCategory)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (f) =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q)
      )
    }

    return result
  }, [faqs, activeCategory, search])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const faq of filtered) {
      const group = map.get(faq.category) ?? []
      group.push(faq)
      map.set(faq.category, group)
    }
    return map
  }, [filtered])

  return (
    <>
      <Helmet>
        <title>FAQ | Mobile Sauna Rental</title>
        <meta
          name="description"
          content="Frequently asked questions about our mobile sauna rental service. Find answers about booking, pricing, delivery, setup, and more."
        />
      </Helmet>

      <main className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold md:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to know about renting our mobile sauna.
            </p>
          </motion.div>

          {/* Search */}
          <div className="relative mt-10">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-10"
            />
          </div>

          {/* Category Tabs */}
          <div className="mt-6 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ Content */}
          <div className="mt-10">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2 border-b pb-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                No matching questions found. Try a different search term.
              </p>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-10"
              >
                {Array.from(grouped.entries()).map(([category, items]) => (
                  <div key={category}>
                    <h2 className="mb-4 text-lg font-bold text-primary">
                      {category}
                    </h2>
                    <Accordion type="single" collapsible className="w-full">
                      {items.map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id}>
                          <AccordionTrigger className="text-left text-base">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="leading-relaxed text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
