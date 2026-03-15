import { describe, it, expect, vi, afterEach } from 'vitest';
import { getPriceForDate, applyCoupon } from '../pricing';
import type { Product, PricingRule, Coupon } from '../../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SAUNA_ID = 'prod-sauna-0001';
const ADDON_ID = 'prod-addon-0002';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: SAUNA_ID,
    name: 'Mobile Sauna 6 Person',
    slug: 'mobile-sauna-6-person',
    description: null,
    type: 'primary',
    base_price: 229,
    image_url: null,
    is_active: true,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeAddonProduct(): Product {
  return makeProduct({
    id: ADDON_ID,
    name: 'Cold Plunge Tub',
    slug: 'cold-plunge-tub',
    type: 'addon',
    base_price: 19,
  });
}

function makeRule(overrides: Partial<PricingRule> = {}): PricingRule {
  return {
    id: 'rule-0001',
    product_id: SAUNA_ID,
    rule_type: 'weekday',
    price: 229,
    day_of_week: [1, 2, 3, 4],
    specific_dates: null,
    label: 'Weekday rate',
    priority: 1,
    is_active: true,
    ...overrides,
  };
}

const HOLIDAYS = [
  '2026-01-01', '2026-04-12', '2026-05-25', '2026-07-04',
  '2026-09-07', '2026-11-26', '2026-12-24', '2026-12-25', '2026-12-31',
];

const saunaRules: PricingRule[] = [
  makeRule({ id: 'r1', rule_type: 'weekday', price: 229, day_of_week: [1, 2, 3, 4], priority: 1 }),
  makeRule({ id: 'r2', rule_type: 'weekend', price: 289, day_of_week: [5, 6, 0], priority: 2 }),
  makeRule({ id: 'r3', rule_type: 'holiday', price: 319, day_of_week: null, specific_dates: HOLIDAYS, priority: 3 }),
];

const addonRules: PricingRule[] = [
  makeRule({ id: 'a1', product_id: ADDON_ID, rule_type: 'weekday', price: 19, day_of_week: [1, 2, 3, 4], priority: 1 }),
  makeRule({ id: 'a2', product_id: ADDON_ID, rule_type: 'weekend', price: 19, day_of_week: [5, 6, 0], priority: 2 }),
  makeRule({ id: 'a3', product_id: ADDON_ID, rule_type: 'holiday', price: 19, day_of_week: null, specific_dates: HOLIDAYS, priority: 3 }),
];

const allRules = [...saunaRules, ...addonRules];

function makeCoupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    id: 'coupon-0001',
    code: 'frends50',
    discount_type: 'percent',
    discount_value: 50,
    min_order_amount: null,
    max_uses: null,
    current_uses: 0,
    starts_at: null,
    expires_at: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getPriceForDate
// ---------------------------------------------------------------------------

describe('getPriceForDate', () => {
  const sauna = makeProduct();

  // --- Happy Path ---

  it('returns weekday price for a Monday', () => {
    // 2026-03-16 is a Monday
    expect(getPriceForDate(sauna, new Date(2026, 2, 16), allRules)).toBe(229);
  });

  it('returns weekday price for a Thursday', () => {
    // 2026-03-19 is a Thursday
    expect(getPriceForDate(sauna, new Date(2026, 2, 19), allRules)).toBe(229);
  });

  it('returns weekend price for a Saturday', () => {
    // 2026-03-21 is a Saturday
    expect(getPriceForDate(sauna, new Date(2026, 2, 21), allRules)).toBe(289);
  });

  it('returns weekend price for a Sunday', () => {
    // 2026-03-15 is a Sunday
    expect(getPriceForDate(sauna, new Date(2026, 2, 15), allRules)).toBe(289);
  });

  it('returns holiday price for July 4th', () => {
    // 2026-07-04 is a Saturday
    expect(getPriceForDate(sauna, new Date(2026, 6, 4), allRules)).toBe(319);
  });

  it('returns flat addon price regardless of weekday', () => {
    const addon = makeAddonProduct();
    expect(getPriceForDate(addon, new Date(2026, 2, 16), allRules)).toBe(19);
  });

  it('returns flat addon price regardless of weekend', () => {
    const addon = makeAddonProduct();
    expect(getPriceForDate(addon, new Date(2026, 2, 21), allRules)).toBe(19);
  });

  // --- Edge Cases ---

  it('holiday on a weekend: holiday wins (higher priority)', () => {
    // 2026-07-04 is a Saturday — both weekend (p2) and holiday (p3) match; holiday wins
    expect(getPriceForDate(sauna, new Date(2026, 6, 4), allRules)).toBe(319);
  });

  it('Easter 2026-04-12 (Sunday): holiday priority beats weekend', () => {
    expect(getPriceForDate(sauna, new Date(2026, 3, 12), allRules)).toBe(319);
  });

  it('falls back to base_price when no rules match the product', () => {
    const orphanProduct = makeProduct({ id: 'prod-orphan-9999' });
    expect(getPriceForDate(orphanProduct, new Date(2026, 2, 16), allRules)).toBe(229);
  });

  it('falls back to base_price when product has zero pricing rules', () => {
    expect(getPriceForDate(sauna, new Date(2026, 2, 16), [])).toBe(229);
  });

  it('skips inactive rule even if it matches the date', () => {
    const rulesWithInactive: PricingRule[] = [
      makeRule({ id: 'inactive', price: 999, day_of_week: [1, 2, 3, 4, 5, 6, 0], priority: 10, is_active: false }),
    ];
    expect(getPriceForDate(sauna, new Date(2026, 2, 16), rulesWithInactive)).toBe(229);
  });

  it('when two rules tie on priority the higher-priority one wins (no lower fallback)', () => {
    const tiedRules: PricingRule[] = [
      makeRule({ id: 't1', price: 100, day_of_week: [1], priority: 5 }),
      makeRule({ id: 't2', price: 200, day_of_week: [1], priority: 5 }),
    ];
    const result = getPriceForDate(sauna, new Date(2026, 2, 16), tiedRules);
    expect([100, 200]).toContain(result);
  });

  // --- Negative Testing ---

  it('returns base_price with empty pricingRules array', () => {
    expect(getPriceForDate(sauna, new Date(2026, 5, 15), [])).toBe(229);
  });

  it('returns base_price when product ID matches no rule', () => {
    const unmatched = makeProduct({ id: 'no-match' });
    expect(getPriceForDate(unmatched, new Date(2026, 2, 16), allRules)).toBe(229);
  });

  it('falls back to day_of_week for a far-future date with no specific_dates match', () => {
    // 2030-06-03 is a Monday — no holiday specific_dates for 2030 but weekday rule matches
    expect(getPriceForDate(sauna, new Date(2030, 5, 3), allRules)).toBe(229);
  });
});

// ---------------------------------------------------------------------------
// applyCoupon
// ---------------------------------------------------------------------------

describe('applyCoupon', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Happy Path ---

  it('frends50: 50% off $229 = $114.50', () => {
    const coupon = makeCoupon({ discount_type: 'percent', discount_value: 50 });
    expect(applyCoupon(229, coupon)).toBe(114.5);
  });

  it('frends-50: $50 fixed off $229 = $50', () => {
    const coupon = makeCoupon({ code: 'frends-50', discount_type: 'fixed', discount_value: 50 });
    expect(applyCoupon(229, coupon)).toBe(50);
  });

  it('active coupon with no constraints applies correctly', () => {
    const coupon = makeCoupon({ discount_type: 'percent', discount_value: 10 });
    expect(applyCoupon(100, coupon)).toBe(10);
  });

  // --- Edge Cases ---

  it('fixed discount larger than subtotal is capped at subtotal', () => {
    const coupon = makeCoupon({ discount_type: 'fixed', discount_value: 500 });
    expect(applyCoupon(30, coupon)).toBe(30);
  });

  it('100% percent discount returns the full subtotal', () => {
    const coupon = makeCoupon({ discount_type: 'percent', discount_value: 100 });
    expect(applyCoupon(229, coupon)).toBe(229);
  });

  it('$0 subtotal with percent coupon returns 0', () => {
    const coupon = makeCoupon({ discount_type: 'percent', discount_value: 50 });
    expect(applyCoupon(0, coupon)).toBe(0);
  });

  it('$0 subtotal with fixed coupon returns 0', () => {
    const coupon = makeCoupon({ discount_type: 'fixed', discount_value: 50 });
    expect(applyCoupon(0, coupon)).toBe(0);
  });

  it('returns 0 when subtotal is below min_order_amount', () => {
    const coupon = makeCoupon({ min_order_amount: 100 });
    expect(applyCoupon(50, coupon)).toBe(0);
  });

  it('returns 0 when coupon is at max_uses', () => {
    const coupon = makeCoupon({ max_uses: 10, current_uses: 10 });
    expect(applyCoupon(229, coupon)).toBe(0);
  });

  it('returns 0 when coupon starts_at is in the future', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01'));
    const coupon = makeCoupon({ starts_at: '2026-06-01T00:00:00Z' });
    expect(applyCoupon(229, coupon)).toBe(0);
  });

  it('returns 0 when coupon expires_at is in the past', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01'));
    const coupon = makeCoupon({ expires_at: '2026-01-01T00:00:00Z' });
    expect(applyCoupon(229, coupon)).toBe(0);
  });

  // --- Negative Testing ---

  it('returns 0 for null coupon', () => {
    expect(applyCoupon(229, null)).toBe(0);
  });

  it('returns 0 for inactive coupon', () => {
    const coupon = makeCoupon({ is_active: false });
    expect(applyCoupon(229, coupon)).toBe(0);
  });
});
