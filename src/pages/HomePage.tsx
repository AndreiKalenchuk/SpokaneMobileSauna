import { Helmet } from 'react-helmet-async'

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>Mobile Sauna Rental | Bring the Sauna to You</title>
        <meta
          name="description"
          content="Premium wood-fired mobile sauna delivered to your door for a 24-hour escape. Book your sauna experience today."
        />
      </Helmet>
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-center">
          Bring the Sauna to You
        </h1>
        <p className="mt-4 text-lg text-muted-foreground text-center max-w-2xl">
          Premium wood-fired mobile sauna delivered to your door for a 24-hour escape.
        </p>
      </main>
    </>
  )
}
