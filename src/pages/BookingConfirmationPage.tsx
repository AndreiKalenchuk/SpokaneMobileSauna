import { useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Check,
  CalendarPlus,
  Home,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { useBookingStore } from '@/stores/bookingStore'
import type { Booking, BookingItem } from '@/types'

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function generateICS(booking: Booking): string {
  const [year, month, day] = booking.rental_date.split('-').map(Number)
  const startDate = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`
  const nextDay = new Date(year, month - 1, day + 1)
  const endDate = `${nextDay.getFullYear()}${String(nextDay.getMonth() + 1).padStart(2, '0')}${String(nextDay.getDate()).padStart(2, '0')}`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mobile Sauna Rental//Booking//EN',
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${startDate}`,
    `DTEND;VALUE=DATE:${endDate}`,
    `SUMMARY:Mobile Sauna Rental`,
    `DESCRIPTION:Booking #${booking.booking_number}\\nDelivered before 2 PM\\, pickup next day after 10 AM.${booking.delivery_address ? `\\nAddress: ${booking.delivery_address}` : ''}`,
    booking.delivery_address ? `LOCATION:${booking.delivery_address}` : '',
    `UID:${booking.id}@mobilesaunarental.com`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  return lines.join('\r\n')
}

function downloadICS(booking: Booking) {
  const content = generateICS(booking)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `sauna-booking-${booking.booking_number}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function CheckmarkAnimation() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
      className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-green-100"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.4 }}
        className="flex size-14 items-center justify-center rounded-full bg-green-500"
      >
        <motion.div
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Check className="size-7 text-white" strokeWidth={3} />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

function ConfirmationSkeleton() {
  return (
    <main className="py-12 md:py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
        <Skeleton className="mx-auto size-20 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-10 w-72" />
        <Skeleton className="mx-auto mt-4 h-5 w-48" />
        <Skeleton className="mt-8 h-64 w-full rounded-xl" />
      </div>
    </main>
  )
}

export default function BookingConfirmationPage() {
  const { id } = useParams()
  const resetBooking = useBookingStore((s) => s.reset)

  useEffect(() => {
    resetBooking()
  }, [resetBooking])

  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Booking
    },
    enabled: !!id,
    retry: 1,
  })

  const { data: bookingItems } = useQuery({
    queryKey: ['bookingItems', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('booking_items')
        .select('*, product:products(name)')
        .eq('booking_id', id)
      if (error) throw error
      return data as (BookingItem & { product: { name: string } })[]
    },
    enabled: !!id,
    retry: 1,
  })

  const isMocked = useMemo(
    () => !booking && !bookingLoading && !!id,
    [booking, bookingLoading, id],
  )

  if (bookingLoading) return <ConfirmationSkeleton />

  return (
    <>
      <Helmet>
        <title>Booking Confirmed — Mobile Sauna Rental</title>
      </Helmet>

      <main className="py-12 md:py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <CheckmarkAnimation />

            <h1 className="text-3xl md:text-4xl font-bold">
              Your Sauna is Booked!
            </h1>

            <p className="mt-2 text-lg text-muted-foreground">
              Booking reference:{' '}
              <span className="font-mono font-semibold text-foreground">
                {booking?.booking_number ?? id}
              </span>
            </p>
          </motion.div>

          {/* Booking Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="mt-8">
              <CardContent className="p-6 space-y-4">
                {booking ? (
                  <>
                    <div className="flex items-start gap-3">
                      <Calendar className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">
                          {formatDisplayDate(booking.rental_date)}
                        </p>
                      </div>
                    </div>

                    {booking.delivery_address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-sm text-muted-foreground">Delivery Address</p>
                          <p className="font-medium">{booking.delivery_address}</p>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Line Items */}
                    {bookingItems && bookingItems.length > 0 && (
                      <div className="space-y-2">
                        {bookingItems.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.product?.name ?? 'Item'}
                              {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                            </span>
                            <span>{formatCurrency(item.total_price)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-start gap-3">
                      <CreditCard className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatCurrency(booking.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-muted-foreground">Tax</span>
                          <span>{formatCurrency(booking.tax_amount)}</span>
                        </div>
                        <div className="flex justify-between font-bold mt-2 text-lg">
                          <span>Total Paid</span>
                          <span className="text-primary">
                            {formatCurrency(booking.total_amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : isMocked ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Booking details will appear here once the payment backend is connected.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>

          {/* Confirmation email */}
          {booking?.customer_email && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <Mail className="size-4" />
              A confirmation email has been sent to{' '}
              <span className="font-medium text-foreground">
                {booking.customer_email}
              </span>
            </motion.div>
          )}

          {/* What to expect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="mt-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">What to Expect</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                    We'll contact you 24 hours before your rental to confirm delivery details.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                    Please ensure the delivery area is clear — level surface with 4 ft clearance from structures.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                    The sauna will be delivered before 2 PM and picked up the next day after 10 AM.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button asChild size="lg">
              <Link to="/" className="flex items-center gap-2">
                <Home className="size-4" />
                Return to Home
              </Link>
            </Button>

            {booking && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => downloadICS(booking)}
                className="flex items-center gap-2"
              >
                <CalendarPlus className="size-4" />
                Add to Calendar
              </Button>
            )}
          </motion.div>
        </div>
      </main>
    </>
  )
}
