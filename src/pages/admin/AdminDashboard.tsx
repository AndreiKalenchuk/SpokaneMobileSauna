import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarRange, DollarSign, TrendingUp, Clock, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  monthlyBookings: number
  monthlyRevenue: number
  upcomingBookings: number
  todayBooking: string | null
  communityThisWeek: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0]
      const today = now.toISOString().split('T')[0]
      const nextWeek = new Date(now.getTime() + 7 * 86400000)
        .toISOString()
        .split('T')[0]

      const [monthlyRes, upcomingRes, todayRes, communityRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, total_amount')
          .gte('rental_date', startOfMonth)
          .lte('rental_date', endOfMonth)
          .in('status', ['confirmed', 'completed']),
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .gte('rental_date', today)
          .lte('rental_date', nextWeek)
          .in('status', ['confirmed']),
        supabase
          .from('bookings')
          .select('customer_name')
          .eq('rental_date', today)
          .in('status', ['confirmed', 'completed'])
          .limit(1)
          .maybeSingle(),
        supabase
          .from('community_bookings')
          .select('quantity')
          .gte('event_date', today)
          .lte('event_date', nextWeek)
          .in('status', ['confirmed', 'pending']),
      ])

      const monthlyBookings = monthlyRes.data?.length ?? 0
      const monthlyRevenue =
        monthlyRes.data?.reduce((sum, b) => sum + (b.total_amount ?? 0), 0) ?? 0
      const communityThisWeek =
        communityRes.data?.reduce((sum, b) => sum + (b.quantity ?? 0), 0) ?? 0

      setStats({
        monthlyBookings,
        monthlyRevenue,
        upcomingBookings: upcomingRes.count ?? 0,
        todayBooking: todayRes.data?.customer_name ?? null,
        communityThisWeek,
      })
      setLoading(false)
    }

    fetchStats()
  }, [])

  const cards = [
    {
      title: 'Bookings This Month',
      value: stats?.monthlyBookings ?? 0,
      icon: CalendarRange,
      format: (v: number) => String(v),
    },
    {
      title: 'Revenue This Month',
      value: stats?.monthlyRevenue ?? 0,
      icon: DollarSign,
      format: (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    },
    {
      title: 'Upcoming (7 days)',
      value: stats?.upcomingBookings ?? 0,
      icon: TrendingUp,
      format: (v: number) => String(v),
    },
    {
      title: "Today's Booking",
      value: stats?.todayBooking ?? 'None',
      icon: Clock,
      format: (v: string) => v,
    },
    {
      title: 'Community (7 days)',
      value: stats?.communityThisWeek ?? 0,
      icon: Users,
      format: (v: number) => String(v),
    },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="text-2xl font-bold">
                  {/* @ts-expect-error — format is polymorphic over card type */}
                  {card.format(card.value)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
