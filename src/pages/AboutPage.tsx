import { Helmet } from 'react-helmet-async'

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About Us | Mobile Sauna Rental</title>
        <meta
          name="description"
          content="Learn about our passion for sauna culture, wellness, and community."
        />
      </Helmet>
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-center">
          About Us
        </h1>
        <p className="mt-4 text-lg text-muted-foreground text-center max-w-2xl">
          Our story, our sauna, our values.
        </p>
      </main>
    </>
  )
}
