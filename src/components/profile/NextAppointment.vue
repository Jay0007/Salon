<template>
  <div class="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="border-b bg-gray-50 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Next Appointment</h2>

          <p class="text-sm text-gray-500">Your upcoming visit</p>
        </div>

        <span class="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          Confirmed
        </span>
      </div>
    </div>

    <!-- Empty -->
    <div v-if="!booking" class="p-12 text-center">
      <div class="text-5xl mb-3">📅</div>

      <h3 class="text-lg font-semibold text-gray-800">No upcoming appointments</h3>

      <p class="mt-2 text-sm text-gray-500">Ready for your next visit?</p>

      <button
        class="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-700"
      >
        Book Appointment
      </button>
    </div>

    <!-- Appointment -->
    <div v-else class="p-6">
      <div class="flex flex-col lg:flex-row lg:justify-between gap-8">
        <!-- Left -->
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-500">Date</p>

            <h3 class="text-xl font-semibold text-gray-900">
              {{ dateLabel }}
            </h3>
          </div>

          <div>
            <p class="text-sm text-gray-500">Time</p>

            <h3 class="text-lg font-medium text-indigo-600">
              {{ timeLabel }}
            </h3>
          </div>

          <div>
            <p class="text-sm text-gray-500 mb-2">Services</p>

            <div class="flex flex-wrap gap-2">
              <span
                v-for="service in services"
                :key="service"
                class="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700"
              >
                {{ service }}
              </span>
            </div>
          </div>
        </div>

        <!-- Right -->
        <div class="flex flex-col justify-between">
          <div>
            <p class="text-sm text-gray-500">Staff</p>

            <p v-for="staff in staffMembers" :key="staff" class="font-medium text-gray-900">
              {{ staff }}
            </p>
          </div>

          <div class="mt-8 flex gap-3">
            <button
              @click="$emit('reschedule', booking)"
              class="rounded-xl border border-indigo-600 px-5 py-2 font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Reschedule
            </button>

            <button
              @click="$emit('cancel', booking.id)"
              class="rounded-xl bg-red-600 px-5 py-2 font-medium text-white hover:bg-red-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const emit = defineEmits(['cancel', 'reschedule'])

const props = defineProps({
  booking: Object,
  servicesMap: Object,
  staffMap: Object
})

const dateLabel = computed(() => {
  if (!props.booking) return ''

  return props.booking.startAt.toLocaleDateString([], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

const timeLabel = computed(() => {
  if (!props.booking) return ''

  return `${props.booking.startAt.toLocaleTimeString('en-CA', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })} – ${props.booking.endAt.toLocaleTimeString('en-CA', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })}`
})

const services = computed(() => {
  if (!props.booking) return []

  return props.booking.segments.map((s) => props.servicesMap[s.serviceId]?.name || 'Service')
})

const staffMembers = computed(() => {
  if (!props.booking) return []

  return [...new Set(props.booking.segments.map((s) => props.staffMap[s.staffId]?.name || 'Staff'))]
})
</script>
