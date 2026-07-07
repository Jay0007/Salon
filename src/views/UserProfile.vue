<template>
  <div class="max-w-4xl mx-auto px-4 py-12">
    <!-- Error -->
    <p v-if="error" class="mb-4 text-sm text-red-600">
      {{ error }}
    </p>

    <ProfileHero
      v-if="currentUser"
      :user="currentUser"
      phone=""
      :member-since="formatMemberSince(currentUser.metadata.creationTime)"
    />
    <div class="mt-6">
      <ProfileStats
        :upcoming="upcoming.length"
        :completed="past.length"
        :cancelled="cancelled.length"
        :total-spent="totalSpent"
      />
    </div>
    <div class="mt-8">
      <NextAppointment
        :booking="upcoming[0]"
        :services-map="servicesMap"
        :staff-map="staffMap"
        @cancel="handleCancel"
        @reschedule="handleReschedule"
      />
    </div>
    <!-- Tabs -->
    <AppointmentTabs v-model="activeTab" :tabs="tabs">
      <template v-if="loading">
        <div class="py-12 text-center text-gray-500">Loading appointments...</div>
      </template>

      <template v-else-if="currentList.length">
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
      </template>

      <template v-else>
        <div class="py-16 text-center">
          <div class="text-5xl mb-4">📅</div>

          <h3 class="text-lg font-semibold text-gray-800">No {{ activeTab }} appointments</h3>

          <p class="mt-2 text-sm text-gray-500">Book your next appointment to get started.</p>
        </div>
      </template>
    </AppointmentTabs>

    <div class="mt-8">
      <PersonalInfo
        v-if="currentUser"
        :user="currentUser"
        phone=""
        :member-since="formatMemberSince(currentUser.metadata.creationTime)"
      />
    </div>
    <!-- Loading -->
    <div v-if="loading" class="text-left py-10 text-gray-500">Loading appointments…</div>

    <!-- Empty -->
    <div v-else-if="!loading" class="py-20 text-center text-sm text-gray-400">
      No More {{ activeTab }} appointments.
    </div>

    <!-- Reschedule Modal -->
    <RescheduleModal
      v-if="showReschedule"
      :booking="selectedBooking"
      @close="closeReschedule"
      @confirm="confirmReschedule"
    />
  </div>
  <!-- <button @click="makeMeAdmin">Make Me Admin</button> -->
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { auth, onAuthStateChanged, cancelBooking, rescheduleBooking } from '@/services/firebase'
import ProfileHero from '@/components/profile/ProfileHero.vue'
import ProfileStats from '@/components/profile/ProfileStats.vue'
import NextAppointment from '@/components/profile/NextAppointment.vue'
import AppointmentTabs from '@/components/profile/AppointmentTabs.vue'
import PersonalInfo from '@/components/profile/PersonalInfo.vue'

import AppointmentCard from '@/components/AppointmentCard.vue'
import RescheduleModal from '@/components/RescheduleModal.vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/services/firebase'

/* ---------------- STATE ---------------- */
const currentUser = ref(null)

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

  if (v instanceof Date) {
    return v
  }

  if (typeof v.toDate === 'function') {
    return v.toDate()
  }

  // Firestore callable timestamp
  if (v._seconds != null) {
    return new Date(v._seconds * 1000 + Math.floor((v._nanoseconds || 0) / 1e6))
  }

  if (v._custom?.value) {
    return new Date(v._custom.value)
  }

  if (typeof v === 'string') {
    return new Date(v)
  }

  return null
}

// async function makeMeAdmin() {
//   const fn = httpsCallable(functions, 'makeAdmin')

//   const result = await fn()

//   console.log(result.data)
// }

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
      const startAt = toDate(raw.startAt)
      const endAt = toDate(raw.endAt)

      const booking = {
        ...raw,
        startAt,
        endAt,

        segments: (raw.segments || []).map((s) => ({
          ...s,
          startAt: toDate(s.startAt),
          endAt: toDate(s.endAt)
        }))
      }
      console.log('Normalized booking', booking)
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

    currentUser.value = user

    await loadLookups()
    await loadBookings()
  })
})
/* ---------------- ACTIONS ---------------- */

function formatMemberSince(date) {
  if (!date) return ''

  return new Date(date).toLocaleDateString([], {
    month: 'long',
    year: 'numeric'
  })
}

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

// Computed

const totalSpent = computed(() => {
  return past.value.reduce((sum, booking) => {
    return (
      sum +
      booking.segments.reduce((s, seg) => {
        return s + (servicesMap.value[seg.serviceId]?.price || 0)
      }, 0)
    )
  }, 0)
})
</script>
