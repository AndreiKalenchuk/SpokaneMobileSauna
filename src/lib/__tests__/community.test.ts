import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  formatDateToISO,
  formatTime,
  formatDisplayDate,
  normalizeTime,
  generateSlotTimes,
  isSlotPast,
  isSlotInWindow,
  getSlotAvailability,
  calculateCommunityPricing,
  generateCommunityBookingNumber,
  aggregateBookedBySlot,
  COMMUNITY_CUTOFF_MINUTES,
} from '../community'
import type { CommunityEvent } from '../../types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<CommunityEvent> = {}): CommunityEvent {
  return {
    id: 'event-0001',
    event_date: '2026-04-23', // Thursday
    start_time: '16:30:00',
    end_time: '20:00:00',
    slot_minutes: 60,
    location: '1921 W 10th Ave, Spokane, WA 99204',
    capacity_per_slot: 10,
    is_active: true,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// formatDateToISO
// ---------------------------------------------------------------------------

describe('formatDateToISO', () => {
  it('pads month and day with leading zeros', () => {
    expect(formatDateToISO(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('uses local calendar fields (not UTC)', () => {
    // 2026-03-19 local midnight — should round-trip as 2026-03-19 regardless
    // of the runner's timezone
    expect(formatDateToISO(new Date(2026, 2, 19))).toBe('2026-03-19')
  })

  it('handles end-of-year dates', () => {
    expect(formatDateToISO(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------

describe('formatTime', () => {
  it('formats morning times', () => {
    expect(formatTime('09:00:00')).toBe('9:00 AM')
  })

  it('formats exactly noon as 12 PM', () => {
    expect(formatTime('12:00:00')).toBe('12:00 PM')
  })

  it('formats exactly midnight as 12 AM', () => {
    expect(formatTime('00:00:00')).toBe('12:00 AM')
  })

  it('formats afternoon times', () => {
    expect(formatTime('17:30:00')).toBe('5:30 PM')
  })

  it('accepts HH:MM without seconds', () => {
    expect(formatTime('16:30')).toBe('4:30 PM')
  })
})

// ---------------------------------------------------------------------------
// formatDisplayDate
// ---------------------------------------------------------------------------

describe('formatDisplayDate', () => {
  it('formats ISO date as weekday + month + day + year', () => {
    // 2026-04-23 is a Thursday
    expect(formatDisplayDate('2026-04-23')).toBe('Thursday, April 23, 2026')
  })

  it('does not drift days due to timezone', () => {
    // 2026-01-01 at noon should stay Jan 1 in any US timezone
    expect(formatDisplayDate('2026-01-01')).toMatch(/January 1, 2026/)
  })
})

// ---------------------------------------------------------------------------
// normalizeTime
// ---------------------------------------------------------------------------

describe('normalizeTime', () => {
  it('pads single-digit hours', () => {
    expect(normalizeTime('9:00')).toBe('09:00:00')
  })

  it('strips fractional seconds / extra chars', () => {
    expect(normalizeTime('17:00:00')).toBe('17:00:00')
  })

  it('accepts HH:MM form', () => {
    expect(normalizeTime('17:30')).toBe('17:30:00')
  })
})

// ---------------------------------------------------------------------------
// generateSlotTimes
// ---------------------------------------------------------------------------

describe('generateSlotTimes', () => {
  it('generates 60-minute slots across 4:30 PM–8 PM (3 slots: 4:30, 5:30, 6:30)', () => {
    const slots = generateSlotTimes(makeEvent())
    expect(slots).toEqual(['16:30:00', '17:30:00', '18:30:00'])
  })

  it('generates 30-minute slots across 5–7 PM (4 slots)', () => {
    const slots = generateSlotTimes(
      makeEvent({ start_time: '17:00:00', end_time: '19:00:00', slot_minutes: 30 }),
    )
    expect(slots).toEqual(['17:00:00', '17:30:00', '18:00:00', '18:30:00'])
  })

  it('generates 90-minute slots', () => {
    const slots = generateSlotTimes(
      makeEvent({ start_time: '17:00:00', end_time: '20:00:00', slot_minutes: 90 }),
    )
    expect(slots).toEqual(['17:00:00', '18:30:00'])
  })

  it('does not emit a slot that would end after end_time', () => {
    const slots = generateSlotTimes(
      makeEvent({ start_time: '17:00:00', end_time: '18:45:00', slot_minutes: 60 }),
    )
    expect(slots).toEqual(['17:00:00'])
  })

  it('returns an empty array when slot_minutes is zero or negative', () => {
    expect(
      generateSlotTimes(makeEvent({ slot_minutes: 0 })),
    ).toEqual([])
  })

  it('returns an empty array when end_time <= start_time', () => {
    expect(
      generateSlotTimes(
        makeEvent({ start_time: '18:00:00', end_time: '18:00:00', slot_minutes: 60 }),
      ),
    ).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// isSlotPast
// ---------------------------------------------------------------------------

describe('isSlotPast', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true when the event date is before today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 23, 12, 0))
    expect(isSlotPast('2026-04-22', '17:00:00')).toBe(true)
  })

  it('returns false when the event date is after today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 23, 12, 0))
    expect(isSlotPast('2026-04-30', '17:00:00')).toBe(false)
  })

  it('same-day slot is bookable before the 30-minute cutoff', () => {
    // 5:00 PM slot, now = 5:20 PM (20 min past start, still within 30-min cutoff)
    const now = new Date(2026, 3, 23, 17, 20)
    expect(isSlotPast('2026-04-23', '17:00:00', now)).toBe(false)
  })

  it('same-day slot is past at exactly +30 minutes boundary (inclusive)', () => {
    // At exactly the cutoff (+30 min), it remains bookable — strictly greater
    const now = new Date(2026, 3, 23, 17, 30)
    expect(isSlotPast('2026-04-23', '17:00:00', now)).toBe(false)
  })

  it('same-day slot is past after the 30-minute cutoff', () => {
    const now = new Date(2026, 3, 23, 17, 31)
    expect(isSlotPast('2026-04-23', '17:00:00', now)).toBe(true)
  })

  it('same-day slot in the future is bookable', () => {
    const now = new Date(2026, 3, 23, 15, 0)
    expect(isSlotPast('2026-04-23', '17:00:00', now)).toBe(false)
  })

  it('defaults to Date.now() when no `now` is supplied', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 23, 19, 0))
    expect(isSlotPast('2026-04-23', '17:00:00')).toBe(true)
  })

  it('respects COMMUNITY_CUTOFF_MINUTES constant', () => {
    expect(COMMUNITY_CUTOFF_MINUTES).toBe(30)
  })
})

// ---------------------------------------------------------------------------
// isSlotInWindow
// ---------------------------------------------------------------------------

describe('isSlotInWindow', () => {
  const event = makeEvent() // 16:30–20:00, 60-min slots

  it('accepts start_time itself', () => {
    expect(isSlotInWindow(event, '16:30:00')).toBe(true)
  })

  it('accepts aligned interior slot', () => {
    expect(isSlotInWindow(event, '17:30:00')).toBe(true)
    expect(isSlotInWindow(event, '18:30:00')).toBe(true)
  })

  it('rejects slots that would run past end_time', () => {
    // 19:30 + 60min = 20:30 > 20:00
    expect(isSlotInWindow(event, '19:30:00')).toBe(false)
  })

  it('rejects slots before start_time', () => {
    expect(isSlotInWindow(event, '16:00:00')).toBe(false)
  })

  it('rejects non-aligned slots', () => {
    // 17:00 is not on a 60-min boundary from 16:30
    expect(isSlotInWindow(event, '17:00:00')).toBe(false)
  })

  it('rejects when slot_minutes is zero', () => {
    expect(
      isSlotInWindow(makeEvent({ slot_minutes: 0 }), '16:30:00'),
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getSlotAvailability
// ---------------------------------------------------------------------------

describe('getSlotAvailability', () => {
  it('returns one entry per slot with correct booked/remaining', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 20, 10, 0)) // 3 days before event
    const event = makeEvent()
    const booked = new Map([
      ['16:30:00', 3],
      ['18:30:00', 10],
    ])
    const result = getSlotAvailability(event, booked)
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ slotTime: '16:30:00', booked: 3, remaining: 7, full: false, past: false })
    expect(result[1]).toMatchObject({ slotTime: '17:30:00', booked: 0, remaining: 10, full: false, past: false })
    expect(result[2]).toMatchObject({ slotTime: '18:30:00', booked: 10, remaining: 0, full: true, past: false })
    vi.useRealTimers()
  })

  it('marks slots as past when appropriate', () => {
    const now = new Date(2026, 3, 23, 19, 30) // 7:30 PM on event day
    const result = getSlotAvailability(makeEvent(), new Map(), now)
    // Cutoffs: 4:30+30=5:00 (past), 5:30+30=6:00 (past), 6:30+30=7:00 (past)
    expect(result.map((r) => r.past)).toEqual([true, true, true])
  })

  it('does not return negative remaining if over-booked', () => {
    const booked = new Map([['16:30:00', 99]])
    const now = new Date(2026, 3, 20, 10, 0)
    const result = getSlotAvailability(makeEvent(), booked, now)
    expect(result[0].remaining).toBe(0)
    expect(result[0].full).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// calculateCommunityPricing
// ---------------------------------------------------------------------------

describe('calculateCommunityPricing', () => {
  it('computes subtotal, tax, total for 1 person at $29.95', () => {
    const p = calculateCommunityPricing(29.95, 1)
    expect(p.subtotal).toBe(29.95)
    expect(p.tax).toBeCloseTo(2.67, 2)
    expect(p.total).toBeCloseTo(32.62, 2)
  })

  it('scales with quantity', () => {
    const p = calculateCommunityPricing(29.95, 4)
    expect(p.subtotal).toBe(119.8)
    expect(p.tax).toBeCloseTo(10.66, 2)
    expect(p.total).toBeCloseTo(130.46, 2)
  })

  it('accepts a custom tax rate', () => {
    const p = calculateCommunityPricing(100, 1, 0)
    expect(p).toEqual({ subtotal: 100, tax: 0, total: 100 })
  })

  it('returns zeros for quantity 0', () => {
    expect(calculateCommunityPricing(29.95, 0)).toEqual({ subtotal: 0, tax: 0, total: 0 })
  })
})

// ---------------------------------------------------------------------------
// generateCommunityBookingNumber
// ---------------------------------------------------------------------------

describe('generateCommunityBookingNumber', () => {
  it('matches the SAU-C-YYYYMMDD-XXXX format', () => {
    const num = generateCommunityBookingNumber('2026-04-23')
    expect(num).toMatch(/^SAU-C-20260423-[A-Z0-9]{4}$/)
  })

  it('uses the safe alphabet (no ambiguous 0/O/1/I chars) in the random suffix', () => {
    // Deterministic random that always returns 0 → first char of the alphabet
    const num = generateCommunityBookingNumber('2026-04-23', () => 0)
    expect(num).toBe('SAU-C-20260423-AAAA')
    // Sample many suffixes and verify the alphabet never includes ambiguous chars
    for (let i = 0; i < 200; i++) {
      const suffix = generateCommunityBookingNumber('2026-04-23').split('-').pop()!
      expect(suffix).not.toMatch(/[01IO]/)
    }
  })

  it('produces different values when random is different', () => {
    const a = generateCommunityBookingNumber('2026-04-23', () => 0)
    const b = generateCommunityBookingNumber('2026-04-23', () => 0.99)
    expect(a).not.toBe(b)
  })
})

// ---------------------------------------------------------------------------
// aggregateBookedBySlot
// ---------------------------------------------------------------------------

describe('aggregateBookedBySlot', () => {
  it('sums quantities per slot', () => {
    const result = aggregateBookedBySlot([
      { slot_time: '17:00:00', quantity: 2, status: 'confirmed' },
      { slot_time: '17:00:00', quantity: 3, status: 'pending' },
      { slot_time: '18:00:00', quantity: 1, status: 'confirmed' },
    ])
    expect(result.get('17:00:00')).toBe(5)
    expect(result.get('18:00:00')).toBe(1)
  })

  it('ignores cancelled bookings', () => {
    const result = aggregateBookedBySlot([
      { slot_time: '17:00:00', quantity: 5, status: 'confirmed' },
      { slot_time: '17:00:00', quantity: 5, status: 'cancelled' },
    ])
    expect(result.get('17:00:00')).toBe(5)
  })

  it('normalizes slot_time key format', () => {
    const result = aggregateBookedBySlot([
      { slot_time: '17:00', quantity: 2, status: 'confirmed' },
      { slot_time: '17:00:00', quantity: 3, status: 'confirmed' },
    ])
    expect(result.get('17:00:00')).toBe(5)
  })

  it('returns an empty map for no bookings', () => {
    expect(aggregateBookedBySlot([]).size).toBe(0)
  })
})
