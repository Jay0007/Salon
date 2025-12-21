<template>
  <div class="max-w-6xl mx-auto px-4 py-10">
    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-3xl font-semibold text-gray-800">My Appointments</h2>
      <p class="text-gray-500 mt-1">View your upcoming and past salon bookings</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-6 mb-8 border-b">
      <button @click="tab = 'upcoming'" :class="tabClass('upcoming')">Upcoming</button>
      <button @click="tab = 'past'" :class="tabClass('past')">Past</button>
    </div>

    <!-- Empty state -->
    <div v-if="activeList.length === 0" class="text-center py-16 text-gray-400">
      No appointments found
    </div>

    <!-- Booking Cards -->
    <div
      v-for="item in activeList"
      :key="item.id"
      class="bg-white rounded-xl border shadow-sm p-6 mb-6"
    >
      <!-- Date & Status -->
      <div class="flex justify-between items-center mb-4">
        <div class="text-sm text-gray-600">
          {{ formatDate(item.startAt) }}
          ·
          {{ formatTime(item.startAt) }} – {{ formatTime(item.endAt) }}
        </div>

        <span
          class="text-xs px-3 py-1 rounded-full"
          :class="tab === 'upcoming' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'"
        >
          {{ tab === 'upcoming' ? 'Upcoming' : 'Completed' }}
        </span>
      </div>

      <!-- Services -->
      <div class="space-y-3">
        <div
          v-for="s in item.services"
          :key="s.serviceId"
          class="flex justify-between items-center bg-gray-50 rounded-lg p-3"
        >
          <div>
            <p class="font-medium text-gray-800">{{ s.name }}</p>
            <p class="text-xs text-gray-500">{{ s.duration }} min</p>
          </div>
          <div class="text-sm font-medium text-gray-700">₹{{ s.price }}</div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-5 pt-4 border-t flex justify-between text-sm">
        <span class="text-gray-600">Total</span>
        <span class="font-semibold text-gray-800">
          {{ item.totalDuration }} min · ₹{{ item.totalPrice }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { auth, getDocs, query, where, collection, db } from '@/services/firebase'

const tab = ref('upcoming')
const upcoming = ref([])
const past = ref([])

onMounted(loadBookings)

/**
 * SAFELY normalize Firestore Timestamp / Date
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
  past.value = []

  snap.forEach((d) => {
    const raw = d.data()

    const booking = {
      id: d.id,
      ...raw,
      startAt: toDate(raw.startAt || raw.startTime),
      endAt: toDate(raw.endAt || raw.endTime)
    }

    if (!booking.endAt) return

    if (booking.endAt >= now) upcoming.value.push(booking)
    else past.value.push(booking)
  })
}

const activeList = computed(() => (tab.value === 'upcoming' ? upcoming.value : past.value))

function formatDate(d) {
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

function formatTime(d) {
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function tabClass(t) {
  return [
    'pb-3 text-sm font-medium transition',
    tab.value === t
      ? 'text-indigo-600 border-b-2 border-indigo-600'
      : 'text-gray-500 hover:text-indigo-600'
  ]
}
</script>
