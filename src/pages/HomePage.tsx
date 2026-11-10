import { Helmet } from 'react-helmet-async'
import {
  SITE_NAME,
  SITE_URL,
  fullUrl,
  DEFAULT_OG_IMAGE,
  HERO_IMAGE_URL,
  CONTACT,
} from '@/lib/site-config'
import { HeroSection } from '@/components/home/HeroSection'
import { HowItWorksSection } from '@/components/home/HowItWorksSection'
import { FulfillmentSection } from '@/components/home/FulfillmentSection'
import { BenefitsSection } from '@/components/home/BenefitsSection'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import { GalleryPreviewSection } from '@/components/home/GalleryPreviewSection'
import { FaqPreviewSection } from '@/components/home/FaqPreviewSection'
import { CtaBannerSection } from '@/components/home/CtaBannerSection'

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>{`Book Your Mobile Sauna — ${SITE_NAME}`}</title>
        <meta
          name="description"
          content="Premium wood-fired mobile sauna for 24 hours. Delivered and set up at your door, or picked up right off I-90 in Spokane. Seats up to 6. From $229/day."
        />
        <meta property="og:title" content={`Book Your Mobile Sauna — ${SITE_NAME}`} />
        <meta
          property="og:description"
          content="Premium wood-fired mobile sauna for 24 hours. Delivered and set up at your door, or picked up right off I-90 in Spokane."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={fullUrl('/')} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={fullUrl('/')} />
        <link rel="preload" as="image" href={HERO_IMAGE_URL} />
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
              'Premium wood-fired mobile sauna rentals in Spokane — delivered and set up at your door, or picked up off I-90. Seats up to 6, health benefits, muscle recovery.',
          })}
        </script>
      </Helmet>

      <HeroSection />
      <HowItWorksSection />
      <FulfillmentSection />
      <BenefitsSection />
      <TestimonialsSection />
      <GalleryPreviewSection />
      <FaqPreviewSection />
      <CtaBannerSection />
    </>
  )
}
