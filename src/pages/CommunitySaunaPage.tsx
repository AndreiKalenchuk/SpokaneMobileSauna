import { useMemo, useState, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { DayPicker } from 'react-day-picker'
import type { DayButtonProps } from 'react-day-picker'
import { motion } from 'framer-motion'
import {
  MapPin,
  Clock,
  CalendarDays,
  Users,
  ArrowRight,
  Minus,
  Plus,
  Flame,
  Droplets,
  Shirt,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { SITE_NAME, fullUrl, DEFAULT_OG_IMAGE } from '@/lib/site-config'
import { useCommunityEvents } from '@/hooks/useCommunityEvents'
import { useCommunityAvailability } from '@/hooks/useCommunityAvailability'
import { useProducts } from '@/hooks/useProducts'
import { useCommunityBookingStore } from '@/stores/communityBookingStore'
import { cn } from '@/lib/utils'
import {
  formatDateToISO,
  formatTime,
  formatDisplayDate,
  generateSlotTimes,
  isSlotPast,
} from '@/lib/community'
import type { CommunityEvent } from '@/types'

const COMMUNITY_PRICE_FALLBACK = 29.95

function createCommunityDayButton(
  eventDates: Set<string>,
) {
  return function CommunityDayButton({
    day,
    modifiers,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    className,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    children,
    ...buttonProps
  }: DayButtonProps) {
    const date = day.date
    const dateStr = formatDateToISO(date)
    const isEvent = eventDates.has(dateStr)
    const isDisabled = modifiers.disabled
    const isSelected = modifiers.selected
    const isOutside = modifiers.outside
    const isToday = modifiers.today

    if (isOutside) return <div />

    const dayClasses = cn(
      'relative flex flex-col items-center justify-center rounded-lg p-1 text-sm transition-all w-full aspect-square',
      isEvent && !isDisabled && 'cursor-pointer bg-accent/10 text-accent-foreground ring-1 ring-accent/40 hover:ring-2 hover:ring-accent/60',
      !isEvent && !isDisabled && 'opacity-30 cursor-not-allowed',
      isDisabled && 'opacity-20 cursor-not-allowed',
      isSelected && isEvent && 'ring-2 ring-primary bg-primary/10 text-foreground',
      isToday && 'font-bold',
    )

    return (
      <button
        {...buttonProps}
        className={dayClasses}
        disabled={isDisabled || !isEvent}
      >
        <span className="text-sm leading-none">{date.getDate()}</span>
        {isEvent && !isDisabled && (
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-accent" />
        )}
      </button>
    )
  }
}

const howItWorks = [
  {
    icon: CalendarDays,
    title: '1. Pick your date & time',
    text: 'Choose an available Community Sauna arrival time on our calendar.',
  },
  {
    icon: Shirt,
    title: '2. Bring your essentials',
    text: 'Towel, robe, change of clothes, sandals, and a water bottle.',
  },
  {
    icon: Flame,
    title: '3. Show up & relax',
    text: 'Arrive 10 minutes early, pay on the site, then enjoy your hour.',
  },
]

export default function CommunitySaunaPage() {
  const navigate = useNavigate()
  const { data: events, isLoading: eventsLoading } = useCommunityEvents()
  const { data: products } = useProducts()

  const {
    selectedEventDate,
    selectedSlotTime,
    quantity,
    setSelectedEventDate,
    setSelectedSlotTime,
    setQuantity,
  } = useCommunityBookingStore()

  const { data: availability } = useCommunityAvailability(selectedEventDate)

  const communityProduct = products?.find((p) => p.slug === 'community-sauna')
  const price = communityProduct?.base_price ?? COMMUNITY_PRICE_FALLBACK

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CommunityEvent>()
    for (const e of events ?? []) map.set(e.event_date, e)
    return map
  }, [events])

  const eventDates = useMemo(
    () => new Set(Array.from(eventsByDate.keys())),
    [eventsByDate],
  )

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const [month, setMonth] = useState(today)

  const selectedEvent = selectedEventDate
    ? eventsByDate.get(selectedEventDate)
    : undefined

  const bookedBySlot = useMemo(() => {
    const map = new Map<string, number>()
    for (const row of availability ?? []) {
      map.set(row.slot_time.slice(0, 8), row.booked_quantity)
    }
    return map
  }, [availability])

  useEffect(() => {
    if (selectedEventDate && !eventDates.has(selectedEventDate)) {
      setSelectedEventDate(null)
    }
  }, [selectedEventDate, eventDates, setSelectedEventDate])

  const isDateDisabled = useCallback(
    (date: Date) => {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      if (d < today) return true
      return !eventDates.has(formatDateToISO(date))
    },
    [eventDates, today],
  )

  const CustomDayButton = useMemo(
    () => createCommunityDayButton(eventDates),
    [eventDates],
  )

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      setSelectedEventDate(date ? formatDateToISO(date) : null)
    },
    [setSelectedEventDate],
  )

  const slotOptions = useMemo(() => {
    if (!selectedEvent) return []
    return generateSlotTimes(selectedEvent).map((slotTime) => {
      const booked = bookedBySlot.get(slotTime) ?? 0
      const remaining = Math.max(0, selectedEvent.capacity_per_slot - booked)
      const past = isSlotPast(selectedEvent.event_date, slotTime)
      return {
        slotTime,
        booked,
        remaining,
        capacity: selectedEvent.capacity_per_slot,
        past,
        full: remaining === 0,
      }
    })
  }, [selectedEvent, bookedBySlot])

  const selectedSlotInfo = selectedSlotTime
    ? slotOptions.find((s) => s.slotTime === selectedSlotTime)
    : undefined

  const maxQty = selectedSlotInfo?.remaining ?? 1

  useEffect(() => {
    if (quantity > maxQty) {
      setQuantity(Math.max(1, maxQty))
    }
  }, [maxQty, quantity, setQuantity])

  function handleReserve() {
    if (!selectedEventDate || !selectedSlotTime) return
    navigate('/community/checkout')
  }

  if (eventsLoading) {
    return (
      <div className="py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="mx-auto h-10 w-72" />
          <Skeleton className="mx-auto mt-4 h-5 w-96" />
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
            <Skeleton className="h-[500px] w-full rounded-xl" />
            <Skeleton className="h-[500px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Community Sauna — {SITE_NAME}</title>
        <meta
          name="description"
          content="Book a single seat at our weekly Community Sauna in Spokane. $29.95 per person, 1-hour sessions."
        />
        <meta property="og:title" content={`Community Sauna — ${SITE_NAME}`} />
        <meta
          property="og:description"
          content="Book a single seat at our weekly Community Sauna in Spokane. $29.95 per person, 1-hour sessions."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={fullUrl('/community')} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={fullUrl('/community')} />
      </Helmet>

      <div className="py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 md:mb-14"
          >
            <Badge variant="secondary" className="mb-4">
              Weekly Community Event
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold">Community Sauna</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              One-hour drop-in sauna sessions at{' '}
              <span className="font-medium text-foreground">
                1921 W 10th Ave, Spokane
              </span>
              . Reserve your seat for{' '}
              <span className="font-bold text-primary">${price.toFixed(2)}</span>
              /person.
            </p>
          </motion.div>

          {/* How it works */}
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            {howItWorks.map((step) => (
              <Card key={step.title}>
                <CardContent className="p-5">
                  <step.icon className="size-6 text-accent mb-2" />
                  <h3 className="font-semibold text-sm">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!events || events.length === 0) ? (
            <Card>
              <CardContent className="p-10 text-center space-y-3">
                <CalendarDays className="mx-auto size-10 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No upcoming events</h3>
                <p className="text-sm text-muted-foreground">
                  We don't have any Community Sauna dates scheduled yet. Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
              {/* Calendar */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card>
                  <CardContent className="p-4 md:p-6">
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg">Select a date</h3>
                      <p className="text-sm text-muted-foreground">
                        Only highlighted dates are Community Sauna days.
                      </p>
                    </div>

                    <div className="booking-calendar">
                      <DayPicker
                        mode="single"
                        selected={
                          selectedEventDate
                            ? new Date(selectedEventDate + 'T12:00:00')
                            : undefined
                        }
                        onSelect={handleDateSelect}
                        month={month}
                        onMonthChange={setMonth}
                        disabled={isDateDisabled}
                        fromMonth={today}
                        components={{
                          DayButton: CustomDayButton,
                        }}
                        classNames={{
                          root: 'w-full',
                          months: 'w-full',
                          month: 'w-full',
                          month_caption: 'flex items-center justify-center mb-4',
                          caption_label: 'text-lg font-bold',
                          nav: 'flex items-center justify-between absolute inset-x-0 top-0 px-1',
                          button_previous:
                            'size-9 flex items-center justify-center rounded-lg border hover:bg-muted transition-colors',
                          button_next:
                            'size-9 flex items-center justify-center rounded-lg border hover:bg-muted transition-colors',
                          weekdays: 'grid grid-cols-7 gap-1 mb-1',
                          weekday:
                            'text-xs font-medium text-muted-foreground text-center py-2',
                          weeks: 'grid gap-1',
                          week: 'grid grid-cols-7 gap-1',
                          day: 'relative',
                          outside: 'invisible',
                          today: '',
                          selected: '',
                          disabled: '',
                        }}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground border-t pt-3">
                      <span className="flex items-center gap-1.5">
                        <span className="size-3 rounded bg-accent/15 ring-1 ring-accent/40" />
                        <span className="size-2 rounded-full bg-accent inline-block" />
                        Community Sauna day
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-3 rounded bg-primary/10 ring-2 ring-primary" />
                        Selected
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Slot Picker */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="sticky top-24">
                  <CardContent className="p-6 space-y-5">
                    {!selectedEvent ? (
                      <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                        <CalendarDays className="mx-auto size-8 text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Select a Community Sauna date to see available arrival times.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                            Selected Date
                          </p>
                          <p className="text-lg font-bold mt-1">
                            {formatDisplayDate(selectedEvent.event_date)}
                          </p>
                          <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                            <p className="flex items-center gap-1.5">
                              <MapPin className="size-4 shrink-0" />
                              {selectedEvent.location}
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Clock className="size-4 shrink-0" />
                              Open {formatTime(selectedEvent.start_time)} –{' '}
                              {formatTime(selectedEvent.end_time)}
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Users className="size-4 shrink-0" />
                              Up to {selectedEvent.capacity_per_slot} people per slot
                            </p>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">
                            Choose arrival time
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {slotOptions.map((s) => {
                              const disabled = s.full || s.past
                              const isSelected = selectedSlotTime === s.slotTime
                              return (
                                <button
                                  key={s.slotTime}
                                  type="button"
                                  onClick={() =>
                                    !disabled && setSelectedSlotTime(s.slotTime)
                                  }
                                  disabled={disabled}
                                  className={cn(
                                    'rounded-lg border p-3 text-left transition-all',
                                    disabled &&
                                      'opacity-50 cursor-not-allowed bg-muted/50',
                                    !disabled &&
                                      !isSelected &&
                                      'hover:border-primary/40 hover:bg-muted/30',
                                    isSelected &&
                                      'border-primary ring-2 ring-primary/30 bg-primary/5',
                                  )}
                                >
                                  <p className="font-semibold text-sm">
                                    {formatTime(s.slotTime)}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {s.past
                                      ? 'Closed'
                                      : s.full
                                        ? 'Full'
                                        : `${s.remaining} of ${s.capacity} left`}
                                  </p>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {selectedSlotInfo && !selectedSlotInfo.full && !selectedSlotInfo.past && (
                          <>
                            <Separator />

                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">
                                Number of people
                              </p>
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setQuantity(quantity - 1)}
                                  disabled={quantity <= 1}
                                >
                                  <Minus className="size-4" />
                                </Button>
                                <span className="flex-1 text-center text-lg font-semibold">
                                  {quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setQuantity(quantity + 1)}
                                  disabled={quantity >= maxQty}
                                >
                                  <Plus className="size-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                Max {maxQty} per reservation based on seats left.
                              </p>
                            </div>

                            <Separator />

                            <div className="space-y-1.5">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  ${price.toFixed(2)} × {quantity}
                                </span>
                                <span>${(price * quantity).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center pt-1">
                                <span className="text-lg font-bold">Subtotal</span>
                                <span className="text-2xl font-bold text-primary">
                                  ${(price * quantity).toFixed(2)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Tax calculated at checkout
                              </p>
                            </div>
                          </>
                        )}

                        <Button
                          size="lg"
                          className="w-full h-12 text-base"
                          onClick={handleReserve}
                          disabled={
                            !selectedSlotTime ||
                            selectedSlotInfo?.full ||
                            selectedSlotInfo?.past
                          }
                        >
                          Reserve My Seat
                          <ArrowRight className="ml-2 size-4" />
                        </Button>

                        <p className="text-xs text-muted-foreground flex items-start gap-2 pt-1">
                          <Droplets className="size-3.5 shrink-0 mt-0.5" />
                          Bring your own towel, robe, change of clothes, and water.
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          <div className="mt-10 text-center text-sm text-muted-foreground">
            Want the whole sauna to yourself?{' '}
            <Link to="/book" className="text-primary hover:underline font-medium">
              Book a Private Sauna Rental
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
