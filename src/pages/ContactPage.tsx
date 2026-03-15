import { Helmet } from 'react-helmet-async'

export default function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Contact | Mobile Sauna Rental</title>
        <meta
          name="description"
          content="Get in touch with us for bookings, questions, or partnership inquiries."
        />
      </Helmet>
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-center">
          Get in Touch
        </h1>
        <p className="mt-4 text-lg text-muted-foreground text-center max-w-2xl">
          We'd love to hear from you. Reach out with any questions.
        </p>
      </main>
    </>
  )
}
