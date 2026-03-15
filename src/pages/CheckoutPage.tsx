import { useState, useMemo, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Loader2,
  ShieldCheck,
  User,
  Calendar,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useProducts } from '@/hooks/useProducts'
import { usePricingRules } from '@/hooks/usePricingRules'
import { getPriceForDate } from '@/lib/pricing'
import { stripePromise, createPaymentIntent } from '@/lib/stripe'
import type { PaymentIntentResponse } from '@/lib/stripe'
import { useBookingStore } from '@/stores/bookingStore'
import { rentalTermsSections } from '@/pages/TermsPage'
import type { Product, PricingRule } from '@/types'

const TAX_RATE = 0.089
const FREE_DELIVERY_MILES = 20
const DELIVERY_RATE_PER_MILE = 2.99

const customerSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(7, 'Phone number is required'),
  deliveryAddress: z.string().min(5, 'Delivery address is required'),
  notes: z.string().optional(),
  termsAccepted: z.literal(true, {
    message: 'You must accept the Rental Terms & Conditions to continue',
  }),
})

type CustomerFormValues = z.infer<typeof customerSchema>

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateToISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// --- Step Indicator ---

const steps = [
  { label: 'Select Date', icon: Calendar },
  { label: 'Your Info', icon: User },
  { label: 'Payment', icon: CreditCard },
]

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((step, idx) => {
        const StepIcon = step.icon
        const isComplete = idx < currentStep
        const isCurrent = idx === currentStep
        return (
          <div key={step.label} className="flex items-center gap-1 sm:gap-2">
            {idx > 0 && (
              <div
                className={`h-px w-6 sm:w-10 transition-colors ${
                  isComplete ? 'bg-primary' : 'bg-border'
                }`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`flex size-8 items-center justify-center rounded-full border-2 transition-colors ${
                  isComplete
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isCurrent
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted text-muted-foreground'
                }`}
              >
                {isComplete ? (
                  <Check className="size-4" />
                ) : (
                  <StepIcon className="size-4" />
                )}
              </div>
              <span
                className={`hidden text-sm font-medium sm:inline ${
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// --- Order Summary ---

interface OrderCalculations {
  mainPrice: number
  addonLines: { name: string; qty: number; unitPrice: number; lineTotal: number }[]
  deliverySurcharge: number
  subtotal: number
  tax: number
  total: number
}

function useOrderCalculations(
  primaryProduct: Product | undefined,
  addons: Product[],
  pricingRules: PricingRule[],
): OrderCalculations {
  const { selectedDate, selectedAddons, deliveryMiles } = useBookingStore()

  return useMemo(() => {
    if (!selectedDate || !primaryProduct) {
      return { mainPrice: 0, addonLines: [], deliverySurcharge: 0, subtotal: 0, tax: 0, total: 0 }
    }

    const mainPrice = getPriceForDate(primaryProduct, selectedDate, pricingRules)

    const addonLines: OrderCalculations['addonLines'] = []
    for (const sa of selectedAddons) {
      const product = addons.find((a) => a.id === sa.productId)
      if (product) {
        const unitPrice = getPriceForDate(product, selectedDate, pricingRules)
        addonLines.push({
          name: product.name,
          qty: sa.quantity,
          unitPrice,
          lineTotal: unitPrice * sa.quantity,
        })
      }
    }

    const deliverySurcharge =
      deliveryMiles > FREE_DELIVERY_MILES
        ? (deliveryMiles - FREE_DELIVERY_MILES) * DELIVERY_RATE_PER_MILE
        : 0

    const addonTotal = addonLines.reduce((sum, l) => sum + l.lineTotal, 0)
    const subtotal = Math.round((mainPrice + addonTotal + deliverySurcharge) * 100) / 100
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100
    const total = Math.round((subtotal + tax) * 100) / 100

    return { mainPrice, addonLines, deliverySurcharge, subtotal, tax, total }
  }, [selectedDate, primaryProduct, pricingRules, selectedAddons, addons, deliveryMiles])
}

function OrderSummary({
  primaryProduct,
  calculations,
  collapsible,
}: {
  primaryProduct: Product
  calculations: OrderCalculations
  collapsible?: boolean
}) {
  const { selectedDate } = useBookingStore()
  const [isOpen, setIsOpen] = useState(!collapsible)

  const content = (
    <div className="space-y-4">
      {/* Date */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Date</p>
        <p className="font-semibold mt-1">
          {selectedDate ? formatDisplayDate(selectedDate) : '—'}
        </p>
      </div>

      <Separator />

      {/* Line Items */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{primaryProduct.name}</span>
          <span className="font-medium">{formatCurrency(calculations.mainPrice)}</span>
        </div>

        {calculations.addonLines.map((line) => (
          <div key={line.name} className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {line.name}
              {line.qty > 1 ? ` × ${line.qty}` : ''}
            </span>
            <span>{formatCurrency(line.lineTotal)}</span>
          </div>
        ))}

        {calculations.deliverySurcharge > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery surcharge</span>
            <span>{formatCurrency(calculations.deliverySurcharge)}</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Totals */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(calculations.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <span>{formatCurrency(calculations.tax)}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center pt-1">
          <span className="text-lg font-bold">Total</span>
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(calculations.total)}
          </span>
        </div>
      </div>

      {/* Edit link */}
      <Button variant="ghost" size="sm" asChild className="w-full">
        <Link to="/book" className="flex items-center gap-2">
          <Pencil className="size-3.5" />
          Edit Selection
        </Link>
      </Button>
    </div>
  )

  if (collapsible) {
    return (
      <Card>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Order Summary</span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(calculations.total)}
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className="size-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-5 text-muted-foreground" />
          )}
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <CardContent className="pt-0 pb-4">{content}</CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
        {content}
      </CardContent>
    </Card>
  )
}

// --- Customer Info Form ---

const KEY_TERMS_SECTIONS = [4, 5, 6, 8] as const

function InlineTerms() {
  const [isExpanded, setIsExpanded] = useState(false)
  const keyTerms = rentalTermsSections.filter((_, i) =>
    (KEY_TERMS_SECTIONS as readonly number[]).includes(i),
  )
  const displayTerms = isExpanded ? rentalTermsSections : keyTerms

  return (
    <div className="rounded-lg border bg-muted/30">
      <div className="max-h-64 overflow-y-auto px-4 py-3 space-y-4 text-xs leading-relaxed text-muted-foreground">
        {displayTerms.map(({ title, content }) => (
          <div key={title}>
            <p className="font-semibold text-foreground text-xs">{title}</p>
            <p className="mt-1 whitespace-pre-line">{content}</p>
          </div>
        ))}
      </div>
      <div className="border-t px-4 py-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-primary hover:underline"
        >
          {isExpanded ? 'Show key sections only' : `Show all ${rentalTermsSections.length} sections`}
        </button>
        <Link
          to="/terms"
          target="_blank"
          className="text-xs text-primary hover:underline"
        >
          Open full terms
        </Link>
      </div>
    </div>
  )
}

function CustomerInfoForm({
  onSubmit,
}: {
  onSubmit: (data: CustomerFormValues) => void
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { termsAccepted: undefined as unknown as true },
  })

  const termsAccepted = watch('termsAccepted')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          placeholder="John Smith"
          {...register('name')}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          {...register('email')}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(509) 555-0123"
          {...register('phone')}
          aria-invalid={!!errors.phone}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="deliveryAddress">Delivery Address</Label>
        <Textarea
          id="deliveryAddress"
          placeholder="123 Main St, Spokane, WA 99201"
          rows={3}
          {...register('deliveryAddress')}
          aria-invalid={!!errors.deliveryAddress}
        />
        {errors.deliveryAddress && (
          <p className="text-sm text-destructive">
            {errors.deliveryAddress.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">
          Special Requests / Notes{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="notes"
          placeholder="Any special instructions for delivery or setup..."
          rows={2}
          {...register('notes')}
        />
      </div>

      <Separator />

      {/* Rental Terms & Conditions */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-sm">Rental Terms & Conditions</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Please review the key terms below, including fire safety and liability. You must accept to continue.
          </p>
        </div>

        <InlineTerms />

        <div className="flex items-start gap-3">
          <Checkbox
            id="termsAccepted"
            checked={termsAccepted === true}
            onCheckedChange={(checked) =>
              setValue('termsAccepted', checked === true ? true : undefined as unknown as true, { shouldValidate: true })
            }
            className="mt-0.5"
            aria-invalid={!!errors.termsAccepted}
          />
          <Label htmlFor="termsAccepted" className="text-sm leading-relaxed font-normal cursor-pointer">
            I have read and agree to the{' '}
            <Link to="/terms" target="_blank" className="text-primary underline underline-offset-2 hover:no-underline">
              Rental Terms &amp; Conditions
            </Link>
            , including fire safety requirements, assumption of risk, and liability waiver.
          </Label>
        </div>
        {errors.termsAccepted && (
          <p className="text-sm text-destructive">{errors.termsAccepted.message}</p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full h-12 text-base">
        Continue to Payment
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </form>
  )
}

// --- Payment Form (inside Stripe Elements) ---

function PaymentForm({
  total,
  bookingId,
  onSuccess,
}: {
  total: number
  bookingId: string
  onSuccess: (bookingId: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentReady, setPaymentReady] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsProcessing(true)
    setPaymentError(null)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/confirmation/${bookingId}`,
        },
      })

      if (error) {
        setPaymentError(error.message ?? 'Payment failed. Please try again.')
        setIsProcessing(false)
      }
    } catch {
      setPaymentError('An unexpected error occurred. Please try again.')
      setIsProcessing(false)
    }
  }

  const isMocked = !stripe || !elements

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {paymentError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {paymentError}
        </motion.div>
      )}

      <div className="rounded-lg border bg-card p-4">
        {isMocked ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="size-4" />
              <span>Payment processing will be connected in the next step</span>
            </div>
            <div className="space-y-2 opacity-50 pointer-events-none">
              <div className="h-10 rounded border bg-muted" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 rounded border bg-muted" />
                <div className="h-10 rounded border bg-muted" />
              </div>
            </div>
          </div>
        ) : (
          <PaymentElement
            onReady={() => setPaymentReady(true)}
            options={{ layout: 'tabs' }}
          />
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-4" />
        <span>Your payment is secured with 256-bit SSL encryption</span>
      </div>

      <p className="text-xs text-muted-foreground">
        By completing this payment you confirm your acceptance of the{' '}
        <Link to="/terms" target="_blank" className="text-primary underline underline-offset-2 hover:no-underline">
          Rental Terms &amp; Conditions
        </Link>{' '}
        agreed to in the previous step.
      </p>

      {isMocked ? (
        <Button
          type="button"
          size="lg"
          className="w-full h-12 text-base"
          onClick={() => onSuccess(bookingId)}
        >
          Complete Booking — {formatCurrency(total)}
        </Button>
      ) : (
        <Button
          type="submit"
          size="lg"
          className="w-full h-12 text-base"
          disabled={!stripe || isProcessing || !paymentReady}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Processing…
            </>
          ) : (
            <>Pay {formatCurrency(total)}</>
          )}
        </Button>
      )}
    </form>
  )
}

// --- Checkout Steps Container ---

function CheckoutContent({
  primaryProduct,
  addons,
  pricingRules,
}: {
  primaryProduct: Product
  addons: Product[]
  pricingRules: PricingRule[]
}) {
  const navigate = useNavigate()
  const { selectedDate, selectedAddons, deliveryMiles } = useBookingStore()
  const [step, setStep] = useState<'info' | 'payment'>('info')
  const [customerData, setCustomerData] = useState<CustomerFormValues | null>(null)
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResponse | null>(null)
  const [isCreatingIntent, setIsCreatingIntent] = useState(false)

  const calculations = useOrderCalculations(primaryProduct, addons, pricingRules)

  useEffect(() => {
    if (!selectedDate) {
      navigate('/book', { replace: true })
    }
  }, [selectedDate, navigate])

  if (!selectedDate) return null

  const handleCustomerSubmit = async (data: CustomerFormValues) => {
    setCustomerData(data)
    setIsCreatingIntent(true)

    try {
      const items = [
        {
          product_id: primaryProduct.id,
          quantity: 1,
          unit_price: calculations.mainPrice,
        },
        ...selectedAddons.map((sa) => {
          const product = addons.find((a) => a.id === sa.productId)
          const unitPrice = product
            ? getPriceForDate(product, selectedDate, pricingRules)
            : 0
          return {
            product_id: sa.productId,
            quantity: sa.quantity,
            unit_price: unitPrice,
          }
        }),
      ]

      const result = await createPaymentIntent({
        rental_date: formatDateToISO(selectedDate),
        items,
        customer: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          delivery_address: data.deliveryAddress,
          notes: data.notes,
        },
        subtotal: calculations.subtotal,
        tax_amount: calculations.tax,
        total_amount: calculations.total,
        delivery_miles: deliveryMiles,
      })

      setPaymentIntent(result)
      setStep('payment')
    } catch {
      toast.error('Failed to initialize payment. Please try again.')
    } finally {
      setIsCreatingIntent(false)
    }
  }

  const handlePaymentSuccess = (bookingId: string) => {
    navigate(`/booking/confirmation/${bookingId}`)
  }

  const currentStepIndex = step === 'info' ? 1 : 2
  const isMockedSecret = paymentIntent?.clientSecret === 'mock_secret_for_development'

  return (
    <>
      <Helmet>
        <title>Checkout — Mobile Sauna Rental</title>
      </Helmet>

      <main className="py-12 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Step Indicator */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-10"
          >
            <StepIndicator currentStep={currentStepIndex} />
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Left Column: Forms */}
            <div>
              {/* Mobile order summary */}
              <div className="mb-6 lg:hidden">
                <OrderSummary
                  primaryProduct={primaryProduct}
                  calculations={calculations}
                  collapsible
                />
              </div>

              <AnimatePresence mode="wait">
                {step === 'info' && (
                  <motion.div
                    key="info"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                          <User className="size-5" />
                          Your Information
                        </h2>
                        {isCreatingIntent ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="size-8 animate-spin text-primary mb-3" />
                            <p className="text-sm text-muted-foreground">
                              Preparing your payment…
                            </p>
                          </div>
                        ) : (
                          <CustomerInfoForm onSubmit={handleCustomerSubmit} />
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {step === 'payment' && paymentIntent && (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-xl font-bold flex items-center gap-2">
                            <CreditCard className="size-5" />
                            Payment
                          </h2>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setStep('info')}
                          >
                            <ArrowLeft className="mr-1 size-3.5" />
                            Back
                          </Button>
                        </div>

                        {/* Customer info summary */}
                        {customerData && (
                          <div className="mb-6 rounded-lg border bg-muted/30 p-4 space-y-1 text-sm">
                            <p className="font-medium">{customerData.name}</p>
                            <p className="text-muted-foreground">{customerData.email}</p>
                            <p className="text-muted-foreground">{customerData.phone}</p>
                            <p className="text-muted-foreground">{customerData.deliveryAddress}</p>
                          </div>
                        )}

                        {isMockedSecret ? (
                          <PaymentForm
                            total={calculations.total}
                            bookingId={paymentIntent.bookingId}
                            onSuccess={handlePaymentSuccess}
                          />
                        ) : (
                          <Elements
                            stripe={stripePromise}
                            options={{
                              clientSecret: paymentIntent.clientSecret,
                              appearance: {
                                theme: 'stripe',
                                variables: {
                                  colorPrimary: '#5C3D2E',
                                  borderRadius: '8px',
                                },
                              },
                            }}
                          >
                            <PaymentForm
                              total={calculations.total}
                              bookingId={paymentIntent.bookingId}
                              onSuccess={handlePaymentSuccess}
                            />
                          </Elements>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Back to calendar */}
              <div className="mt-6">
                <Button variant="ghost" asChild>
                  <Link to="/book" className="flex items-center gap-2 text-muted-foreground">
                    <ArrowLeft className="size-4" />
                    Back to Calendar
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Column: Desktop Order Summary */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <OrderSummary
                  primaryProduct={primaryProduct}
                  calculations={calculations}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

// --- Main Page Export ---

export default function CheckoutPage() {
  const { data: products, isLoading: productsLoading } = useProducts()
  const { data: pricingRulesData, isLoading: pricingLoading } = usePricingRules()

  const primaryProduct = products?.find((p) => p.type === 'primary')
  const addonProducts = products?.filter((p) => p.type === 'addon') ?? []
  const pricingRules = pricingRulesData ?? []

  if (productsLoading || pricingLoading) {
    return (
      <main className="py-12 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        </div>
      </main>
    )
  }

  if (!primaryProduct) return null

  return (
    <CheckoutContent
      primaryProduct={primaryProduct}
      addons={addonProducts}
      pricingRules={pricingRules}
    />
  )
}
