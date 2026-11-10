import { describe, it, expect } from 'vitest';
import {
  couponDiscount,
  describeCoupon,
  generateCouponCode,
  isValidCouponCode,
  normalizeCouponCode,
} from '../coupons';
import type { CouponOffer } from '../coupons';

const percent = (value: number): CouponOffer => ({ code: 'PCT', discount_type: 'percent', discount_value: value });
const fixed = (value: number): CouponOffer => ({ code: 'FIX', discount_type: 'fixed', discount_value: value });

describe('couponDiscount', () => {
  it('percent of the subtotal, rounded to cents', () => {
    expect(couponDiscount(229, percent(50))).toBe(114.5);
    expect(couponDiscount(318, percent(15))).toBe(47.7);
    expect(couponDiscount(99.99, percent(33))).toBe(33);
  });

  it('fixed amount', () => {
    expect(couponDiscount(229, fixed(50))).toBe(50);
    expect(couponDiscount(229, fixed(12.5))).toBe(12.5);
  });

  it('never exceeds the subtotal', () => {
    expect(couponDiscount(30, fixed(500))).toBe(30);
  });

  it('0 without a coupon or subtotal', () => {
    expect(couponDiscount(229, null)).toBe(0);
    expect(couponDiscount(0, percent(50))).toBe(0);
    expect(couponDiscount(0, fixed(50))).toBe(0);
  });

  it('accepts Postgres numerics that arrive as strings', () => {
    const fromDb = { code: 'X', discount_type: 'fixed', discount_value: '25.00' } as unknown as CouponOffer;
    expect(couponDiscount(229, fromDb)).toBe(25);
  });
});

describe('normalizeCouponCode / isValidCouponCode', () => {
  it('trims and uppercases what customers type', () => {
    expect(normalizeCouponCode('  frends50 ')).toBe('FRENDS50');
  });

  it('accepts letters and numbers, with dashes only between groups', () => {
    expect(isValidCouponCode('SAUNA10')).toBe(true);
    expect(isValidCouponCode('SPRING-2027')).toBe(true);
    expect(isValidCouponCode('A1B2')).toBe(true);
  });

  it('rejects lowercase, symbols, stray dashes and bad lengths', () => {
    expect(isValidCouponCode('sauna10')).toBe(false);
    expect(isValidCouponCode('SAUNA 10')).toBe(false);
    expect(isValidCouponCode('SAUNA_10')).toBe(false);
    expect(isValidCouponCode('-SAUNA')).toBe(false);
    expect(isValidCouponCode('SAUNA--10')).toBe(false);
    expect(isValidCouponCode('ABC')).toBe(false);
    expect(isValidCouponCode('A'.repeat(33))).toBe(false);
  });
});

describe('describeCoupon', () => {
  it('formats both discount types', () => {
    expect(describeCoupon(percent(15))).toBe('15% off');
    expect(describeCoupon(fixed(50))).toBe('$50 off');
    expect(describeCoupon(fixed(12.5))).toBe('$12.50 off');
  });
});

describe('generateCouponCode', () => {
  it('produces valid 8-character codes without look-alike characters', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateCouponCode();
      expect(code).toHaveLength(8);
      expect(isValidCouponCode(code)).toBe(true);
      expect(code).not.toMatch(/[01ILO]/);
    }
  });

  it('is random', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateCouponCode()));
    expect(codes.size).toBe(50);
  });
});
