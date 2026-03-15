import { Helmet } from 'react-helmet-async'

export default function BookingPage() {
  return (
    <>
      <Helmet>
        <title>Book Your Sauna | Mobile Sauna Rental</title>
        <meta
          name="description"
          content="Select a date, customize your experience, and reserve your mobile sauna in minutes."
        />
      </Helmet>
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-center">
          Book Your Sauna
        </h1>
        <p className="mt-4 text-lg text-muted-foreground text-center max-w-2xl">
          Select a date, customize your experience, and reserve in minutes.
        </p>
      </main>
    </>
  )
}
