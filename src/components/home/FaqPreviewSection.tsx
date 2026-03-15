import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'
import { useFaqs } from '@/hooks/useFaqs'

export function FaqPreviewSection() {
  const { data: faqs, isLoading } = useFaqs()
  const preview = faqs?.slice(0, 5) ?? []

  return (
    <section className="bg-muted/50 py-16 md:py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-muted-foreground">
            Quick answers to common questions.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mt-12"
        >
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="space-y-2 border-b pb-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {preview.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </motion.div>

        <div className="mt-8 text-center">
          <Link
            to="/faq"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            See All FAQs <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
