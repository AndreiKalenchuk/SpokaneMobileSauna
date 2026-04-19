import { create } from 'zustand'

interface CommunityBookingState {
  selectedEventDate: string | null
  selectedSlotTime: string | null
  quantity: number

  setSelectedEventDate: (date: string | null) => void
  setSelectedSlotTime: (time: string | null) => void
  setQuantity: (qty: number) => void
  reset: () => void
}

export const useCommunityBookingStore = create<CommunityBookingState>((set) => ({
  selectedEventDate: null,
  selectedSlotTime: null,
  quantity: 1,

  setSelectedEventDate: (date) =>
    set({ selectedEventDate: date, selectedSlotTime: null }),
  setSelectedSlotTime: (time) => set({ selectedSlotTime: time }),
  setQuantity: (qty) => set({ quantity: Math.max(1, qty) }),

  reset: () =>
    set({
      selectedEventDate: null,
      selectedSlotTime: null,
      quantity: 1,
    }),
}))
