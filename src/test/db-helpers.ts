import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Service-role client bypasses RLS for test data setup/teardown
export const testSupabase = createClient(supabaseUrl, serviceRoleKey);

// Deterministic UUIDs for test data — easy to insert and clean up
export const TEST_IDS = {
  product: 'aaaaaaaa-aaaa-4000-8000-000000000001',
  productInactive: 'aaaaaaaa-aaaa-4000-8000-000000000002',
  pricingRule: 'bbbbbbbb-bbbb-4000-8000-000000000001',
  pricingRuleInactive: 'bbbbbbbb-bbbb-4000-8000-000000000002',
  coupon: 'cccccccc-cccc-4000-8000-000000000001',
  blockedDate: 'dddddddd-dddd-4000-8000-000000000001',
  galleryImage: 'eeeeeeee-eeee-4000-8000-000000000001',
  galleryImageInactive: 'eeeeeeee-eeee-4000-8000-000000000002',
  testimonial: 'ffffffff-ffff-4000-8000-000000000001',
  testimonialInactive: 'ffffffff-ffff-4000-8000-000000000002',
  faq: '11111111-1111-4000-8000-000000000001',
  faqInactive: '11111111-1111-4000-8000-000000000002',
  booking: '22222222-2222-4000-8000-000000000001',
  bookingItem: '33333333-3333-4000-8000-000000000001',
} as const;

async function insert(table: string, data: Record<string, unknown> | Record<string, unknown>[]) {
  const { error } = await testSupabase.from(table).insert(data);
  if (error) throw new Error(`Failed to insert into ${table}: ${error.message}`);
}

export async function insertTestData() {
  // Products
  await insert('products', [
    {
      id: TEST_IDS.product,
      name: 'Test Sauna',
      slug: 'test-sauna-integration',
      description: 'Integration test product',
      type: 'primary',
      base_price: 229,
      is_active: true,
      sort_order: 9000,
    },
    {
      id: TEST_IDS.productInactive,
      name: 'Inactive Test Product',
      slug: 'test-inactive-product',
      description: 'Should not appear in queries',
      type: 'addon',
      base_price: 10,
      is_active: false,
      sort_order: 9001,
    },
  ]);

  // Pricing rules
  await insert('pricing_rules', [
    {
      id: TEST_IDS.pricingRule,
      product_id: TEST_IDS.product,
      rule_type: 'weekday',
      price: 229,
      day_of_week: [1, 2, 3, 4],
      label: 'Test weekday',
      priority: 1,
      is_active: true,
    },
    {
      id: TEST_IDS.pricingRuleInactive,
      product_id: TEST_IDS.product,
      rule_type: 'weekend',
      price: 289,
      day_of_week: [5, 6, 0],
      label: 'Inactive test rule',
      priority: 2,
      is_active: false,
    },
  ]);

  // Coupons
  await insert('coupons', {
    id: TEST_IDS.coupon,
    code: 'test-integration-coupon',
    discount_type: 'percent',
    discount_value: 25,
    is_active: true,
  });

  // Blocked dates
  await insert('blocked_dates', {
    id: TEST_IDS.blockedDate,
    date: '2026-06-15',
    reason: 'Integration test blocked date',
  });

  // Gallery images
  await insert('gallery_images', [
    {
      id: TEST_IDS.galleryImage,
      url: '/gallery/test-image.jpg',
      alt_text: 'Test image',
      category: 'test',
      sort_order: 9000,
      is_active: true,
    },
    {
      id: TEST_IDS.galleryImageInactive,
      url: '/gallery/test-inactive.jpg',
      alt_text: 'Inactive test image',
      category: 'test',
      sort_order: 9001,
      is_active: false,
    },
  ]);

  // Testimonials
  await insert('testimonials', [
    {
      id: TEST_IDS.testimonial,
      customer_name: 'Test User',
      rating: 5,
      text: 'Integration test testimonial',
      date: '2026-03-01',
      is_featured: false,
      is_active: true,
    },
    {
      id: TEST_IDS.testimonialInactive,
      customer_name: 'Inactive Test User',
      rating: 3,
      text: 'Should not appear',
      date: '2026-03-01',
      is_featured: false,
      is_active: false,
    },
  ]);

  // FAQs
  await insert('faqs', [
    {
      id: TEST_IDS.faq,
      question: 'Test FAQ question?',
      answer: 'Test FAQ answer.',
      category: 'ZZZ-Test',
      sort_order: 9000,
      is_active: true,
    },
    {
      id: TEST_IDS.faqInactive,
      question: 'Inactive FAQ?',
      answer: 'Should not appear.',
      category: 'ZZZ-Test',
      sort_order: 9001,
      is_active: false,
    },
  ]);

  // Booking (for availability test)
  await insert('bookings', {
    id: TEST_IDS.booking,
    booking_number: 'TEST-INTEG-001',
    customer_name: 'Test Booker',
    customer_email: 'test@example.com',
    rental_date: '2026-06-20',
    status: 'confirmed',
    subtotal: 229,
    tax_amount: 20,
    total_amount: 249,
    discount_amount: 0,
  });

  await insert('booking_items', {
    id: TEST_IDS.bookingItem,
    booking_id: TEST_IDS.booking,
    product_id: TEST_IDS.product,
    quantity: 1,
    unit_price: 229,
    total_price: 229,
  });
}

export async function cleanupTestData() {
  const ids = TEST_IDS;

  // Delete in FK-safe order
  await testSupabase.from('booking_items').delete().eq('id', ids.bookingItem);
  await testSupabase.from('bookings').delete().eq('id', ids.booking);
  await testSupabase.from('pricing_rules').delete().in('id', [ids.pricingRule, ids.pricingRuleInactive]);
  await testSupabase.from('products').delete().in('id', [ids.product, ids.productInactive]);
  await testSupabase.from('coupons').delete().eq('id', ids.coupon);
  await testSupabase.from('blocked_dates').delete().eq('id', ids.blockedDate);
  await testSupabase.from('gallery_images').delete().in('id', [ids.galleryImage, ids.galleryImageInactive]);
  await testSupabase.from('testimonials').delete().in('id', [ids.testimonial, ids.testimonialInactive]);
  await testSupabase.from('faqs').delete().in('id', [ids.faq, ids.faqInactive]);
}
