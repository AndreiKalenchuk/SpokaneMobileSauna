import type { CommunityEvent } from '@/types'

export const COMMUNITY_CUTOFF_MINUTES = 30
export const COMMUNITY_TAX_RATE = 0.089

/**
 * Convert a local `Date` into a `YYYY-MM-DD` string using local calendar
 * fields (no timezone conversion). Useful for pairing dates with database
 * `date` columns that are timezone-naive.
 */
export function formatDateToISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Format a `HH:MM` or `HH:MM:SS` time string as a 12-hour display
 * (e.g. `"17:00"` → `"5:00 PM"`).
 */
export function formatTime(time: string): string {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

/**
 * Format a `YYYY-MM-DD` string as `"Weekday, Month D, YYYY"`.
 * Uses noon UTC to avoid timezone-induced day drift.
 */
export function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Normalize any `HH:MM` or `HH:MM:SS` value to a canonical `HH:MM:00`.
 * Matches the format used by Postgres `time` columns.
 */
export function normalizeTime(time: string): string {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

/**
 * Given a community event (start/end/slot length), return the canonical
 * `HH:MM:00` arrival times. The last slot is only emitted if a full
 * `slot_minutes` window fits before `end_time`.
 */
export function generateSlotTimes(event: Pick<CommunityEvent, 'start_time' | 'end_time' | 'slot_minutes'>): string[] {
  const [sh, sm] = event.start_time.slice(0, 5).split(':').map(Number)
  const [eh, em] = event.end_time.slice(0, 5).split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  const slots: string[] = []
  if (event.slot_minutes <= 0) return slots
  for (let t = startMin; t + event.slot_minutes <= endMin; t += event.slot_minutes) {
    const h = Math.floor(t / 60)
    const m = t % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
  }
  return slots
}

/**
 * Check whether a slot is still bookable relative to `now`.
 *
 * Rules:
 * - If the event date is before today → past.
 * - If the event date is after today → not past.
 * - If it's today, the slot remains bookable until `slot_time + 30 minutes`.
 */
export function isSlotPast(
  eventDate: string,
  slotTime: string,
  now: Date = new Date(),
): boolean {
  const todayStr = formatDateToISO(now)
  if (eventDate < todayStr) return true
  if (eventDate > todayStr) return false

  const [h, m] = slotTime.slice(0, 5).split(':').map(Number)
  const cutoffMinutes = h * 60 + m + COMMUNITY_CUTOFF_MINUTES
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return nowMinutes > cutoffMinutes
}

export interface SlotAvailability {
  slotTime: string
  booked: number
  remaining: number
  capacity: number
  past: boolean
  full: boolean
}

/**
 * Build the full availability matrix for an event: one entry per generated
 * slot time, annotated with booked/remaining counts and past/full flags.
 */
export function getSlotAvailability(
  event: CommunityEvent,
  bookedBySlot: Map<string, number>,
  now: Date = new Date(),
): SlotAvailability[] {
  return generateSlotTimes(event).map((slotTime) => {
    const booked = bookedBySlot.get(slotTime) ?? 0
    const remaining = Math.max(0, event.capacity_per_slot - booked)
    const past = isSlotPast(event.event_date, slotTime, now)
    return {
      slotTime,
      booked,
      remaining,
      capacity: event.capacity_per_slot,
      past,
      full: remaining === 0,
    }
  })
}

/**
 * Compute subtotal / tax / total for a community booking.
 * Each dollar value is rounded to the nearest cent.
 */
export function calculateCommunityPricing(
  unitPrice: number,
  quantity: number,
  taxRate: number = COMMUNITY_TAX_RATE,
): { subtotal: number; tax: number; total: number } {
  const subtotal = Math.round(unitPrice * quantity * 100) / 100
  const tax = Math.round(subtotal * taxRate * 100) / 100
  const total = Math.round((subtotal + tax) * 100) / 100
  return { subtotal, tax, total }
}

/**
 * Validate that a slot is a legal arrival time for an event:
 * - Falls inside `[start_time, end_time - slot_minutes]`.
 * - Sits on a `slot_minutes` boundary from `start_time`.
 */
export function isSlotInWindow(
  event: Pick<CommunityEvent, 'start_time' | 'end_time' | 'slot_minutes'>,
  slotTime: string,
): boolean {
  const [sh, sm] = event.start_time.slice(0, 5).split(':').map(Number)
  const [eh, em] = event.end_time.slice(0, 5).split(':').map(Number)
  const [slh, slm] = slotTime.slice(0, 5).split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  const slotMin = slh * 60 + slm
  if (event.slot_minutes <= 0) return false
  if (slotMin < startMin) return false
  if (slotMin + event.slot_minutes > endMin) return false
  return (slotMin - startMin) % event.slot_minutes === 0
}

/**
 * Generate a short booking reference for a community booking.
 * Format: `SAU-C-YYYYMMDD-XXXX` (XXXX is an unambiguous uppercase code).
 */
export function generateCommunityBookingNumber(
  eventDate: string,
  random: () => number = Math.random,
): string {
  const dateCompact = eventDate.replace(/-/g, '')
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(random() * chars.length)]
  }
  return `SAU-C-${dateCompact}-${suffix}`
}

/**
 * Given a list of bookings for a date, aggregate the booked quantity
 * by slot time (keyed as `HH:MM:SS`). Cancelled bookings are ignored.
 */
export function aggregateBookedBySlot(
  bookings: ReadonlyArray<{ slot_time: string; quantity: number; status: string }>,
): Map<string, number> {
  const map = new Map<string, number>()
  for (const b of bookings) {
    if (b.status === 'cancelled') continue
    const key = normalizeTime(b.slot_time)
    map.set(key, (map.get(key) ?? 0) + (b.quantity ?? 0))
  }
  return map
}
