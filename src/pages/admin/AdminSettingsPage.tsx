import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BlockedDatesTab } from '@/components/admin/BlockedDatesTab'
import { ProductsTab } from '@/components/admin/ProductsTab'
import { PricingRulesTab } from '@/components/admin/PricingRulesTab'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>

      <Tabs defaultValue="blocked-dates">
        <TabsList>
          <TabsTrigger value="blocked-dates">Calendar</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="pricing-rules">Pricing Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="blocked-dates">
          <BlockedDatesTab />
        </TabsContent>

        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>

        <TabsContent value="pricing-rules">
          <PricingRulesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
