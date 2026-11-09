import type { Product, PricingRule, Coupon } from '../types';

/** Must match TAX_RATE in supabase/functions/create-payment-intent. */
export const TAX_RATE = 0.089;

/**
 * Determine the price for a product on a given date by matching pricing rules.
 * Priority: specific_dates (holidays) > day_of_week > base_price.
 * Among matching rules, the highest priority wins.
 */
export function getPriceForDate(
  product: Product,
  date: Date,
  pricingRules: PricingRule[],
): number {
  const productRules = pricingRules.filter(
    (r) => r.product_id === product.id && r.is_active,
  );

  const dateStr = formatDateToISO(date);
  const dayOfWeek = date.getDay(); // 0 = Sunday

  let bestRule: PricingRule | null = null;

  for (const rule of productRules) {
    let matches = false;

    if (rule.specific_dates?.includes(dateStr)) {
      matches = true;
    } else if (rule.day_of_week?.includes(dayOfWeek)) {
      matches = true;
    }

    if (matches && (bestRule === null || rule.priority > bestRule.priority)) {
      bestRule = rule;
    }
  }

  return bestRule ? bestRule.price : product.base_price;
}

/**
 * Calculate the discount amount for a given subtotal and coupon.
 * Returns 0 if the coupon is invalid, expired, or the order doesn't meet minimums.
 */
export function applyCoupon(subtotal: number, coupon: Coupon | null): number {
  if (!coupon || !coupon.is_active) return 0;

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) return 0;
  if (coupon.expires_at && new Date(coupon.expires_at) < now) return 0;
  if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses)
    return 0;
  if (coupon.min_order_amount !== null && subtotal < coupon.min_order_amount)
    return 0;

  if (coupon.discount_type === 'percent') {
    return Math.round(subtotal * (coupon.discount_value / 100) * 100) / 100;
  }

  return Math.min(coupon.discount_value, subtotal);
}

export interface OrderLine {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderTotals {
  mainPrice: number;
  addonLines: OrderLine[];
  fulfillmentFee: number;
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Display totals for a private rental. Mirrors create-payment-intent: the
 * delivery/pickup fee is part of the taxable subtotal.
 */
export function calculateOrderTotals({
  primaryProduct,
  addons,
  selectedAddons,
  date,
  pricingRules,
  fulfillmentFee,
}: {
  primaryProduct: Product | undefined;
  addons: Product[];
  selectedAddons: { productId: string; quantity: number }[];
  date: Date | null;
  pricingRules: PricingRule[];
  fulfillmentFee: number;
}): OrderTotals {
  if (!date || !primaryProduct) {
    return { mainPrice: 0, addonLines: [], fulfillmentFee: 0, subtotal: 0, tax: 0, total: 0 };
  }

  const mainPrice = getPriceForDate(primaryProduct, date, pricingRules);

  const addonLines: OrderLine[] = [];
  for (const sa of selectedAddons) {
    const product = addons.find((a) => a.id === sa.productId);
    if (product) {
      const unitPrice = getPriceForDate(product, date, pricingRules);
      addonLines.push({
        name: product.name,
        qty: sa.quantity,
        unitPrice,
        lineTotal: unitPrice * sa.quantity,
      });
    }
  }

  const addonTotal = addonLines.reduce((sum, l) => sum + l.lineTotal, 0);
  const subtotal = Math.round((mainPrice + addonTotal + fulfillmentFee) * 100) / 100;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return { mainPrice, addonLines, fulfillmentFee, subtotal, tax, total };
}

function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
