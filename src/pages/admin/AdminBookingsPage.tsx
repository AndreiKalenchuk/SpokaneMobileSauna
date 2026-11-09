import { PrivateBookingsView } from '@/components/admin/PrivateBookingsView'

export default function AdminBookingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Bookings</h2>
      <PrivateBookingsView />
    </div>
  )
}
