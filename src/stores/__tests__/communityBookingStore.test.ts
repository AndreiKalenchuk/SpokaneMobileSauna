import { describe, it, expect, beforeEach } from 'vitest'
import { useCommunityBookingStore } from '../communityBookingStore'

// Grab the initial state once so we can restore it between tests
const initialState = useCommunityBookingStore.getState()

describe('useCommunityBookingStore', () => {
  beforeEach(() => {
    useCommunityBookingStore.setState(
      {
        selectedEventDate: initialState.selectedEventDate,
        selectedSlotTime: initialState.selectedSlotTime,
        quantity: initialState.quantity,
      },
      false,
    )
  })

  it('starts with clean defaults', () => {
    const s = useCommunityBookingStore.getState()
    expect(s.selectedEventDate).toBeNull()
    expect(s.selectedSlotTime).toBeNull()
    expect(s.quantity).toBe(1)
  })

  it('setSelectedEventDate updates the date', () => {
    useCommunityBookingStore.getState().setSelectedEventDate('2026-04-23')
    expect(useCommunityBookingStore.getState().selectedEventDate).toBe('2026-04-23')
  })

  it('changing event date clears any previously selected slot time', () => {
    const s = useCommunityBookingStore.getState()
    s.setSelectedEventDate('2026-04-23')
    s.setSelectedSlotTime('17:00:00')
    expect(useCommunityBookingStore.getState().selectedSlotTime).toBe('17:00:00')

    // Switching dates must wipe the slot (different events have different slots)
    useCommunityBookingStore.getState().setSelectedEventDate('2026-04-30')
    expect(useCommunityBookingStore.getState().selectedSlotTime).toBeNull()
    expect(useCommunityBookingStore.getState().selectedEventDate).toBe('2026-04-30')
  })

  it('setSelectedSlotTime updates only the slot', () => {
    useCommunityBookingStore.getState().setSelectedEventDate('2026-04-23')
    useCommunityBookingStore.getState().setSelectedSlotTime('18:00:00')

    const s = useCommunityBookingStore.getState()
    expect(s.selectedSlotTime).toBe('18:00:00')
    expect(s.selectedEventDate).toBe('2026-04-23')
  })

  it('setQuantity clamps values below 1 to 1', () => {
    useCommunityBookingStore.getState().setQuantity(0)
    expect(useCommunityBookingStore.getState().quantity).toBe(1)

    useCommunityBookingStore.getState().setQuantity(-5)
    expect(useCommunityBookingStore.getState().quantity).toBe(1)
  })

  it('setQuantity accepts valid values', () => {
    useCommunityBookingStore.getState().setQuantity(7)
    expect(useCommunityBookingStore.getState().quantity).toBe(7)
  })

  it('reset returns the store to defaults', () => {
    const s = useCommunityBookingStore.getState()
    s.setSelectedEventDate('2026-04-23')
    s.setSelectedSlotTime('17:00:00')
    s.setQuantity(4)

    useCommunityBookingStore.getState().reset()

    const after = useCommunityBookingStore.getState()
    expect(after.selectedEventDate).toBeNull()
    expect(after.selectedSlotTime).toBeNull()
    expect(after.quantity).toBe(1)
  })
})
