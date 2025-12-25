<template>
  <div class="bg-white border rounded-xl p-6 mb-5 shadow-sm">
    <!-- Header -->
    <div class="flex justify-between mb-3">
      <div class="text-sm text-gray-600">
        {{ formatDate(booking.startAt) }}
        ·
        {{ formatTime(booking.startAt) }} – {{ formatTime(booking.endAt) }}
      </div>

      <span :class="badgeClass">
        {{ badgeText }}
      </span>
    </div>

    <!-- Services -->
    <div v-for="s in booking.services" :key="s.serviceId" class="flex justify-between py-2">
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
defineProps({
  booking: Object,
  loadingId: String,
  cancelled: Boolean,
  past: Boolean
})

function formatDate(d) {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatTime(d) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const badgeClass = computed(() =>
  cancelled
    ? 'text-xs px-3 py-1 rounded-full bg-red-100 text-red-700'
    : past
      ? 'text-xs px-3 py-1 rounded-full bg-gray-200 text-gray-700'
      : 'text-xs px-3 py-1 rounded-full bg-green-100 text-green-700'
)

const badgeText = computed(() => (cancelled ? 'Cancelled' : past ? 'Completed' : 'Upcoming'))
</script>
