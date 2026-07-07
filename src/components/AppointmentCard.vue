<template>
  <div class="rounded-lg border bg-white p-4 shadow-sm hover:shadow transition max-w-xl">
    <!-- DATE + STATUS -->
    <div class="flex items-center justify-between mb-2">
      <p class="text-sm font-medium text-gray-900">
        {{ dateLabel }}
      </p>

      <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="statusClass">
        {{ statusLabel }}
      </span>
    </div>

    <!-- TIME -->
    <p class="text-sm text-blue-600 mb-2">
      {{ timeRange }}
    </p>

    <!-- SERVICES -->
    <ul class="text-sm text-gray-600 space-y-1 mb-3">
      <li
        v-for="seg in orderedSegments"
        :key="`${seg.serviceId}-${seg.staffId}-${toDate(seg.startAt)?.getTime()}`"
        class="flex justify-between"
      >
        <span>
          {{ seg.service?.name || 'Service' }}
          <span class="text-xs text-gray-400"> · {{ seg.staff?.name || 'Staff' }} </span>
        </span>

        <span class="text-xs text-gray-500"> {{ seg.duration }} min </span>
      </li>
    </ul>

    <!-- TOTAL -->
    <div class="flex justify-between text-sm font-medium border-t pt-2">
      <span>Total</span>
      <span>{{ totalDuration }} min · ₹{{ totalPrice }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'

const props = defineProps({
  booking: { type: Object, required: true },
  servicesMap: { type: Object, required: true },
  staffMap: { type: Object, required: true },
  past: Boolean,
  cancelled: Boolean
})
const DEBUG = false

// Hooks

onMounted(() => {
  console.log('BOOKING', props.booking)
  console.log('Staffmap', props.staffMap)
  console.log('Servicemap', props.servicesMap)
})

/* --------------------------------------------------
   HELPERS
-------------------------------------------------- */

function toDate(v) {
  if (!v) return null

  if (v instanceof Date) return v

  if (typeof v.toDate === 'function') {
    return v.toDate()
  }

  if (v._seconds != null) {
    return new Date(v._seconds * 1000)
  }

  if (v._custom?.value) {
    return new Date(v._custom.value)
  }

  if (typeof v === 'string') {
    return new Date(v)
  }

  return null
}

/* --------------------------------------------------
   COMPUTED
-------------------------------------------------- */

const start = computed(() => toDate(props.booking.startAt))
const end = computed(() => toDate(props.booking.endAt))

const dateLabel = computed(() =>
  start.value?.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
)

const timeRange = computed(() => {
  if (DEBUG) {
    console.log('start', start.value)
    console.log('end', end.value)
  }
  if (!start.value || !end.value) return ''
  return `${start.value.toLocaleTimeString('en-CA', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })} – ${end.value.toLocaleTimeString('en-CA', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })}`
})

const orderedSegments = computed(() => {
  if (DEBUG) {
    console.log('BOOKING', props.booking)
  }

  return [...(props.booking.segments || [])]
    .sort((a, b) => toDate(a.startAt) - toDate(b.startAt))
    .map((s) => {
      if (DEBUG) {
        console.log('SEGMENT', s)
      }

      return {
        ...s,
        service: props.servicesMap[s.serviceId],
        staff: props.staffMap[s.staffId],
        duration: (toDate(s.endAt) - toDate(s.startAt)) / 60000
      }
    })
})

const totalDuration = computed(() => orderedSegments.value.reduce((sum, s) => sum + s.duration, 0))

const totalPrice = computed(() =>
  orderedSegments.value.reduce((sum, s) => sum + (s.service?.price || 0), 0)
)

const statusLabel = computed(() => {
  if (props.cancelled) return 'Cancelled'
  if (props.past) return 'Completed'
  return 'Upcoming'
})

const statusClass = computed(() => {
  if (props.cancelled) return 'bg-red-50 text-red-600'
  if (props.past) return 'bg-green-50 text-green-600'
  return 'bg-blue-50 text-blue-600'
})
</script>
