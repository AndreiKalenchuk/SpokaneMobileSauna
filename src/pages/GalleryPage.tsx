import { Helmet } from 'react-helmet-async'

export default function GalleryPage() {
  return (
    <>
      <Helmet>
        <title>Gallery | Mobile Sauna Rental</title>
        <meta
          name="description"
          content="See the sauna in action — from backyard retreats to lakeside escapes."
        />
      </Helmet>
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-center">
          Gallery
        </h1>
        <p className="mt-4 text-lg text-muted-foreground text-center max-w-2xl">
          See the sauna in action — from backyard retreats to lakeside escapes.
        </p>
      </main>
    </>
  )
}
