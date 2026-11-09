import { describe, it, expect, beforeEach } from 'vitest'
import { useBookingStore } from '../bookingStore'
import type { DeliveryQuote } from '@/lib/delivery'

const quote: DeliveryQuote = {
  miles: 23.4,
  durationMinutes: 31,
  extraMiles: 4,
  fee: 93,
  withinServiceArea: true,
  matchedAddress: '123 MAIN ST, SPOKANE, WA, 99201',
  baseFee: 89,
  includedMiles: 20,
  ratePerExtraMile: 1,
  maxMiles: 50,
}

describe('bookingStore — fulfillment', () => {
  beforeEach(() => useBookingStore.getState().reset())

  it('starts with no fulfillment choice', () => {
    const s = useBookingStore.getState()
    expect(s.fulfillmentMethod).toBeNull()
    expect(s.deliveryAddress).toBe('')
    expect(s.deliveryQuote).toBeNull()
  })

  it('editing the address invalidates the quote', () => {
    const s = useBookingStore.getState()
    s.setFulfillmentMethod('delivery')
    s.setDeliveryAddress('123 Main St, Spokane, WA')
    s.setDeliveryQuote(quote)
    expect(useBookingStore.getState().deliveryQuote).toEqual(quote)

    useBookingStore.getState().setDeliveryAddress('456 Elm St, Spokane, WA')
    expect(useBookingStore.getState().deliveryQuote).toBeNull()
  })

  it('switching to pickup keeps the delivery quote for switching back', () => {
    const s = useBookingStore.getState()
    s.setFulfillmentMethod('delivery')
    s.setDeliveryQuote(quote)
    s.setFulfillmentMethod('pickup')
    expect(useBookingStore.getState().deliveryQuote).toEqual(quote)
  })

  it('reset clears fulfillment state', () => {
    const s = useBookingStore.getState()
    s.setFulfillmentMethod('pickup')
    s.setDeliveryAddress('x')
    s.reset()
    expect(useBookingStore.getState().fulfillmentMethod).toBeNull()
    expect(useBookingStore.getState().deliveryAddress).toBe('')
  })
})
