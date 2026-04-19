import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { ChevronDown, ChevronUp, Mail, Phone, MapPin } from 'lucide-react'
import type { Booking, BookingItem, Product } from '@/types'

type StatusFilter = 'all' | Booking['status']

interface BookingWithItems extends Booking {
  booking_items: (BookingItem & { products: Product })[]
}

const statusColors: Record<Booking['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
}

export function PrivateBookingsView() {
  const [bookings, setBookings] = useState<BookingWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<BookingWithItems | null>(null)

  async function fetchBookings() {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('*, booking_items(*, products(*))')
      .order('rental_date', { ascending: false })

    setBookings((data as BookingWithItems[] | null) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return bookings
    return bookings.filter((b) => b.status === statusFilter)
  }, [bookings, statusFilter])

  function toggleExpand(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setExpandedId((prev) => (prev === id ? null : id))
  }

  async function updateStatus(bookingId: string, status: Booking['status']) {
    await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId)

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    )
    if (selected?.id === bookingId) {
      setSelected((prev) => (prev ? { ...prev, status } : null))
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function formatCurrency(amount: number) {
    return `$${amount.toFixed(2)}`
  }

  function getPrimaryProductName(booking: BookingWithItems) {
    const primary = booking.booking_items.find(
      (i) => i.products?.type === 'primary',
    )
    return primary?.products?.name ?? booking.booking_items[0]?.products?.name ?? '—'
  }

  function getAddons(booking: BookingWithItems) {
    return booking.booking_items.filter(
      (i) => i.products?.type !== 'primary',
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

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No bookings found.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Booking #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((booking) => {
                const isExpanded = expandedId === booking.id
                const addons = getAddons(booking)
                return (
                  <>
                    <TableRow
                      key={booking.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(booking)}
                    >
                      <TableCell className="w-10 px-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={(e) => toggleExpand(e, booking.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {booking.booking_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.customer_name}</p>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="size-3" />
                              {booking.customer_email}
                            </span>
                            {booking.customer_phone && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="size-3" />
                                {booking.customer_phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {getPrimaryProductName(booking)}
                      </TableCell>
                      <TableCell>{formatDate(booking.rental_date)}</TableCell>
                      <TableCell>
                        <Badge
                          className={statusColors[booking.status]}
                          variant="outline"
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(booking.total_amount)}
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow key={`${booking.id}-detail`} className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={7} className="px-6 py-4">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {addons.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                  Add-ons
                                </p>
                                <div className="space-y-1">
                                  {addons.map((item) => (
                                    <p key={item.id} className="text-sm">
                                      {item.products?.name ?? 'Unknown'}
                                      {item.quantity > 1 && (
                                        <span className="text-muted-foreground"> × {item.quantity}</span>
                                      )}
                                      <span className="text-muted-foreground ml-1">
                                        ({formatCurrency(item.total_price)})
                                      </span>
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}

                            {booking.delivery_address && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                  Delivery Address
                                </p>
                                <p className="text-sm flex items-start gap-1.5">
                                  <MapPin className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                                  {booking.delivery_address}
                                </p>
                              </div>
                            )}

                            {booking.notes && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                  Notes
                                </p>
                                <p className="text-sm">{booking.notes}</p>
                              </div>
                            )}

                            {addons.length === 0 && !booking.delivery_address && !booking.notes && (
                              <p className="text-sm text-muted-foreground">No add-ons, address, or notes.</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )
              })}
            </TableBody>
          </Table>
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
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                    Status
                  </h4>
                  <Badge
                    className={statusColors[selected.status]}
                    variant="outline"
                  >
                    {selected.status}
                  </Badge>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                    Customer
                  </h4>
                  <p className="font-medium">{selected.customer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selected.customer_email}
                  </p>
                  {selected.customer_phone && (
                    <p className="text-sm text-muted-foreground">
                      {selected.customer_phone}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                    Rental Date
                  </h4>
                  <p className="font-medium">
                    {formatDate(selected.rental_date)}
                  </p>
                </div>

                {selected.delivery_address && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                      Delivery Address
                    </h4>
                    <p className="text-sm">{selected.delivery_address}</p>
                  </div>
                )}

                {selected.notes && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                      Notes
                    </h4>
                    <p className="text-sm">{selected.notes}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                    Line Items
                  </h4>
                  <div className="space-y-2">
                    {selected.booking_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>
                          {item.products?.name ?? 'Unknown'}{' '}
                          <span className="text-muted-foreground">
                            × {item.quantity}
                          </span>
                        </span>
                        <span className="font-medium">
                          {formatCurrency(item.total_price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(selected.subtotal)}</span>
                  </div>
                  {selected.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-green-600">
                        -{formatCurrency(selected.discount_amount)}
                      </span>
                    </div>
                  )}
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
                    <Button
                      onClick={() => updateStatus(selected.id, 'completed')}
                    >
                      Mark Completed
                    </Button>
                  )}
                  {(selected.status === 'pending' ||
                    selected.status === 'confirmed') && (
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
