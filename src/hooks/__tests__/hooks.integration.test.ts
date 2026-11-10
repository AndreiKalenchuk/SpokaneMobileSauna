import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { insertTestData, cleanupTestData, testSupabase, TEST_IDS } from '../../test/db-helpers';
import { supabase } from '../../lib/supabase';

import { useProducts } from '../useProducts';
import { usePricingRules } from '../usePricingRules';
import { useCoupon } from '../useCoupon';
import { useAvailability } from '../useAvailability';
import { useGalleryImages } from '../useGalleryImages';
import { useTestimonials } from '../useTestimonials';
import { useFaqs } from '../useFaqs';

// ---------------------------------------------------------------------------
// Shared wrapper
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

// ---------------------------------------------------------------------------
// Suite-level setup / teardown — insert once, clean once
// ---------------------------------------------------------------------------

beforeAll(async () => {
  await cleanupTestData();   // idempotent pre-clean in case a previous run crashed
  await insertTestData();
});

afterAll(async () => {
  await cleanupTestData();
});

// ---------------------------------------------------------------------------
// useProducts
// ---------------------------------------------------------------------------

describe('useProducts', () => {
  it('returns active products including the test product', async () => {
    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 10_000 });

    const ids = result.current.data!.map((p) => p.id);
    expect(ids).toContain(TEST_IDS.product);
  });

  it('does not return inactive products', async () => {
    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 10_000 });

    const ids = result.current.data!.map((p) => p.id);
    expect(ids).not.toContain(TEST_IDS.productInactive);
  });
});

// ---------------------------------------------------------------------------
// usePricingRules
// ---------------------------------------------------------------------------

describe('usePricingRules', () => {
  it('returns active pricing rules including the test rule', async () => {
    const { result } = renderHook(() => usePricingRules(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 10_000 });

    const ids = result.current.data!.map((r) => r.id);
    expect(ids).toContain(TEST_IDS.pricingRule);
  });

  it('does not return inactive pricing rules', async () => {
    const { result } = renderHook(() => usePricingRules(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 10_000 });

    const ids = result.current.data!.map((r) => r.id);
    expect(ids).not.toContain(TEST_IDS.pricingRuleInactive);
  });
});

// ---------------------------------------------------------------------------
// useCoupon — check_coupon() RPC (anon can't read the coupons table)
// ---------------------------------------------------------------------------

describe('useCoupon', () => {
  it('accepts a live code typed in any case, without revealing its id or usage', async () => {
    const { result } = renderHook(() => useCoupon('  test-integration '), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 10_000 });

    expect(result.current.data).toEqual({
      valid: true,
      code: 'TEST-INTEGRATION',
      discount_type: 'percent',
      discount_value: 25,
    });
  });

  it('reports an unknown code as not_found', async () => {
    const { result } = renderHook(() => useCoupon('DOES-NOT-EXIST-XYZ'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 10_000 });

    expect(result.current.data).toEqual({ valid: false, reason: 'not_found' });
  });

  it('reports a code past its expiration date as expired', async () => {
    const { result } = renderHook(() => useCoupon('TEST-INTEGRATION-OLD'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 10_000 });

    expect(result.current.data).toEqual({ valid: false, reason: 'expired' });
  });
});

// ---------------------------------------------------------------------------
// Public (anon) key — must not reach customer data or coupon codes
// ---------------------------------------------------------------------------

describe('public key access', () => {
  it('cannot list coupons', async () => {
    const { data, error } = await supabase.from('coupons').select('code');
    expect(error?.code).toBe('42501');
    expect(data).toBeNull();
  });

  it('cannot read booking customer details or ids', async () => {
    const email = await supabase.from('bookings').select('customer_email').limit(1);
    expect(email.error?.code).toBe('42501');
    const ids = await supabase.from('bookings').select('id').limit(1);
    expect(ids.error?.code).toBe('42501');
  });
});

// ---------------------------------------------------------------------------
// useAvailability
// ---------------------------------------------------------------------------

describe('useAvailability', () => {
  it('returns test booking and blocked date for June 2026', async () => {
    const { result } = renderHook(() => useAvailability('2026-06'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 10_000 });

    const data = result.current.data!;
    const bookingDates = data.bookings.map((b) => b.rental_date);
    expect(bookingDates).toContain('2026-06-20');

    const blockedDates = data.blockedDates.map((d) => d.date);
    expect(blockedDates).toContain('2026-06-15');
  });

  it('returns empty results for a month with no data', async () => {
    const { result } = renderHook(() => useAvailability('2030-01'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 10_000 });

    const data = result.current.data!;
    expect(data.bookings).toHaveLength(0);
    expect(data.blockedDates).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// useGalleryImages
// ---------------------------------------------------------------------------

describe('useGalleryImages', () => {
  it('returns active gallery images including the test image', async () => {
    const { result } = renderHook(() => useGalleryImages(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 10_000 });

    const ids = result.current.data!.map((i) => i.id);
    expect(ids).toContain(TEST_IDS.galleryImage);
  });

  it('does not return inactive gallery images', async () => {
    const { result } = renderHook(() => useGalleryImages(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 10_000 });

    const ids = result.current.data!.map((i) => i.id);
    expect(ids).not.toContain(TEST_IDS.galleryImageInactive);
  });
});

// ---------------------------------------------------------------------------
// useTestimonials
// ---------------------------------------------------------------------------

describe('useTestimonials', () => {
  it('returns active testimonials including the test testimonial', async () => {
    const { result } = renderHook(() => useTestimonials(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 10_000 });

    const ids = result.current.data!.map((t) => t.id);
    expect(ids).toContain(TEST_IDS.testimonial);
  });

  it('does not return inactive testimonials', async () => {
    const { result } = renderHook(() => useTestimonials(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 10_000 });

    const ids = result.current.data!.map((t) => t.id);
    expect(ids).not.toContain(TEST_IDS.testimonialInactive);
  });
});

// ---------------------------------------------------------------------------
// useFaqs
// ---------------------------------------------------------------------------

describe('useFaqs', () => {
  it('returns active FAQs including the test FAQ', async () => {
    const { result } = renderHook(() => useFaqs(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 10_000 });

    const ids = result.current.data!.map((f) => f.id);
    expect(ids).toContain(TEST_IDS.faq);
  });

  it('does not return inactive FAQs', async () => {
    const { result } = renderHook(() => useFaqs(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 10_000 });

    const ids = result.current.data!.map((f) => f.id);
    expect(ids).not.toContain(TEST_IDS.faqInactive);
  });
});

// ---------------------------------------------------------------------------
// Coupon uses — bookings trigger (migration 023). Runs last: it uses up the
// TEST-INTEGRATION coupon that the useCoupon tests expect to be live.
// ---------------------------------------------------------------------------

/** A checkout's pending booking with the TEST-INTEGRATION coupon (2099: never a real date). */
function book(id: string, rentalDate: string, extra: Record<string, unknown> = {}) {
  return testSupabase.from('bookings').insert({
    id,
    booking_number: `TEST-CPN-${id.slice(-1).toUpperCase()}`,
    customer_name: 'Coupon Test',
    customer_email: 'test@example.com',
    rental_date: rentalDate,
    status: 'pending',
    subtotal: 229,
    discount_amount: 57.25,
    tax_amount: 15.29,
    total_amount: 187.04,
    coupon_id: TEST_IDS.coupon,
    ...extra,
  });
}

async function uses() {
  const { data } = await testSupabase
    .from('coupons')
    .select('current_uses')
    .eq('id', TEST_IDS.coupon)
    .single();
  return data!.current_uses;
}

async function statusOf(id: string) {
  const { data } = await testSupabase.from('bookings').select('status').eq('id', id).single();
  return data!.status;
}

describe('coupon uses (bookings trigger)', () => {
  it('counts bookings, refuses past the quantity, and gives uses back', async () => {
    expect(await uses()).toBe(0);
    expect((await book(TEST_IDS.couponBookingA, '2099-01-01')).error).toBeNull();
    expect((await book(TEST_IDS.couponBookingB, '2099-01-02')).error).toBeNull();
    expect(await uses()).toBe(2);

    // Quantity is 2: the third checkout is refused and nothing is inserted
    const third = await book(TEST_IDS.couponBookingC, '2099-01-03');
    expect(third.error?.message).toContain('coupon_unavailable');
    expect(await uses()).toBe(2);

    const { data: check } = await supabase.rpc('check_coupon', { p_code: 'TEST-INTEGRATION' });
    expect(check).toEqual({ valid: false, reason: 'used_up' });

    // Declined card → cancelled → use returned
    await testSupabase.from('bookings').update({ status: 'cancelled' }).eq('id', TEST_IDS.couponBookingA);
    expect(await uses()).toBe(1);

    // Card retried and paid → counted again
    await testSupabase.from('bookings').update({ status: 'confirmed' }).eq('id', TEST_IDS.couponBookingA);
    expect(await uses()).toBe(2);

    // Completing a booking doesn't change the count; deleting one returns its use
    await testSupabase.from('bookings').update({ status: 'completed' }).eq('id', TEST_IDS.couponBookingA);
    expect(await uses()).toBe(2);
    await testSupabase.from('bookings').delete().eq('id', TEST_IDS.couponBookingB);
    expect(await uses()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Abandoned checkouts — hold expiry (migration 024). Runs after the coupon
// test, which leaves the coupon with 1 of 2 uses taken.
// ---------------------------------------------------------------------------

describe('unpaid booking holds', () => {
  it('new bookings get a 10-minute hold', async () => {
    expect((await book(TEST_IDS.freshHoldBooking, '2099-01-05', { coupon_id: null })).error).toBeNull();
    const { data } = await testSupabase
      .from('bookings')
      .select('created_at, hold_expires_at')
      .eq('id', TEST_IDS.freshHoldBooking)
      .single();
    const holdMs = Date.parse(data!.hold_expires_at) - Date.parse(data!.created_at);
    expect(holdMs).toBe(10 * 60 * 1000);
  });

  it('expire_unpaid_bookings cancels only expired holds and returns their coupon use', async () => {
    const before = await uses();
    const expired = await book(TEST_IDS.expiredHoldBooking, '2099-01-04', {
      hold_expires_at: new Date(Date.now() - 60_000).toISOString(),
    });
    expect(expired.error).toBeNull();
    expect(await uses()).toBe(before + 1);

    // The cron job may get there first; either way the outcome is the same
    const { error } = await testSupabase.rpc('expire_unpaid_bookings');
    expect(error).toBeNull();

    expect(await statusOf(TEST_IDS.expiredHoldBooking)).toBe('cancelled');
    expect(await uses()).toBe(before);
    expect(await statusOf(TEST_IDS.freshHoldBooking)).toBe('pending');
  });

  it('the public key cannot run the sweep', async () => {
    const { error } = await supabase.rpc('expire_unpaid_bookings');
    expect(error?.code).toBe('42501');
  });
});
