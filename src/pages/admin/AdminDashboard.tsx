import { Helmet } from 'react-helmet-async'

export default function AdminDashboard() {
  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Mobile Sauna Rental</title>
      </Helmet>
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-center">
          Admin Dashboard
        </h1>
        <p className="mt-4 text-lg text-muted-foreground text-center max-w-2xl">
          Manage bookings, products, and settings.
        </p>
      </main>
    </>
  )
}
