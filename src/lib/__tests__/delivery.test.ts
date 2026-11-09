import { describe, it, expect } from 'vitest';
import {
  DEFAULT_DELIVERY_SETTINGS,
  calculateDeliveryFee,
  fillDeliveryTokens,
  formatMoney,
  fulfillmentFeeFor,
  normalizeDeliverySettings,
  serviceAreaText,
} from '../delivery';
import { parseOrigin } from '../../../supabase/functions/_shared/delivery.ts';
import type { DeliveryQuote, DeliverySettings, MileRounding } from '../delivery';

function makeSettings(overrides: Partial<DeliverySettings> = {}): DeliverySettings {
  return { ...DEFAULT_DELIVERY_SETTINGS, ...overrides };
}

function makeQuote(overrides: Partial<DeliveryQuote> = {}): DeliveryQuote {
  return {
    miles: 12,
    durationMinutes: 18,
    extraMiles: 0,
    fee: 89,
    withinServiceArea: true,
    matchedAddress: '123 MAIN ST, SPOKANE, WA, 99201',
    baseFee: 89,
    includedMiles: 20,
    ratePerExtraMile: 1,
    maxMiles: 50,
    ...overrides,
  };
}

describe('calculateDeliveryFee', () => {
  it.each([
    [0, 89, 0],
    [12.4, 89, 0],
    [20, 89, 0],
    [20.1, 90, 1],
    [21, 90, 1],
    [23.4, 93, 4],
    [50, 119, 30],
  ])('default settings: %d miles → $%d (%d extra miles)', (miles, fee, extraMiles) => {
    expect(calculateDeliveryFee(miles, DEFAULT_DELIVERY_SETTINGS)).toEqual({ fee, extraMiles });
  });

  it.each<[MileRounding, number, number]>([
    ['up', 4, 93],
    ['nearest', 3, 92],
    ['down', 3, 92],
    ['exact', 3.4, 92.4],
  ])('rounding "%s": 23.4 miles → %d extra miles, $%d', (rounding, extraMiles, fee) => {
    const s = makeSettings({ delivery_mile_rounding: rounding });
    expect(calculateDeliveryFee(23.4, s)).toEqual({ fee, extraMiles });
  });

  it('uses the admin base fee, free radius and per-mile rate', () => {
    const s = makeSettings({
      delivery_base_fee: 99,
      delivery_included_miles: 15,
      delivery_rate_per_extra_mile: 2.5,
    });
    expect(calculateDeliveryFee(15, s)).toEqual({ fee: 99, extraMiles: 0 });
    expect(calculateDeliveryFee(18.2, s)).toEqual({ fee: 109, extraMiles: 4 });
  });

  it('does not add a mile from floating-point noise', () => {
    // 22.1 - 20 = 2.1000000000000014 in floating point
    const s = makeSettings({ delivery_mile_rounding: 'exact' });
    expect(calculateDeliveryFee(22.1, s)).toEqual({ fee: 91.1, extraMiles: 2.1 });
  });
});

describe('fillDeliveryTokens', () => {
  it('fills prices, distances and pickup labels', () => {
    const text =
      '{delivery_fee} for {included_miles} mi, then {extra_mile_rate}/mi up to {max_miles}. Pickup is {pickup_price} off {pickup_exit} ({pickup_street}), {pickup_area}.';
    expect(fillDeliveryTokens(text, DEFAULT_DELIVERY_SETTINGS)).toBe(
      '$89 for 20 mi, then $1/mi up to 50. Pickup is free off I-90 Exit 280A (Maple St), Spokane, WA.',
    );
  });

  it('follows admin changes and leaves unknown tokens alone', () => {
    const s = makeSettings({ pickup_fee: 15, pickup_exit: 'I-90 Exit 281', delivery_base_fee: 92.5 });
    expect(fillDeliveryTokens('{pickup_price} at {pickup_exit}, {delivery_fee} {unknown}', s)).toBe(
      '$15 at I-90 Exit 281, $92.50 {unknown}',
    );
  });
});

describe('formatMoney', () => {
  it('drops cents for whole dollars', () => {
    expect(formatMoney(89)).toBe('$89');
    expect(formatMoney(1.5)).toBe('$1.50');
  });
});

describe('normalizeDeliverySettings', () => {
  it('falls back to defaults without a row', () => {
    expect(normalizeDeliverySettings(null)).toEqual(DEFAULT_DELIVERY_SETTINGS);
  });

  it('coerces numeric strings and drops blank list lines', () => {
    const s = normalizeDeliverySettings({
      delivery_base_fee: '95.00',
      delivery_mile_rounding: 'nearest',
      pickup_points: ['One', '  ', 'Two'],
    });
    expect(s.delivery_base_fee).toBe(95);
    expect(s.delivery_mile_rounding).toBe('nearest');
    expect(s.pickup_points).toEqual(['One', 'Two']);
  });

  it('ignores an unknown rounding mode', () => {
    expect(normalizeDeliverySettings({ delivery_mile_rounding: 'sideways' }).delivery_mile_rounding).toBe('up');
  });
});

describe('fulfillmentFeeFor', () => {
  it('charges the admin pickup fee for pickup', () => {
    expect(fulfillmentFeeFor('pickup', makeQuote(), DEFAULT_DELIVERY_SETTINGS)).toBe(0);
    expect(fulfillmentFeeFor('pickup', null, makeSettings({ pickup_fee: 10 }))).toBe(10);
  });

  it('is 0 until a delivery quote exists', () => {
    expect(fulfillmentFeeFor('delivery', null, DEFAULT_DELIVERY_SETTINGS)).toBe(0);
    expect(fulfillmentFeeFor(null, null, DEFAULT_DELIVERY_SETTINGS)).toBe(0);
  });

  it('charges the quoted fee for in-area delivery only', () => {
    expect(fulfillmentFeeFor('delivery', makeQuote({ fee: 93 }), DEFAULT_DELIVERY_SETTINGS)).toBe(93);
    expect(
      fulfillmentFeeFor(
        'delivery',
        makeQuote({ fee: 150, withinServiceArea: false }),
        DEFAULT_DELIVERY_SETTINGS,
      ),
    ).toBe(0);
  });
});

describe('serviceAreaText', () => {
  it('lists only enabled methods', () => {
    expect(serviceAreaText(DEFAULT_DELIVERY_SETTINGS)).toBe(
      'Delivery within 50 driving miles · Free pickup off I-90 Exit 280A',
    );
    expect(serviceAreaText(makeSettings({ pickup_enabled: false }))).toBe(
      'Delivery within 50 driving miles',
    );
    expect(serviceAreaText(makeSettings({ delivery_enabled: false, pickup_fee: 20 }))).toBe(
      '$20 pickup off I-90 Exit 280A',
    );
  });
});

describe('parseOrigin (server)', () => {
  it('parses "lat,lng"', () => {
    expect(parseOrigin(' 47.6, -117.4 ')).toEqual({ lat: 47.6, lng: -117.4 });
  });

  it('throws when the secret is missing or malformed', () => {
    expect(() => parseOrigin(undefined)).toThrow('DELIVERY_ORIGIN');
    expect(() => parseOrigin('47.6')).toThrow('DELIVERY_ORIGIN');
  });
});
