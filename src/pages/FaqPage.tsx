import { Helmet } from 'react-helmet-async'

export default function FaqPage() {
  return (
    <>
      <Helmet>
        <title>FAQ | Mobile Sauna Rental</title>
        <meta
          name="description"
          content="Frequently asked questions about our mobile sauna rental service."
        />
      </Helmet>
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-center">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-lg text-muted-foreground text-center max-w-2xl">
          Everything you need to know about renting our mobile sauna.
        </p>
      </main>
    </>
  )
}
