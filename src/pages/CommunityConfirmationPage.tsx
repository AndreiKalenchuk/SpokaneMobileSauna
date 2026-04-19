import { useEffect } from 'react'
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
  Clock,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { SITE_NAME, fullUrl, DEFAULT_OG_IMAGE } from '@/lib/site-config'
import { supabase } from '@/lib/supabase'
import { useCommunityBookingStore } from '@/stores/communityBookingStore'
import type { CommunityBooking, CommunityEvent } from '@/types'

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(time: string): string {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function generateICS(
  booking: CommunityBooking,
  event: CommunityEvent | null,
): string {
  const [year, month, day] = booking.event_date.split('-').map(Number)
  const [sh, sm] = booking.slot_time.slice(0, 5).split(':').map(Number)
  const duration = event?.slot_minutes ?? 60
  const endMinTotal = sh * 60 + sm + duration
  const eh = Math.floor(endMinTotal / 60)
  const em = endMinTotal % 60

  const pad = (n: number) => String(n).padStart(2, '0')
  const dtStart = `${year}${pad(month)}${pad(day)}T${pad(sh)}${pad(sm)}00`
  const dtEnd = `${year}${pad(month)}${pad(day)}T${pad(eh)}${pad(em)}00`

  const location = event?.location ?? '1921 W 10th Ave, Spokane, WA 99204'

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Spokane Mobile Sauna//Community Sauna//EN',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:Community Sauna Session`,
    `DESCRIPTION:Booking #${booking.booking_number}\\nBring your towel\\, robe\\, sandals\\, and water.`,
    `LOCATION:${location}`,
    `UID:${booking.id}@spokanemobilesauna.com`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}

function downloadICS(booking: CommunityBooking, event: CommunityEvent | null) {
  const content = generateICS(booking, event)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `community-sauna-${booking.booking_number}.ics`
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
        <Check className="size-7 text-white" strokeWidth={3} />
      </motion.div>
    </motion.div>
  )
}

export default function CommunityConfirmationPage() {
  const { id } = useParams()
  const resetBooking = useCommunityBookingStore((s) => s.reset)

  useEffect(() => {
    resetBooking()
  }, [resetBooking])

  const { data: booking, isLoading } = useQuery({
    queryKey: ['community-booking', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_bookings')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as CommunityBooking
    },
    enabled: !!id,
    retry: 1,
  })

  const { data: event } = useQuery({
    queryKey: ['community-event', booking?.event_date],
    queryFn: async () => {
      if (!booking) return null
      const { data } = await supabase
        .from('community_events')
        .select('*')
        .eq('event_date', booking.event_date)
        .maybeSingle()
      return data as CommunityEvent | null
    },
    enabled: !!booking?.event_date,
  })

  if (isLoading) {
    return (
      <div className="py-12 md:py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <Skeleton className="mx-auto size-20 rounded-full" />
          <Skeleton className="mx-auto mt-6 h-10 w-72" />
          <Skeleton className="mx-auto mt-4 h-5 w-48" />
          <Skeleton className="mt-8 h-64 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Reservation Confirmed — {SITE_NAME}</title>
        <meta
          name="description"
          content="Your Community Sauna reservation is confirmed."
        />
        <meta property="og:url" content={fullUrl(`/community/confirmation/${id}`)} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <link rel="canonical" href={fullUrl(`/community/confirmation/${id ?? ''}`)} />
      </Helmet>

      <div className="py-12 md:py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <CheckmarkAnimation />

            <h1 className="text-3xl md:text-4xl font-bold">
              Your Seat is Reserved!
            </h1>

            <p className="mt-2 text-lg text-muted-foreground">
              Booking reference:{' '}
              <span className="font-mono font-semibold text-foreground">
                {booking?.booking_number ?? id}
              </span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="mt-8">
              <CardContent className="p-6 space-y-4">
                {booking && (
                  <>
                    <div className="flex items-start gap-3">
                      <Calendar className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">
                          {formatDisplayDate(booking.event_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Arrival</p>
                        <p className="font-medium">
                          {formatTime(booking.slot_time)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Users className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Guests</p>
                        <p className="font-medium">
                          {booking.quantity}{' '}
                          {booking.quantity === 1 ? 'person' : 'people'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">
                          {event?.location ?? '1921 W 10th Ave, Spokane, WA 99204'}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(booking.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
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
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="mt-6">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">What to bring</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                    Towel and robe
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                    Change of clothes and sandals
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                    Water bottle to stay hydrated
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                    Arrive 10 minutes early so you don't miss your hour
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

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
                onClick={() => downloadICS(booking, event ?? null)}
                className="flex items-center gap-2"
              >
                <CalendarPlus className="size-4" />
                Add to Calendar
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    </>
  )
}
