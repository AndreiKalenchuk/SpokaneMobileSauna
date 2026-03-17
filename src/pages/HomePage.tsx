import { Helmet } from 'react-helmet-async'
import {
  SITE_NAME,
  SITE_URL,
  fullUrl,
  DEFAULT_OG_IMAGE,
  CONTACT,
} from '@/lib/site-config'
import { HeroSection } from '@/components/home/HeroSection'
import { HowItWorksSection } from '@/components/home/HowItWorksSection'
import { FeaturedProductSection } from '@/components/home/FeaturedProductSection'
import { BenefitsSection } from '@/components/home/BenefitsSection'
import { PerfectForSection } from '@/components/home/PerfectForSection'
import { AddOnsPreviewSection } from '@/components/home/AddOnsPreviewSection'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import { GalleryPreviewSection } from '@/components/home/GalleryPreviewSection'
import { FaqPreviewSection } from '@/components/home/FaqPreviewSection'
import { CtaBannerSection } from '@/components/home/CtaBannerSection'

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>Book Your Mobile Sauna — {SITE_NAME}</title>
        <meta
          name="description"
          content="Premium wood-fired mobile sauna delivered to your door. Seats 6, includes setup and teardown. Book your 24-hour sauna escape today. From $229/day."
        />
        <meta property="og:title" content={`Book Your Mobile Sauna — ${SITE_NAME}`} />
        <meta
          property="og:description"
          content="Premium wood-fired mobile sauna delivered to your door. Seats 6, includes setup and teardown. Book your 24-hour sauna escape today."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={fullUrl('/')} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={fullUrl('/')} />
        <link
          rel="preload"
          as="image"
          href="https://images.unsplash.com/photo-1554244933-d876deb6b2ff?auto=format&fit=crop&w=2000&q=80"
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: SITE_NAME,
            url: SITE_URL,
            telephone: CONTACT.phoneHref.replace('tel:', ''),
            email: CONTACT.email,
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Spokane',
              addressRegion: 'WA',
              addressCountry: 'US',
            },
            openingHours: 'Mo-Su 08:00-20:00',
            priceRange: '$$',
            description:
              'Premium wood-fired mobile sauna delivered to your door in Spokane and surrounding areas. Seats 6, health benefits, muscle recovery.',
          })}
        </script>
      </Helmet>

      <HeroSection />
      <HowItWorksSection />
      <FeaturedProductSection />
      <BenefitsSection />
      <PerfectForSection />
      <AddOnsPreviewSection />
      <TestimonialsSection />
      <GalleryPreviewSection />
      <FaqPreviewSection />
      <CtaBannerSection />
    </>
  )
}
