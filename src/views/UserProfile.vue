<template>
  <div class="max-w-6xl mx-auto px-4 py-10">
    <!-- Header -->
    <div class="mb-10">
      <h2 class="text-3xl font-semibold text-gray-800">My Appointments</h2>
      <p class="text-gray-500 mt-1">Manage your upcoming, cancelled, and past bookings</p>
    </div>

    <!-- Error -->
    <p v-if="error" class="mb-6 text-sm text-red-600">
      {{ error }}
    </p>

    <!-- UPCOMING -->
    <section v-if="upcoming.length">
      <h3 class="text-lg font-semibold text-gray-700 mb-4">Upcoming</h3>

      <BookingCard
        v-for="b in upcoming"
        :key="b.id"
        :booking="b"
        :loading-id="actionId"
        @cancel="handleCancel"
        @reschedule="handleReschedule"
      />
    </section>

    <!-- CANCELLED -->
    <section v-if="cancelled.length" class="mt-12">
      <h3 class="text-lg font-semibold text-gray-700 mb-4">Cancelled</h3>

      <BookingCard v-for="b in cancelled" :key="b.id" :booking="b" cancelled />
    </section>

    <!-- PAST -->
    <section v-if="past.length" class="mt-12">
      <h3 class="text-lg font-semibold text-gray-700 mb-4">Past</h3>

      <BookingCard v-for="b in past" :key="b.id" :booking="b" past />
    </section>
    <RescheduleModal
      v-if="showReschedule"
      :booking="selectedBooking"
      @close="showReschedule = false"
      @confirm="confirmReschedule"
    />

    <!-- Empty -->
    <p
      v-if="!upcoming.length && !cancelled.length && !past.length"
      class="text-center text-gray-400 py-20"
    >
      No appointments found
    </p>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { auth, getDocs, query, where, collection, db, cancelBooking } from '@/services/firebase'
import BookingCard from '@/components/BookingCard.vue'
import RescheduleModal from '@/components/RescheduleModal.vue'
import { rescheduleBooking } from '@/services/firebase'

const upcoming = ref([])
const cancelled = ref([])
const past = ref([])

const actionId = ref(null)
const error = ref(null)
const showReschedule = ref(false)
const selectedBooking = ref(null)

onMounted(loadBookings)

/**
 * Normalize Firestore timestamps safely
 */
function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (value.toDate) return value.toDate()
  return new Date(value)
}

async function loadBookings() {
  const user = auth.currentUser
  if (!user) return

  const now = new Date()
  const q = query(collection(db, 'bookings'), where('userId', '==', user.uid))
  const snap = await getDocs(q)

  upcoming.value = []
  cancelled.value = []
  past.value = []

  snap.forEach((d) => {
    const raw = d.data()
    const booking = {
      id: d.id,
      ...raw,
      startAt: toDate(raw.startAt),
      endAt: toDate(raw.endAt)
    }

    if (booking.status === 'cancelled') {
      cancelled.value.push(booking)
    } else if (booking.endAt && booking.endAt >= now) {
      upcoming.value.push(booking)
    } else {
      past.value.push(booking)
    }
  })
}
function handleReschedule(booking) {
  selectedBooking.value = booking
  showReschedule.value = true
}
async function confirmReschedule(payload) {
  try {
    await rescheduleBooking(payload)
    showReschedule.value = false
    selectedBooking.value = null
    await loadBookings()
  } catch (err) {
    alert(err.message || 'Failed to reschedule')
  }
}

/**
 * Cancel booking
 */
async function handleCancel(id) {
  if (!confirm('Cancel this appointment?')) return

  error.value = null
  actionId.value = id

  try {
    await cancelBooking(id)
    await loadBookings()
  } catch (e) {
    error.value = e.message || 'Failed to cancel booking'
  } finally {
    actionId.value = null
  }
}
</script>
