export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: 'primary' | 'addon' | 'standalone';
  base_price: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PricingRule {
  id: string;
  product_id: string;
  rule_type: 'weekday' | 'weekend' | 'holiday' | 'custom';
  price: number;
  day_of_week: number[] | null;
  specific_dates: string[] | null;
  label: string | null;
  priority: number;
  is_active: boolean;
}

export interface Booking {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  rental_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  stripe_payment_intent_id: string | null;
  coupon_id: string | null;
  discount_amount: number;
  notes: string | null;
  delivery_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingItem {
  id: string;
  booking_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
}

export interface GalleryImage {
  id: string;
  url: string;
  alt_text: string | null;
  caption: string | null;
  category: string;
  sort_order: number;
  is_active: boolean;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  rating: number;
  text: string;
  date: string;
  is_featured: boolean;
  is_active: boolean;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  current_uses: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CommunityEvent {
  id: string;
  event_date: string;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  location: string;
  capacity_per_slot: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityEventSeries {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  location: string;
  capacity_per_slot: number;
  starts_on: string;
  ends_on: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityBooking {
  id: string;
  booking_number: string;
  event_date: string;
  slot_time: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  quantity: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  stripe_payment_intent_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
