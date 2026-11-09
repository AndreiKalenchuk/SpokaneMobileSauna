import { useState, useMemo, useCallback, useEffect, useId } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SITE_NAME, fullUrl, DEFAULT_OG_IMAGE } from '@/lib/site-config'
import { DayPicker } from 'react-day-picker'
import type { DayButtonProps } from 'react-day-picker'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  Truck,
  Flame,
  Clock,
  Shield,
  Thermometer,
  Users,
  Wrench,
  Minus,
  Plus,
  MapPin,
  ArrowRight,
  Loader2,
  Navigation,
  Route,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useProducts } from '@/hooks/useProducts'
import { useAvailability } from '@/hooks/useAvailability'
import { usePricingRules } from '@/hooks/usePricingRules'
import { useDeliverySettings } from '@/hooks/useDeliverySettings'
import { getPriceForDate, calculateOrderTotals } from '@/lib/pricing'
import {
  fetchDeliveryQuote,
  fillDeliveryTokens,
  formatMiles,
  formatMoney,
  fulfillmentFeeFor,
  pickupPriceText,
} from '@/lib/delivery'
import type { DeliveryQuote, DeliverySettings, FulfillmentMethod } from '@/lib/delivery'
import { cn } from '@/lib/utils'
import { useBookingStore } from '@/stores/bookingStore'
import type { Product, PricingRule } from '@/types'

function rentalInclusions(s: DeliverySettings) {
  const delivery = `Delivery from ${formatMoney(s.delivery_base_fee)}`
  const pickup = `${pickupPriceText(s)} pickup right off ${s.pickup_exit}`

  return [
    { icon: Clock, text: 'Daily rental (ready by 2 PM, back the next day after 10 AM)' },
    {
      icon: Truck,
      text:
        s.delivery_enabled && s.pickup_enabled
          ? `${delivery}, or ${pickup}`
          : s.delivery_enabled
            ? delivery
            : pickup.charAt(0).toUpperCase() + pickup.slice(1),
    },
    ...(s.delivery_enabled
      ? [{ icon: Wrench, text: 'Professional setup & teardown with delivery' }]
      : []),
    { icon: Shield, text: 'Safety orientation walkthrough' },
    { icon: Thermometer, text: 'Cedar bucket, ladle & thermometer' },
    { icon: Users, text: 'Seating for up to 6' },
    { icon: Flame, text: 'Firewood for ~1 hr heat build + 40 min session' },
  ]
}

function formatDateToMonth(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function formatDateToISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function getDateType(
  date: Date,
  pricingRules: PricingRule[],
  primaryProductId: string | undefined,
): 'holiday' | 'weekend' | 'weekday' {
  if (!primaryProductId) return 'weekday'

  const dateStr = formatDateToISO(date)
  const productRules = pricingRules.filter(
    (r) => r.product_id === primaryProductId && r.is_active,
  )

  for (const rule of productRules) {
    if (rule.specific_dates?.includes(dateStr)) {
      return 'holiday'
    }
  }

  const day = date.getDay()
  if (day === 0 || day === 5 || day === 6) return 'weekend'
  return 'weekday'
}

// --- Loading Skeleton ---

function BookingSkeleton() {
  return (
    <div className="py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Skeleton className="mx-auto h-10 w-72" />
          <Skeleton className="mx-auto mt-4 h-5 w-96" />
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-[380px] w-full rounded-xl" />
          </div>
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// --- Rental Info Panel ---

function RentalInfoPanel() {
  const [isOpen, setIsOpen] = useState(true)
  const settings = useDeliverySettings()

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-4 text-left md:cursor-default"
        aria-expanded={isOpen}
      >
        <div>
          <h3 className="font-semibold text-lg">What's Included</h3>
          <p className="text-sm text-muted-foreground">Every rental comes with</p>
        </div>
        <ChevronDown
          className={cn(
            'size-5 text-muted-foreground transition-transform md:hidden',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0 pb-5">
              <ul className="space-y-3">
                {rentalInclusions(settings).map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <Icon className="mt-0.5 size-4 shrink-0 text-secondary" />
                    <span className="text-sm leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-lg bg-muted/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                Up to 15% slope, accessible surface required. 4 ft clearance from structures.
              </p>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

// --- Custom Day Button ---

function createCustomDayButton(
  primaryProduct: Product | undefined,
  pricingRules: PricingRule[],
  bookedDates: Set<string>,
  blockedDates: Set<string>,
  _blockedReasons: Map<string, string | null>,
) {
  return function CustomDayButton({
    day,
    modifiers,
    className,
    children,
    ...buttonProps
  }: DayButtonProps) {
    const date = day.date
    const dateStr = formatDateToISO(date)
    const isBooked = bookedDates.has(dateStr)
    const isBlocked = blockedDates.has(dateStr)
    const isDisabled = modifiers.disabled
    const isSelected = modifiers.selected
    const isOutside = modifiers.outside
    const isToday = modifiers.today

    if (isOutside) return <div />

    const dateType = getDateType(date, pricingRules, primaryProduct?.id)
    const price = primaryProduct
      ? getPriceForDate(primaryProduct, date, pricingRules)
      : null

    const dayClasses = cn(
      'relative flex flex-col items-center justify-center rounded-lg p-1 text-sm transition-all w-full aspect-square',
      !isDisabled && !isBooked && !isBlocked && 'cursor-pointer hover:ring-2 hover:ring-primary/30',
      isDisabled && !isBooked && !isBlocked && 'opacity-40 cursor-not-allowed',
      isBooked && 'bg-muted/70 cursor-not-allowed',
      isBlocked && 'bg-muted/70 cursor-not-allowed',
      isSelected && !isDisabled && 'ring-2 ring-primary bg-primary/10',
      !isSelected && !isDisabled && !isBooked && !isBlocked && dateType === 'weekend' && 'bg-amber-50',
      !isSelected && !isDisabled && !isBooked && !isBlocked && dateType === 'holiday' && 'bg-accent/10',
      !isSelected && !isDisabled && !isBooked && !isBlocked && dateType === 'weekday' && 'bg-card',
      isToday && 'font-bold',
    )

    return (
      <button
        {...buttonProps}
        className={dayClasses}
        disabled={isDisabled || isBooked || isBlocked}
      >
        <span className={cn(
          'text-sm leading-none',
          (isBooked || isBlocked) && 'line-through text-muted-foreground',
        )}>
          {date.getDate()}
        </span>

        {(isBooked || isBlocked) && (
          <span className="size-1.5 rounded-full bg-muted-foreground/40 mt-1" />
        )}

        {!isBooked && !isBlocked && !isDisabled && price !== null && (
          <span className={cn(
            'text-[10px] leading-none mt-0.5 font-medium',
            dateType === 'holiday' && 'text-accent',
            dateType === 'weekend' && 'text-amber-600',
            dateType === 'weekday' && 'text-muted-foreground',
            isSelected && 'text-primary',
          )}>
            ${price}
          </span>
        )}

        {dateType === 'holiday' && !isBooked && !isBlocked && !isDisabled && (
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-accent" />
        )}
      </button>
    )
  }
}

// --- Calendar Color Legend ---

function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded border bg-card" />
        Weekday
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded bg-amber-50 border border-amber-200" />
        Weekend
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded bg-accent/15 border border-accent/30" />
        <span className="size-2 rounded-full bg-accent inline-block" />
        Holiday
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded bg-muted/70 border" />
        Unavailable
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded bg-primary/10 border-2 border-primary" />
        Selected
      </span>
    </div>
  )
}

// --- Add-On Card ---

function AddOnToggleCard({
  product,
  selectedDate,
  pricingRules,
  isSelected,
  quantity,
  onToggle,
  onQuantityChange,
  showQuantity,
}: {
  product: Product
  selectedDate: Date
  pricingRules: PricingRule[]
  isSelected: boolean
  quantity: number
  onToggle: () => void
  onQuantityChange: (qty: number) => void
  showQuantity: boolean
}) {
  const price = getPriceForDate(product, selectedDate, pricingRules)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={isSelected}
        className={cn(
          'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all',
          isSelected
            ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
            : 'border-border hover:border-primary/30 hover:bg-muted/30',
        )}
      >
        <div className="pt-0.5">
          {/* Visual-only checkbox: a Radix Checkbox is a <button> and can't nest in this one */}
          <span
            aria-hidden
            className={cn(
              'flex size-4 items-center justify-center rounded-[4px] border shadow-xs transition-colors',
              isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
            )}
          >
            {isSelected && <Check className="size-3.5" />}
          </span>
        </div>

        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            width={48}
            height={48}
            loading="lazy"
            decoding="async"
            className="size-12 shrink-0 rounded-lg object-cover"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm leading-tight">{product.name}</p>
            <span className="text-sm font-semibold text-primary shrink-0">
              +{formatCurrency(price)}
            </span>
          </div>
          {product.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isSelected && showQuantity && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 mt-2 ml-10 pl-1">
              <span className="text-xs text-muted-foreground">Qty:</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onQuantityChange(Math.max(1, quantity - 1))
                  }}
                  disabled={quantity <= 1}
                >
                  <Minus className="size-3" />
                </Button>
                <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onQuantityChange(Math.min(5, quantity + 1))
                  }}
                  disabled={quantity >= 5}
                >
                  <Plus className="size-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// --- Delivery or Pickup ---

function fulfillmentOptions(s: DeliverySettings): {
  method: FulfillmentMethod
  icon: typeof Truck
  title: string
  detail: string
}[] {
  return [
    s.delivery_enabled && {
      method: 'delivery' as const,
      icon: Truck,
      title: 'Delivery',
      detail: `From ${formatMoney(s.delivery_base_fee)} · setup included`,
    },
    s.pickup_enabled && {
      method: 'pickup' as const,
      icon: MapPin,
      title: 'Pickup',
      detail: `${s.pickup_fee > 0 ? formatMoney(s.pickup_fee) : 'Free'} · ${s.pickup_exit}`,
    },
  ].filter((o) => !!o)
}

function PickupInfo() {
  const settings = useDeliverySettings()

  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted/60 px-3 py-2.5">
      <Navigation className="mt-0.5 size-4 shrink-0 text-secondary" />
      <div className="text-xs leading-relaxed">
        <p className="text-sm font-medium">
          {settings.pickup_exit} · {settings.pickup_street}
        </p>
        <p className="mt-0.5 text-muted-foreground">
          {fillDeliveryTokens(settings.pickup_note, settings)}
        </p>
      </div>
    </div>
  )
}

function DeliveryQuoteResult({ quote }: { quote: DeliveryQuote }) {
  const { pickup_enabled } = useDeliverySettings()

  if (!quote.withinServiceArea) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs leading-relaxed">
        <p className="text-sm font-medium text-destructive">
          {quote.miles.toFixed(1)} miles — outside our delivery area
        </p>
        <p className="mt-0.5 text-muted-foreground">
          We deliver up to {formatMiles(quote.maxMiles)} driving miles.{' '}
          {pickup_enabled ? 'Choose pickup, or ' : ''}
          <Link to="/contact" className="text-primary underline underline-offset-2">
            {pickup_enabled ? 'contact us' : 'Contact us'}
          </Link>{' '}
          about a custom delivery.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-success/30 bg-success/5 px-3 py-2.5 text-xs leading-relaxed">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Route className="size-4 text-success" />
          {quote.miles.toFixed(1)} driving miles
        </p>
        <span className="text-sm font-semibold">{formatCurrency(quote.fee)}</span>
      </div>
      <p className="mt-1 text-muted-foreground">
        {quote.extraMiles > 0
          ? `${formatMoney(quote.baseFee)} + ${formatMiles(quote.extraMiles)} extra mi × ${formatMoney(quote.ratePerExtraMile)}`
          : `Within ${formatMiles(quote.includedMiles)} miles — flat ${formatMoney(quote.baseFee)}`}
      </p>
      <p className="mt-1 truncate text-muted-foreground" title={quote.matchedAddress}>
        Matched: {quote.matchedAddress}
      </p>
      <p className="mt-1.5 text-[10px] text-muted-foreground/70">
        Road distance by OSRM · © OpenStreetMap contributors
      </p>
    </div>
  )
}

function DeliveryQuoteForm() {
  const settings = useDeliverySettings()
  const { deliveryAddress, deliveryQuote, setDeliveryAddress, setDeliveryQuote } =
    useBookingStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputId = useId()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (deliveryAddress.trim().length < 5) {
      setError('Please enter your full street address.')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      setDeliveryQuote(await fetchDeliveryQuote(deliveryAddress))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not calculate delivery.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        {formatMoney(settings.delivery_base_fee)} covers the first{' '}
        {formatMiles(settings.delivery_included_miles)} driving miles, then{' '}
        {formatMoney(settings.delivery_rate_per_extra_mile)} per extra mile.{' '}
        {fillDeliveryTokens(settings.delivery_note, settings)}
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor={inputId} className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="size-4 text-muted-foreground" />
          Delivery Address
        </label>
        <div className="flex gap-2">
          <Input
            id={inputId}
            value={deliveryAddress}
            onChange={(e) => {
              setDeliveryAddress(e.target.value)
              setError(null)
            }}
            placeholder="123 Main St, Spokane, WA 99201"
            autoComplete="street-address"
            aria-invalid={!!error}
          />
          <Button type="submit" variant="outline" disabled={isLoading} className="shrink-0">
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Get Quote'}
          </Button>
        </div>
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {deliveryQuote && <DeliveryQuoteResult quote={deliveryQuote} />}
    </div>
  )
}

function FulfillmentPicker() {
  const settings = useDeliverySettings()
  const { fulfillmentMethod, setFulfillmentMethod } = useBookingStore()
  const options = fulfillmentOptions(settings)
  const { delivery_enabled, pickup_enabled } = settings

  // Admin can turn a method off: preselect the only option, drop a disabled choice
  useEffect(() => {
    const enabled: FulfillmentMethod[] = []
    if (delivery_enabled) enabled.push('delivery')
    if (pickup_enabled) enabled.push('pickup')

    const needsChange = fulfillmentMethod
      ? !enabled.includes(fulfillmentMethod)
      : enabled.length === 1
    if (needsChange && enabled[0]) setFulfillmentMethod(enabled[0])
  }, [delivery_enabled, pickup_enabled, fulfillmentMethod, setFulfillmentMethod])

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
        {options.length > 1 ? 'Delivery or Pickup' : options[0]?.title}
      </p>
      <div
        className={cn('grid gap-2', options.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}
        role="radiogroup"
        aria-label="Delivery or pickup"
      >
        {options.map(({ method, icon: Icon, title, detail }) => {
          const isSelected = fulfillmentMethod === method
          return (
            <button
              key={method}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setFulfillmentMethod(method)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all',
                isSelected
                  ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border hover:border-primary/30 hover:bg-muted/30',
              )}
            >
              <Icon
                className={cn('size-5', isSelected ? 'text-primary' : 'text-muted-foreground')}
              />
              <span className="text-sm font-medium">{title}</span>
              <span className="text-xs text-muted-foreground">{detail}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {fulfillmentMethod && (
          <motion.div
            key={fulfillmentMethod}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {fulfillmentMethod === 'pickup' ? <PickupInfo /> : <DeliveryQuoteForm />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- Pricing Breakdown ---

function PricingBreakdown({
  primaryProduct,
  addons,
  pricingRules,
}: {
  primaryProduct: Product | undefined
  addons: Product[]
  pricingRules: PricingRule[]
}) {
  const {
    selectedDate,
    selectedAddons,
    fulfillmentMethod,
    deliveryQuote,
    toggleAddon,
    setAddonQuantity,
  } = useBookingStore()
  const settings = useDeliverySettings()

  const hasQuantitySelector = useCallback(
    (product: Product) =>
      product.slug?.includes('firewood') || product.name.toLowerCase().includes('firewood'),
    [],
  )

  const calculations = useMemo(
    () =>
      calculateOrderTotals({
        primaryProduct,
        addons,
        selectedAddons,
        date: selectedDate,
        pricingRules,
        fulfillmentFee: fulfillmentFeeFor(fulfillmentMethod, deliveryQuote, settings),
      }),
    [primaryProduct, addons, selectedAddons, selectedDate, pricingRules, fulfillmentMethod, deliveryQuote, settings],
  )

  const canCheckout =
    !!selectedDate &&
    ((fulfillmentMethod === 'pickup' && settings.pickup_enabled) ||
      (fulfillmentMethod === 'delivery' &&
        settings.delivery_enabled &&
        !!deliveryQuote?.withinServiceArea))

  const checkoutHint = !selectedDate
    ? 'Select a Date to Continue'
    : !fulfillmentMethod
      ? 'Choose Delivery or Pickup'
      : deliveryQuote && !deliveryQuote.withinServiceArea
        ? 'Choose Pickup or Another Address'
        : 'Get Your Delivery Quote'

  const dateType = selectedDate && primaryProduct
    ? getDateType(selectedDate, pricingRules, primaryProduct.id)
    : null

  return (
    <div className="space-y-5">
      {/* Selected Date */}
      <div>
        {selectedDate ? (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Selected Date
            </p>
            <p className="text-lg font-bold mt-1">{formatDisplayDate(selectedDate)}</p>
            {dateType && (
              <Badge
                variant="secondary"
                className={cn(
                  'mt-1.5',
                  dateType === 'holiday' && 'bg-accent/15 text-accent-foreground',
                  dateType === 'weekend' && 'bg-amber-100 text-amber-800',
                )}
              >
                {dateType === 'holiday' ? 'Holiday Rate' : dateType === 'weekend' ? 'Weekend Rate' : 'Weekday Rate'}
              </Badge>
            )}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Select a date on the calendar to see pricing
            </p>
          </div>
        )}
      </div>

      {selectedDate && primaryProduct && (
        <>
          <Separator />

          {/* Delivery or Pickup */}
          <FulfillmentPicker />

          <Separator />

          {/* Main Product */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{primaryProduct.name}</p>
              <p className="text-xs text-muted-foreground">
                1 × {formatCurrency(calculations.mainPrice)}
              </p>
            </div>
            <span className="font-semibold">{formatCurrency(calculations.mainPrice)}</span>
          </div>

          <Separator />

          {/* Add-Ons */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">
              Enhance Your Experience
            </p>
            <div className="space-y-2">
              {addons.map((product) => {
                const sa = selectedAddons.find((a) => a.productId === product.id)
                return (
                  <AddOnToggleCard
                    key={product.id}
                    product={product}
                    selectedDate={selectedDate}
                    pricingRules={pricingRules}
                    isSelected={!!sa}
                    quantity={sa?.quantity ?? 1}
                    onToggle={() => toggleAddon(product.id)}
                    onQuantityChange={(qty) => setAddonQuantity(product.id, qty)}
                    showQuantity={hasQuantitySelector(product)}
                  />
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Itemized Summary */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Order Summary
            </p>

            {/* Primary product */}
            <div className="flex justify-between text-sm">
              <span>{primaryProduct.name}</span>
              <span>{formatCurrency(calculations.mainPrice)}</span>
            </div>

            {/* Selected add-ons */}
            {calculations.addonLines.map((line) => (
              <div key={line.name} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {line.name}{line.qty > 1 ? ` × ${line.qty}` : ''}
                </span>
                <span>{formatCurrency(line.lineTotal)}</span>
              </div>
            ))}

            {/* Fulfillment */}
            {fulfillmentMethod === 'pickup' && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pickup ({settings.pickup_exit})</span>
                <span>
                  {calculations.fulfillmentFee > 0
                    ? formatCurrency(calculations.fulfillmentFee)
                    : 'Free'}
                </span>
              </div>
            )}
            {fulfillmentMethod === 'delivery' && calculations.fulfillmentFee > 0 && deliveryQuote && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Delivery ({deliveryQuote.miles.toFixed(1)} mi)
                </span>
                <span>{formatCurrency(calculations.fulfillmentFee)}</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between items-center pt-1">
              <span className="text-lg font-bold">Subtotal</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(calculations.subtotal)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Tax calculated at checkout
            </p>
          </div>
        </>
      )}

      {/* Checkout Button */}
      <Button
        asChild={canCheckout}
        size="lg"
        className="w-full h-12 text-base mt-2"
        disabled={!canCheckout}
      >
        {canCheckout ? (
          <Link to="/booking/checkout" className="flex items-center justify-center gap-2">
            Continue to Checkout
            <ArrowRight className="size-4" />
          </Link>
        ) : (
          <span className="flex items-center justify-center gap-2">
            {checkoutHint}
          </span>
        )}
      </Button>
    </div>
  )
}

// --- Mobile Pricing Sheet ---

function MobilePricingSheet({
  primaryProduct,
  addons,
  pricingRules,
}: {
  primaryProduct: Product | undefined
  addons: Product[]
  pricingRules: PricingRule[]
}) {
  const [isOpen, setIsOpen] = useState(true)
  const { selectedDate, selectedAddons, fulfillmentMethod, deliveryQuote } = useBookingStore()
  const settings = useDeliverySettings()

  const { subtotal } = useMemo(
    () =>
      calculateOrderTotals({
        primaryProduct,
        addons,
        selectedAddons,
        date: selectedDate,
        pricingRules,
        fulfillmentFee: fulfillmentFeeFor(fulfillmentMethod, deliveryQuote, settings),
      }),
    [primaryProduct, addons, selectedAddons, selectedDate, pricingRules, fulfillmentMethod, deliveryQuote, settings],
  )

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex w-full items-center justify-between rounded-xl border bg-card p-4 transition-all',
          selectedDate && 'border-primary/30',
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {selectedDate ? 'Pricing Breakdown' : 'Select a date to see pricing'}
          </span>
          {selectedDate && (
            <span className="text-lg font-bold text-primary">{formatCurrency(subtotal)}</span>
          )}
        </div>
        {selectedDate && (
          isOpen ? (
            <ChevronUp className="size-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-5 text-muted-foreground" />
          )
        )}
      </button>

      <AnimatePresence>
        {isOpen && selectedDate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="mt-3">
              <CardContent className="pt-4">
                <PricingBreakdown
                  primaryProduct={primaryProduct}
                  addons={addons}
                  pricingRules={pricingRules}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- Main Page ---

export default function BookingPage() {
  const { data: products, isLoading: productsLoading } = useProducts()
  const { data: pricingRulesData, isLoading: pricingLoading } = usePricingRules()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [month, setMonth] = useState(today)

  const monthKey = formatDateToMonth(month)
  const { data: availability, isLoading: availabilityLoading } = useAvailability(monthKey)

  const { selectedDate, setSelectedDate } = useBookingStore()

  const isLoading = productsLoading || pricingLoading

  const primaryProduct = products?.find((p) => p.type === 'primary')
  const addonProducts = products?.filter((p) => p.type === 'addon') ?? []
  const pricingRules = pricingRulesData ?? []

  const { bookedDates, blockedDates, blockedReasons } = useMemo(() => {
    const booked = new Set<string>()
    const blocked = new Set<string>()
    const reasons = new Map<string, string | null>()

    if (availability) {
      for (const b of availability.bookings) {
        booked.add(b.rental_date)
      }
      for (const bd of availability.blockedDates) {
        blocked.add(bd.date)
        reasons.set(bd.date, bd.reason)
      }
    }

    return { bookedDates: booked, blockedDates: blocked, blockedReasons: reasons }
  }, [availability])

  const isDateDisabled = useCallback(
    (date: Date) => {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      if (d < today) return true
      const dateStr = formatDateToISO(date)
      return bookedDates.has(dateStr) || blockedDates.has(dateStr)
    },
    [bookedDates, blockedDates, today],
  )

  const CustomDayButton = useMemo(
    () =>
      createCustomDayButton(
        primaryProduct,
        pricingRules,
        bookedDates,
        blockedDates,
        blockedReasons,
      ),
    [primaryProduct, pricingRules, bookedDates, blockedDates, blockedReasons],
  )

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      setSelectedDate(date ?? null)
    },
    [setSelectedDate],
  )

  if (isLoading) return <BookingSkeleton />

  return (
    <>
      <Helmet>
        <title>{`Book Your Sauna — ${SITE_NAME}`}</title>
        <meta
          name="description"
          content="Select a date, customize your experience, and reserve your mobile sauna in minutes."
        />
        <meta property="og:title" content={`Book Your Sauna — ${SITE_NAME}`} />
        <meta
          property="og:description"
          content="Select a date, customize your experience, and reserve your mobile sauna in minutes."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={fullUrl('/book')} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={fullUrl('/book')} />
      </Helmet>

      <div className="py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 md:mb-14"
          >
            <h1 className="text-4xl md:text-5xl font-bold">Book Your Sauna</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Pick your date, choose delivery or pickup, and reserve in minutes.
            </p>
          </motion.div>

          {/* Two-column Layout */}
          <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
            {/* Left Column: Calendar + Rental Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6"
            >
              <RentalInfoPanel />

              {/* Calendar */}
              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="booking-calendar">
                    {availabilityLoading ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-8 w-36" />
                          <div className="flex gap-2">
                            <Skeleton className="size-8 rounded" />
                            <Skeleton className="size-8 rounded" />
                          </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: 35 }).map((_, i) => (
                            <Skeleton key={i} className="aspect-square rounded-lg" />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <DayPicker
                        mode="single"
                        selected={selectedDate ?? undefined}
                        onSelect={handleDateSelect}
                        month={month}
                        onMonthChange={setMonth}
                        disabled={isDateDisabled}
                        fromMonth={today}
                        components={{
                          DayButton: CustomDayButton,
                        }}
                        classNames={{
                          root: 'relative w-full',
                          months: 'w-full',
                          month: 'w-full',
                          month_caption: 'flex items-center justify-center mb-4',
                          caption_label: 'text-lg font-bold',
                          nav: 'flex items-center justify-between absolute inset-x-0 top-0 px-1',
                          button_previous: 'size-9 flex items-center justify-center rounded-lg border hover:bg-muted transition-colors',
                          button_next: 'size-9 flex items-center justify-center rounded-lg border hover:bg-muted transition-colors',
                          weekdays: 'grid grid-cols-7 gap-1 mb-1',
                          weekday: 'text-xs font-medium text-muted-foreground text-center py-2',
                          weeks: 'grid gap-1',
                          week: 'grid grid-cols-7 gap-1',
                          day: 'relative',
                          outside: 'invisible',
                          today: '',
                          selected: '',
                          disabled: '',
                        }}
                      />
                    )}
                  </div>

                  <CalendarLegend />
                </CardContent>
              </Card>

              {/* Mobile Pricing Sheet */}
              <MobilePricingSheet
                primaryProduct={primaryProduct}
                addons={addonProducts}
                pricingRules={pricingRules}
              />
            </motion.div>

            {/* Right Column: Pricing Breakdown (desktop) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="sticky top-24">
                <Card>
                  <CardContent className="p-6">
                    <PricingBreakdown
                      primaryProduct={primaryProduct}
                      addons={addonProducts}
                      pricingRules={pricingRules}
                    />
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  )
}
