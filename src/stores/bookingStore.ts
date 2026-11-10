import { create } from 'zustand'
import type { DeliveryQuote, FulfillmentMethod } from '@/lib/delivery'

export interface SelectedAddon {
  productId: string
  quantity: number
}

interface BookingState {
  selectedDate: Date | null
  selectedAddons: SelectedAddon[]
  fulfillmentMethod: FulfillmentMethod | null
  deliveryAddress: string
  deliveryQuote: DeliveryQuote | null
  /** A code check_coupon() accepted; checkout re-checks it and the server decides. */
  couponCode: string | null

  setSelectedDate: (date: Date | null) => void
  toggleAddon: (productId: string) => void
  setAddonQuantity: (productId: string, quantity: number) => void
  setFulfillmentMethod: (method: FulfillmentMethod) => void
  setDeliveryAddress: (address: string) => void
  setDeliveryQuote: (quote: DeliveryQuote | null) => void
  setCouponCode: (code: string | null) => void
  reset: () => void
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedDate: null,
  selectedAddons: [],
  fulfillmentMethod: null,
  deliveryAddress: '',
  deliveryQuote: null,
  couponCode: null,

  setSelectedDate: (date) => set({ selectedDate: date }),

  toggleAddon: (productId) =>
    set((state) => {
      const exists = state.selectedAddons.find(
        (a) => a.productId === productId,
      )
      if (exists) {
        return {
          selectedAddons: state.selectedAddons.filter(
            (a) => a.productId !== productId,
          ),
        }
      }
      return {
        selectedAddons: [
          ...state.selectedAddons,
          { productId, quantity: 1 },
        ],
      }
    }),

  setAddonQuantity: (productId, quantity) =>
    set((state) => ({
      selectedAddons: state.selectedAddons.map((a) =>
        a.productId === productId ? { ...a, quantity } : a,
      ),
    })),

  setFulfillmentMethod: (method) => set({ fulfillmentMethod: method }),

  // Editing the address invalidates the quote it was computed for
  setDeliveryAddress: (address) =>
    set({ deliveryAddress: address, deliveryQuote: null }),

  setDeliveryQuote: (quote) => set({ deliveryQuote: quote }),

  setCouponCode: (code) => set({ couponCode: code }),

  reset: () =>
    set({
      selectedDate: null,
      selectedAddons: [],
      fulfillmentMethod: null,
      deliveryAddress: '',
      deliveryQuote: null,
      couponCode: null,
    }),
}))
