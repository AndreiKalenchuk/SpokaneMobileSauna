import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import {
  DeliveryQuoteError,
  loadDeliverySettings,
  parseOrigin,
  quoteDelivery,
} from '../_shared/delivery.ts'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { address } = await req.json()
    if (typeof address !== 'string') {
      return json({ error: 'Address is required' }, 400)
    }

    const origin = parseOrigin(Deno.env.get('DELIVERY_ORIGIN'))
    const settings = await loadDeliverySettings(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    )
    const quote = await quoteDelivery(address, origin, settings)
    return json(quote)
  } catch (err) {
    if (err instanceof DeliveryQuoteError) {
      return json({ error: err.message }, err.status)
    }
    console.error('delivery-quote error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})
