import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Loader2,
  ShieldCheck,
  User,
  Calendar,
  MapPin,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { SITE_NAME, fullUrl, DEFAULT_OG_IMAGE } from '@/lib/site-config'
import { useCommunityBookingStore } from '@/stores/communityBookingStore'
import { useCommunityEvents } from '@/hooks/useCommunityEvents'
import { useProducts } from '@/hooks/useProducts'
import {
  stripePromise,
  createCommunityPaymentIntent,
  type PaymentIntentResponse,
} from '@/lib/stripe'

const TAX_RATE = 0.089
const COMMUNITY_PRICE_FALLBACK = 29.95

const customerSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(7, 'Phone number is required'),
  notes: z.string().optional(),
  termsAccepted: z.literal(true, {
    message: 'You must accept the terms to continue',
  }),
})

type CustomerFormValues = z.infer<typeof customerSchema>

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function formatTime(time: string): string {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const steps = [
  { label: 'Select Slot', icon: Calendar },
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
        <Label htmlFor="notes">
          Notes{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="notes"
          placeholder="Anything we should know?"
          rows={2}
          {...register('notes')}
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground text-xs">
            Community Sauna policies
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Arrive within 10 minutes of your selected time.</li>
            <li>
              Bring your own towel, robe, change of clothes, sandals, and water.
            </li>
            <li>
              Sessions are one hour. Please honor other guests' time slots.
            </li>
            <li>
              Cancellations accepted until 2 hours before your arrival time.
            </li>
          </ul>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="termsAccepted"
            checked={termsAccepted === true}
            onCheckedChange={(checked) =>
              setValue(
                'termsAccepted',
                checked === true ? true : (undefined as unknown as true),
                { shouldValidate: true },
              )
            }
            className="mt-0.5"
            aria-invalid={!!errors.termsAccepted}
          />
          <Label
            htmlFor="termsAccepted"
            className="text-sm leading-relaxed font-normal cursor-pointer"
          >
            I agree to the Community Sauna policies above and the{' '}
            <Link
              to="/terms"
              target="_blank"
              className="text-primary underline underline-offset-2 hover:no-underline"
            >
              site terms
            </Link>
            .
          </Label>
        </div>
        {errors.termsAccepted && (
          <p className="text-sm text-destructive">
            {errors.termsAccepted.message}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full h-12 text-base">
        Continue to Payment
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </form>
  )
}

function PaymentForm({
  total,
  bookingId,
}: {
  total: number
  bookingId: string
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
          return_url: `${window.location.origin}/community/confirmation/${bookingId}`,
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
        <PaymentElement
          onReady={() => setPaymentReady(true)}
          options={{ layout: 'tabs' }}
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-4" />
        <span>Your payment is secured with 256-bit SSL encryption</span>
      </div>

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
    </form>
  )
}

export default function CommunityCheckoutPage() {
  const navigate = useNavigate()
  const { selectedEventDate, selectedSlotTime, quantity } =
    useCommunityBookingStore()
  const { data: events } = useCommunityEvents()
  const { data: products } = useProducts()

  const communityProduct = products?.find((p) => p.slug === 'community-sauna')
  const price = communityProduct?.base_price ?? COMMUNITY_PRICE_FALLBACK

  const event = useMemo(
    () => events?.find((e) => e.event_date === selectedEventDate),
    [events, selectedEventDate],
  )

  const [step, setStep] = useState<'info' | 'payment'>('info')
  const [customerData, setCustomerData] = useState<CustomerFormValues | null>(null)
  const [paymentIntent, setPaymentIntent] =
    useState<PaymentIntentResponse | null>(null)
  const [isCreatingIntent, setIsCreatingIntent] = useState(false)

  const calculations = useMemo(() => {
    const subtotal = Math.round(price * quantity * 100) / 100
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100
    const total = Math.round((subtotal + tax) * 100) / 100
    return { subtotal, tax, total }
  }, [price, quantity])

  useEffect(() => {
    if (!selectedEventDate || !selectedSlotTime) {
      navigate('/community', { replace: true })
    }
  }, [selectedEventDate, selectedSlotTime, navigate])

  if (!selectedEventDate || !selectedSlotTime) return null

  const handleCustomerSubmit = async (data: CustomerFormValues) => {
    setCustomerData(data)
    setIsCreatingIntent(true)

    try {
      const result = await createCommunityPaymentIntent({
        event_date: selectedEventDate,
        slot_time: selectedSlotTime,
        quantity,
        customer: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          notes: data.notes,
        },
      })

      setPaymentIntent(result)
      setStep('payment')
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to initialize payment'
      toast.error(msg)
    } finally {
      setIsCreatingIntent(false)
    }
  }

  const currentStepIndex = step === 'info' ? 1 : 2

  return (
    <>
      <Helmet>
        <title>Community Sauna Checkout — {SITE_NAME}</title>
        <meta
          name="description"
          content="Complete your Community Sauna reservation."
        />
        <meta property="og:url" content={fullUrl('/community/checkout')} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <link rel="canonical" href={fullUrl('/community/checkout')} />
      </Helmet>

      <div className="py-12 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-10"
          >
            <StepIndicator currentStep={currentStepIndex} />
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div>
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

                        {customerData && (
                          <div className="mb-6 rounded-lg border bg-muted/30 p-4 space-y-1 text-sm">
                            <p className="font-medium">{customerData.name}</p>
                            <p className="text-muted-foreground">
                              {customerData.email}
                            </p>
                            <p className="text-muted-foreground">
                              {customerData.phone}
                            </p>
                          </div>
                        )}

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
                          />
                        </Elements>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6">
                <Button variant="ghost" asChild>
                  <Link
                    to="/community"
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <ArrowLeft className="size-4" />
                    Back to Community Sauna
                  </Link>
                </Button>
              </div>
            </div>

            <div>
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Reservation Summary</h3>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                        Date
                      </p>
                      <p className="font-semibold mt-1">
                        {formatDisplayDate(selectedEventDate)}
                      </p>
                      {event && (
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <p className="flex items-center gap-1.5">
                            <Clock className="size-3.5" />
                            Arrival {formatTime(selectedSlotTime)}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="size-3.5" />
                            {event.location}
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span>
                          Community Sauna × {quantity}
                        </span>
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

                    <Button variant="ghost" size="sm" asChild className="w-full">
                      <Link to="/community" className="flex items-center gap-2">
                        Edit selection
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
