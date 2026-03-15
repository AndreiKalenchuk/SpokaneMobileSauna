import { create } from 'zustand'

export interface SelectedAddon {
  productId: string
  quantity: number
}

interface BookingState {
  selectedDate: Date | null
  selectedAddons: SelectedAddon[]
  deliveryMiles: number

  setSelectedDate: (date: Date | null) => void
  toggleAddon: (productId: string) => void
  setAddonQuantity: (productId: string, quantity: number) => void
  setDeliveryMiles: (miles: number) => void
  reset: () => void
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedDate: null,
  selectedAddons: [],
  deliveryMiles: 0,

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

  setDeliveryMiles: (miles) => set({ deliveryMiles: miles }),

  reset: () =>
    set({
      selectedDate: null,
      selectedAddons: [],
      deliveryMiles: 0,
    }),
}))
