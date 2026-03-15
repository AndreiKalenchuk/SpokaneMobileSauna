import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router-dom'

export default function BookingConfirmationPage() {
  const { id } = useParams()

  return (
    <>
      <Helmet>
        <title>Booking Confirmed | Mobile Sauna Rental</title>
      </Helmet>
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-center">
          Your Sauna is Booked!
        </h1>
        <p className="mt-4 text-lg text-muted-foreground text-center max-w-2xl">
          Booking reference: {id}
        </p>
      </main>
    </>
  )
}
