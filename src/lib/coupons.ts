/**
 * Discount math comes from the edge functions' shared module (pure TS), so the
 * checkout summary and create-payment-intent can't drift apart. Customers check
 * codes with useCoupon(); only admins can read the coupons table.
 */
export {
  COUPON_CODE_MAX_LENGTH,
  COUPON_CODE_MIN_LENGTH,
  COUPON_REASON_MESSAGES,
  couponDiscount,
  describeCoupon,
  isValidCouponCode,
  normalizeCouponCode,
} from '../../supabase/functions/_shared/coupons.ts'
export type {
  CouponCheck,
  CouponOffer,
  CouponUnavailableReason,
  DiscountType,
} from '../../supabase/functions/_shared/coupons.ts'

// No look-alikes (0/O, 1/I/L) so codes survive being read aloud or retyped
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Random code for the admin "Generate" button — 8 chars ≈ 850 billion combinations. */
export function generateCouponCode(length = 8): string {
  // Bytes at or above this would favour the first few characters
  const limit = 256 - (256 % CODE_ALPHABET.length)
  let code = ''
  while (code.length < length) {
    const [byte] = crypto.getRandomValues(new Uint8Array(1))
    if (byte < limit) code += CODE_ALPHABET[byte % CODE_ALPHABET.length]
  }
  return code
}
