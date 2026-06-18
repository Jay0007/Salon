<template>
  <div class="max-w-4xl mx-auto px-4 py-12">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-semibold text-gray-900">My Appointments</h1>
      <p class="text-gray-500 mt-1">View and manage your bookings</p>
    </div>

    <!-- Error -->
    <p v-if="error" class="mb-4 text-sm text-red-600">
      {{ error }}
    </p>

    <!-- Tabs -->
    <div class="flex gap-6 border-b mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="pb-3 text-sm font-medium border-b-2 transition"
        :class="
          activeTab === tab.key
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        "
      >
        {{ tab.label }}
        <span class="ml-1 text-xs text-gray-400"> ({{ tab.count }}) </span>
      </button>
    </div>

    <!-- List -->
    <div v-if="currentList.length" class="space-y-3">
      <AppointmentCard
        v-for="b in currentList"
        :key="b.id"
        :booking="b"
        :services-map="servicesMap"
        :staff-map="staffMap"
        :past="activeTab === 'past'"
        :cancelled="activeTab === 'cancelled'"
        @cancel="handleCancel"
        @reschedule="handleReschedule"
      />
    </div>
    <!-- Loading -->
    <div v-if="loading" class="text-left py-10 text-gray-500">Loading appointments…</div>

    <!-- Empty -->
    <div v-else-if="!loading" class="py-20 text-center text-sm text-gray-400">
      No {{ activeTab }} appointments.
    </div>

    <!-- Reschedule Modal -->
    <RescheduleModal
      v-if="showReschedule"
      :booking="selectedBooking"
      @close="closeReschedule"
      @confirm="confirmReschedule"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { auth, onAuthStateChanged, cancelBooking, rescheduleBooking } from '@/services/firebase'

import AppointmentCard from '@/components/AppointmentCard.vue'
import RescheduleModal from '@/components/RescheduleModal.vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/services/firebase'

/* ---------------- STATE ---------------- */

const upcoming = ref([])
const past = ref([])
const cancelled = ref([])

const loading = ref(true)
const error = ref(null)
const actionId = ref(null)

const showReschedule = ref(false)
const selectedBooking = ref(null)

const servicesMap = ref({})
const staffMap = ref({})

/* UI */
const activeTab = ref('upcoming')

/* ---------------- HELPERS ---------------- */

function toDate(v) {
  if (!v) return null
  if (v._custom?.value) return new Date(v._custom.value)
  if (typeof v.toDate === 'function') return v.toDate()
  if (v instanceof Date) return v
  if (typeof v === 'string') return new Date(v)
  return null
}

/* ---------------- LOAD BOOKINGS ---------------- */
async function loadLookups() {
  const fn = httpsCallable(functions, 'getBookingLookups')
  const res = await fn()
  servicesMap.value = res.data.services || {}
  staffMap.value = res.data.staff || {}
}
async function loadBookings() {
  loading.value = true
  error.value = null

  upcoming.value = []
  past.value = []
  cancelled.value = []

  try {
    const fn = httpsCallable(functions, 'getMyBookings')
    const res = await fn()

    const now = Date.now()

    for (const raw of res.data || []) {
      const startAt = new Date(raw.startAt)
      const endAt = new Date(raw.endAt)

      const booking = {
        ...raw,
        startAt,
        endAt
      }

      if (raw.status === 'cancelled') {
        cancelled.value.push(booking)
      } else if (endAt.getTime() > now) {
        upcoming.value.push(booking)
      } else {
        past.value.push(booking)
      }
    }

    upcoming.value.sort((a, b) => a.startAt - b.startAt)
    past.value.sort((a, b) => b.startAt - a.startAt)
  } catch (e) {
    console.error(e)
    error.value = 'Failed to load appointments'
  } finally {
    loading.value = false
  }
}

/* ---------------- AUTH ---------------- */

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return
    await loadLookups()
    await loadBookings(user)
  })
})
/* ---------------- ACTIONS ---------------- */

async function handleCancel(id) {
  if (!confirm('Cancel this appointment?')) return
  actionId.value = id

  try {
    await cancelBooking(id)
    await loadBookings(auth.currentUser)
  } catch (e) {
    error.value = e.message || 'Failed to cancel booking'
  } finally {
    actionId.value = null
  }
}

function handleReschedule(booking) {
  selectedBooking.value = booking
  showReschedule.value = true
}

function closeReschedule() {
  showReschedule.value = false
  selectedBooking.value = null
}

async function confirmReschedule(payload) {
  try {
    await rescheduleBooking(payload)
    closeReschedule()
    await loadBookings(auth.currentUser)
  } catch (e) {
    alert(e.message || 'Failed to reschedule booking')
  }
}

/* ---------------- TABS ---------------- */

const tabs = computed(() => [
  { key: 'upcoming', label: 'Upcoming', count: upcoming.value.length },
  { key: 'past', label: 'Past', count: past.value.length },
  { key: 'cancelled', label: 'Cancelled', count: cancelled.value.length }
])

const currentList = computed(() => {
  if (activeTab.value === 'upcoming') return upcoming.value
  if (activeTab.value === 'past') return past.value
  return cancelled.value
})
</script>
