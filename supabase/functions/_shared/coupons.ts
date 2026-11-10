/**
 * Coupon codes and discount math.
 *
 * Pure TypeScript, shared like delivery.ts: create-payment-intent prices the
 * discount with it and src/lib/coupons.ts re-exports it for the checkout
 * summary, so the total a customer sees is the total Stripe charges. Whether a
 * code can be redeemed (active, not expired, uses left) is decided in Postgres
 * — check_coupon() and the bookings trigger in migration 023.
 */

export type DiscountType = 'percent' | 'fixed'

/** What check_coupon() reveals about a redeemable code — never its id or usage. */
export interface CouponOffer {
  code: string
  discount_type: DiscountType
  discount_value: number
}

export type CouponUnavailableReason = 'not_found' | 'expired' | 'used_up'

export type CouponCheck =
  | ({ valid: true } & CouponOffer)
  | { valid: false; reason: CouponUnavailableReason }

export const COUPON_REASON_MESSAGES: Record<CouponUnavailableReason, string> = {
  not_found: "We don't recognize that code.",
  expired: 'This code has expired.',
  used_up: 'This code has been fully redeemed.',
}

// Keep in sync with coupons_code_format in migration 023
const CODE_PATTERN = /^[A-Z0-9]+(-[A-Z0-9]+)*$/
export const COUPON_CODE_MIN_LENGTH = 4
export const COUPON_CODE_MAX_LENGTH = 32

/** Codes are stored uppercase; customers may type them any way. */
export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase()
}

export function isValidCouponCode(code: string): boolean {
  return (
    code.length >= COUPON_CODE_MIN_LENGTH &&
    code.length <= COUPON_CODE_MAX_LENGTH &&
    CODE_PATTERN.test(code)
  )
}

/**
 * Discount off the pre-tax subtotal (rental + add-ons + delivery/pickup), in
 * dollars. Never more than the subtotal; tax is charged on what's left.
 */
export function couponDiscount(subtotal: number, coupon: CouponOffer | null): number {
  if (!coupon || subtotal <= 0) return 0
  const value = Number(coupon.discount_value)
  const raw = coupon.discount_type === 'percent' ? subtotal * (value / 100) : value
  return Math.round(Math.min(raw, subtotal) * 100) / 100
}

/** "15% off" / "$50 off" */
export function describeCoupon(c: Pick<CouponOffer, 'discount_type' | 'discount_value'>): string {
  const value = Number(c.discount_value)
  return c.discount_type === 'percent'
    ? `${value}% off`
    : `$${Number.isInteger(value) ? value : value.toFixed(2)} off`
}
