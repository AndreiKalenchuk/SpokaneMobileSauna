import { Helmet } from 'react-helmet-async'
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
        <title>Mobile Sauna Rental | Bring the Sauna to You</title>
        <meta
          name="description"
          content="Premium wood-fired mobile sauna delivered to your door. Seats 6, includes setup and teardown. Book your 24-hour sauna escape today. From $229/day."
        />
        <meta property="og:title" content="Mobile Sauna Rental | Bring the Sauna to You" />
        <meta
          property="og:description"
          content="Premium wood-fired mobile sauna delivered to your door for a 24-hour escape. Book today."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={import.meta.env.VITE_SITE_URL ?? 'https://mobilesauna.com'} />
        <meta
          property="og:image"
          content="https://images.unsplash.com/photo-1554244933-d876deb6b2ff?auto=format&fit=crop&w=1200&q=80"
        />
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
