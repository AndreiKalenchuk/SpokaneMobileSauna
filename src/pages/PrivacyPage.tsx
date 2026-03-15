import { Helmet } from 'react-helmet-async'

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Mobile Sauna Rental</title>
      </Helmet>
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-center">
          Privacy Policy
        </h1>
        <p className="mt-4 text-lg text-muted-foreground text-center max-w-2xl">
          How we collect, use, and protect your personal information.
        </p>
      </main>
    </>
  )
}
