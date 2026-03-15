import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { insertTestData, cleanupTestData, TEST_IDS } from '../../test/db-helpers';

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
// useCoupon
// ---------------------------------------------------------------------------

describe('useCoupon', () => {
  it('returns matching coupon for a valid code', async () => {
    const { result } = renderHook(() => useCoupon('test-integration-coupon'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 10_000 });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.id).toBe(TEST_IDS.coupon);
    expect(result.current.data!.discount_type).toBe('percent');
    expect(result.current.data!.discount_value).toBe(25);
  });

  it('returns null for a non-existent coupon code', async () => {
    const { result } = renderHook(() => useCoupon('does-not-exist-xyz'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 10_000 });

    expect(result.current.data).toBeNull();
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
