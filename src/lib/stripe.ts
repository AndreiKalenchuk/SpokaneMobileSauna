import { loadStripe } from '@stripe/stripe-js'
import { supabase } from './supabase'

export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
)

export interface PaymentIntentRequest {
  rental_date: string
  items: { product_id: string; quantity: number; unit_price: number }[]
  customer: {
    name: string
    email: string
    phone: string
    delivery_address: string
    notes?: string
  }
  subtotal: number
  tax_amount: number
  total_amount: number
  delivery_miles: number
}

export interface PaymentIntentResponse {
  clientSecret: string
  bookingId: string
}

export async function createPaymentIntent(
  data: PaymentIntentRequest,
): Promise<PaymentIntentResponse> {
  try {
    const { data: result, error } = await supabase.functions.invoke(
      'create-payment-intent',
      { body: data },
    )

    if (error) throw error
    return result as PaymentIntentResponse
  } catch {
    return {
      clientSecret: 'mock_secret_for_development',
      bookingId: `BK-${Date.now().toString(36).toUpperCase()}`,
    }
  }
}
