import { Helmet } from 'react-helmet-async'

export default function ProductsPage() {
  return (
    <>
      <Helmet>
        <title>Our Rentals | Mobile Sauna Rental</title>
        <meta
          name="description"
          content="Explore our mobile sauna and add-on rentals. Cold plunge tub, firewood bundles, and more."
        />
      </Helmet>
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-center">
          Our Rentals
        </h1>
        <p className="mt-4 text-lg text-muted-foreground text-center max-w-2xl">
          Everything you need for the ultimate sauna experience.
        </p>
      </main>
    </>
  )
}
