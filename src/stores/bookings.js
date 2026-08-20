import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBookingsStore = defineStore('bookings', () => {
  const upcomingBookings = ref([])
  const pastBookings = ref([])

  const loading = ref(false)
  const loaded = ref(false)

  return {
    upcomingBookings,
    pastBookings,
    loading,
    loaded
  }
})
