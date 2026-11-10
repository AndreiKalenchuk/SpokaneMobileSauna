import { loadStripe } from '@stripe/stripe-js'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { COUPON_REASON_MESSAGES } from './coupons'
import type { CouponUnavailableReason } from './coupons'
import type { FulfillmentMethod } from './delivery'

export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
)

export interface PaymentIntentRequest {
  rental_date: string
  fulfillment_method: FulfillmentMethod
  items: { product_id: string; quantity: number; unit_price: number }[]
  coupon_code?: string
  /** Booking from an earlier attempt in this checkout, released server-side */
  replace_booking_id?: string
  customer: {
    name: string
    email: string
    phone: string
    delivery_address?: string
    notes?: string
  }
  subtotal: number
  tax_amount: number
  total_amount: number
}

export interface PaymentIntentResponse {
  clientSecret: string
  bookingId: string
  bookingNumber: string
  /** Amount the PaymentIntent charges (absent from older function deploys) */
  totalAmount?: number
  /** Seconds until the unpaid booking's date hold expires (migration 024) */
  holdSeconds?: number
}

/** A checkout the server refused; `couponReason` is set when the coupon was the problem. */
export class CheckoutError extends Error {
  couponReason?: CouponUnavailableReason

  constructor(message: string, couponReason?: CouponUnavailableReason) {
    super(couponReason ? COUPON_REASON_MESSAGES[couponReason] : message)
    this.couponReason = couponReason
  }
}

export async function createPaymentIntent(
  data: PaymentIntentRequest,
): Promise<PaymentIntentResponse> {
  const { data: result, error } = await supabase.functions.invoke(
    'create-payment-intent',
    { body: data },
  )

  // Surface the server's reason (date taken, coupon used up…) instead of a bare status
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null)
    if (body?.error) throw new CheckoutError(body.error, body.reason)
  }
  if (error) throw error
  if (result?.error) throw new Error(result.error)
  return result as PaymentIntentResponse
}
