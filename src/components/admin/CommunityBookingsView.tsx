import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Mail, Phone, Users, MapPin, Clock } from 'lucide-react'
import type { CommunityBooking, CommunityEvent } from '@/types'

type StatusFilter = 'all' | CommunityBooking['status']

const statusColors: Record<CommunityBooking['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(time: string) {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`
}

function generateSlotTimes(event: CommunityEvent): string[] {
  const [sh, sm] = event.start_time.slice(0, 5).split(':').map(Number)
  const [eh, em] = event.end_time.slice(0, 5).split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  const slots: string[] = []
  for (let t = startMin; t + event.slot_minutes <= endMin; t += event.slot_minutes) {
    const h = Math.floor(t / 60)
    const m = t % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
  }
  return slots
}

export function CommunityBookingsView() {
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [bookings, setBookings] = useState<CommunityBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selected, setSelected] = useState<CommunityBooking | null>(null)

  async function fetchData() {
    setLoading(true)
    const [eventsRes, bookingsRes] = await Promise.all([
      supabase
        .from('community_events')
        .select('*')
        .order('event_date', { ascending: true }),
      supabase
        .from('community_bookings')
        .select('*')
        .order('event_date', { ascending: true })
        .order('slot_time', { ascending: true }),
    ])
    setEvents(eventsRes.data ?? [])
    setBookings(bookingsRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredBookings = useMemo(() => {
    if (statusFilter === 'all') return bookings
    return bookings.filter((b) => b.status === statusFilter)
  }, [bookings, statusFilter])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CommunityEvent>()
    for (const e of events) map.set(e.event_date, e)
    return map
  }, [events])

  const groupedByDate = useMemo(() => {
    const map = new Map<string, CommunityBooking[]>()
    for (const b of filteredBookings) {
      const list = map.get(b.event_date) ?? []
      list.push(b)
      map.set(b.event_date, list)
    }
    const dates = Array.from(map.keys())
    for (const e of events) {
      if (!map.has(e.event_date)) map.set(e.event_date, [])
    }
    dates.push(...events.map((e) => e.event_date).filter((d) => !dates.includes(d)))
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filteredBookings, events])

  async function updateStatus(id: string, status: CommunityBooking['status']) {
    await supabase
      .from('community_bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
    if (selected?.id === id) {
      setSelected((prev) => (prev ? { ...prev, status } : null))
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {groupedByDate.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No community events or bookings yet.
        </p>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(([date, dateBookings]) => {
            const event = eventsByDate.get(date)
            const slotTimes = event ? generateSlotTimes(event) : []
            const activeBookings = dateBookings.filter((b) => b.status !== 'cancelled')
            const dayTotal = activeBookings.reduce((sum, b) => sum + b.quantity, 0)
            const dayRevenue = activeBookings
              .filter((b) => b.status === 'confirmed' || b.status === 'completed')
              .reduce((sum, b) => sum + b.total_amount, 0)

            return (
              <Card key={date}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{formatDate(date)}</CardTitle>
                      {event ? (
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatTime(event.start_time)} – {formatTime(event.end_time)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {event.location}
                          </span>
                          {!event.is_active && (
                            <Badge variant="secondary">Event off</Badge>
                          )}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Event no longer scheduled
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Total bookings
                      </p>
                      <p className="text-2xl font-bold">{dayTotal}</p>
                      {dayRevenue > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(dayRevenue)} revenue
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(slotTimes.length > 0 ? slotTimes : Array.from(new Set(dateBookings.map((b) => b.slot_time)))).map(
                      (slot) => {
                        const slotBookings = dateBookings.filter(
                          (b) => b.slot_time.slice(0, 5) === slot.slice(0, 5) && b.status !== 'cancelled',
                        )
                        const slotCount = slotBookings.reduce((s, b) => s + b.quantity, 0)
                        const capacity = event?.capacity_per_slot ?? 10
                        const remaining = Math.max(0, capacity - slotCount)

                        return (
                          <div
                            key={slot}
                            className="rounded-lg border bg-muted/20 p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {formatTime(slot)}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  <Users className="mr-1 size-3" />
                                  {slotCount}/{capacity}
                                </Badge>
                                {remaining === 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    Full
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {remaining} seats left
                              </span>
                            </div>

                            {slotBookings.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic">
                                No bookings yet
                              </p>
                            ) : (
                              <div className="space-y-1">
                                {slotBookings.map((b) => (
                                  <button
                                    key={b.id}
                                    onClick={() => setSelected(b)}
                                    className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-background transition-colors"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="font-medium truncate">
                                        {b.customer_name}
                                      </span>
                                      {b.quantity > 1 && (
                                        <span className="text-xs text-muted-foreground">
                                          × {b.quantity}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Badge
                                        className={statusColors[b.status]}
                                        variant="outline"
                                      >
                                        {b.status}
                                      </Badge>
                                      <span className="text-xs font-mono text-muted-foreground">
                                        {b.booking_number}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      },
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Booking {selected.booking_number}</SheetTitle>
                <SheetDescription>
                  Created {new Date(selected.created_at).toLocaleString()}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6 px-6">
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">Status</h4>
                  <Badge className={statusColors[selected.status]} variant="outline">
                    {selected.status}
                  </Badge>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">Customer</h4>
                  <p className="font-medium">{selected.customer_name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Mail className="size-3.5" /> {selected.customer_email}
                  </p>
                  {selected.customer_phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Phone className="size-3.5" /> {selected.customer_phone}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                    Event
                  </h4>
                  <p className="font-medium">{formatDate(selected.event_date)}</p>
                  <p className="text-sm text-muted-foreground">
                    Arrival: {formatTime(selected.slot_time)} · {selected.quantity}{' '}
                    {selected.quantity === 1 ? 'person' : 'people'}
                  </p>
                </div>

                {selected.notes && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">Notes</h4>
                    <p className="text-sm">{selected.notes}</p>
                  </div>
                )}

                <Separator />

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(selected.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(selected.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(selected.total_amount)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  {selected.status === 'confirmed' && (
                    <Button onClick={() => updateStatus(selected.id, 'completed')}>
                      Mark Completed
                    </Button>
                  )}
                  {(selected.status === 'pending' || selected.status === 'confirmed') && (
                    <Button
                      variant="destructive"
                      onClick={() => updateStatus(selected.id, 'cancelled')}
                    >
                      Cancel Booking
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
