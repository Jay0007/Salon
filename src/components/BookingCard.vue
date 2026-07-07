<template>
  <!-- Mostly unused component, but kept for future use -->
  <div class="bg-black border rounded-xl p-6 mb-5 shadow-sm">
    <!-- Header -->
    <div class="flex justify-between mb-3">
      <div class="text-sm text-gray-600">
        {{ formatDate(startAt) }}
        ·
        {{ formatTime(startAt) }} – {{ formatTime(endAt) }}
      </div>

      <span :class="badgeClass">
        {{ badgeText }}
      </span>
    </div>
    <div class="text-sm text-gray-600 mb-3">Booking ID "Helooooooooooooooo"</div>
    <!-- Services -->
    <div v-for="s in normalizedServices" :key="s.id" class="flex justify-between py-2">
      <div>
        <p class="font-medium">{{ s.name }}</p>
        <p class="text-xs text-gray-500">{{ s.duration }} min</p>
      </div>
      <p class="font-medium">₹{{ s.price }}</p>
    </div>

    <!-- Footer -->
    <div class="mt-4 pt-4 border-t flex justify-between items-center">
      <span class="text-sm text-gray-600">
        {{ booking.totalDuration }} min · ₹{{ booking.totalPrice }}
      </span>

      <div v-if="!cancelled && !past" class="flex gap-4 text-sm">
        <button class="text-indigo-600 hover:underline" @click="$emit('reschedule', booking)">
          Reschedule
        </button>

        <button
          class="text-red-600 hover:underline disabled:opacity-50"
          :disabled="loadingId === booking.id"
          @click="$emit('cancel', booking.id)"
        >
          {{ loadingId === booking.id ? 'Cancelling…' : 'Cancel' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

/* ---------------- Props & Emits ---------------- */

const props = defineProps({
  booking: {
    type: Object,
    required: true
  },
  loadingId: String,
  cancelled: Boolean,
  past: Boolean
})

defineEmits(['cancel', 'reschedule'])

/* ---------------- Date Normalization ---------------- */

function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (value.toDate) return value.toDate() // Firestore Timestamp
  return new Date(value) // ISO string
}

const startAt = computed(() => toDate(props.booking.startAt))
const endAt = computed(() => toDate(props.booking.endAt))

/* ---------------- Formatting ---------------- */

function formatDate(d) {
  if (!d) return ''
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

function formatTime(d) {
  if (!d) return ''
  return d.toLocaleTimeString('en-CA', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

/* ---------------- Services Normalization ---------------- */

const normalizedServices = computed(() => {
  return Array.isArray(props.booking.services)
    ? props.booking.services.map((s) => ({
        id: s.id || s.serviceId,
        name: s.name,
        duration: s.duration,
        price: s.price
      }))
    : []
})

/* ---------------- Status Badge ---------------- */

const badgeClass = computed(() => {
  if (props.cancelled) {
    return 'text-xs px-3 py-1 rounded-full bg-red-100 text-red-700'
  }
  if (props.past) {
    return 'text-xs px-3 py-1 rounded-full bg-gray-200 text-gray-700'
  }
  return 'text-xs px-3 py-1 rounded-full bg-green-100 text-green-700'
})

const badgeText = computed(() =>
  props.cancelled ? 'Cancelled' : props.past ? 'Completed' : 'Upcoming'
)
</script>
