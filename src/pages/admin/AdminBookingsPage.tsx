import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PrivateBookingsView } from '@/components/admin/PrivateBookingsView'
import { CommunityBookingsView } from '@/components/admin/CommunityBookingsView'

export default function AdminBookingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Bookings</h2>

      <Tabs defaultValue="private">
        <TabsList>
          <TabsTrigger value="private">Private Rentals</TabsTrigger>
          <TabsTrigger value="community">Community Sauna</TabsTrigger>
        </TabsList>

        <TabsContent value="private" className="mt-4">
          <PrivateBookingsView />
        </TabsContent>

        <TabsContent value="community" className="mt-4">
          <CommunityBookingsView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
