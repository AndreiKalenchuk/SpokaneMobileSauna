import { loadStripe } from '@stripe/stripe-js'
import { supabase } from './supabase'
import type { FulfillmentMethod } from './delivery'

export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
)

export interface PaymentIntentRequest {
  rental_date: string
  fulfillment_method: FulfillmentMethod
  items: { product_id: string; quantity: number; unit_price: number }[]
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
}

export async function createPaymentIntent(
  data: PaymentIntentRequest,
): Promise<PaymentIntentResponse> {
  const { data: result, error } = await supabase.functions.invoke(
    'create-payment-intent',
    { body: data },
  )

  if (error) throw error
  if (result?.error) throw new Error(result.error)
  return result as PaymentIntentResponse
}
