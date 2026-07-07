<template>
  <div class="space-y-5">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900">Choose Your Appointment Time</h2>

      <p class="mt-2 text-sm text-gray-500">
        Select a date and we'll show the earliest appointments available for your selected services.
      </p>
    </div>
    <!-- DATE PICKER -->
    <div class="rounded-2xl border border-gray-200 bg-white p-5">
      <label class="mb-3 block text-sm font-semibold text-gray-700"> Appointment Date </label>
      <div class="flex items-center gap-4">
        <input
          type="date"
          :min="today"
          :value="selectedDate || ''"
          @change="onDateChange"
          class="w-full rounded-xl border border-gray-300 px-4 py-3 text-base transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <button>Today</button>
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="rounded-2xl border border-dashed border-gray-300 py-12 text-center">
      <div
        class="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
      ></div>

      <p class="font-medium text-gray-700">Finding the best available appointments...</p>

      <p class="mt-1 text-sm text-gray-500">This usually takes few seconds.</p>
    </div>

    <!-- TIMELINES -->
    <div v-if="!loading && timelines.length">
      <label class="block text-sm font-medium text-gray-700 mb-3"> Select Time </label>

      <div class="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-2">
        <button
          v-for="timeline in visibleTimelines"
          :key="timeline.startAt + timeline.endAt"
          @click="selectTimeline(timeline)"
          class="group rounded-2xl border p-2 transition-all duration-200"
          :class="
            selectedStart === toDate(timeline.startAt)?.getTime()
              ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-100 shadow-md scale-[1.01]'
              : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5'
          "
        >
          {{ formatTime(timeline.startAt) }}
        </button>
      </div>
    </div>

    <!-- NO AVAILABILITY -->
    <div
      v-if="!loading && selectedDate && !timelines.length"
      class="rounded-2xl border border-dashed border-gray-300 py-14 text-center"
    >
      <div class="mb-4 text-5xl">📅</div>

      <h3 class="font-semibold text-gray-900">No appointments available</h3>

      <p class="mt-2 text-sm text-gray-500">Try another date or choose different staff.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/services/firebase'

/* --------------------------------------------------
   PROPS / EMITS
-------------------------------------------------- */

const props = defineProps({
  serviceIds: { type: Array, required: true },
  preferredStaffMap: { type: Object, required: true },
  modelValue: Object
})

const emit = defineEmits(['update:modelValue'])

/* --------------------------------------------------
   STATE
-------------------------------------------------- */

const selectedDate = ref(null)
const timelines = ref([])
const loading = ref(false)

const today = new Date().toISOString().slice(0, 10)
let lastRequestKey = ''

const selectedStart = computed(() => toDate(props.modelValue?.startAt)?.getTime() || null)

/* --------------------------------------------------
   HELPERS
-------------------------------------------------- */

function formatTime(value) {
  const d = toDate(value)
  if (!d) return '--:--'

  return d.toLocaleTimeString('en-CA', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}
function toDate(value) {
  if (!value) return null

  // Firestore Timestamp (rare in client, but safe)
  if (typeof value.toDate === 'function') {
    return value.toDate()
  }

  // Callable-serialized Timestamp
  if (value._seconds != null) {
    return new Date(value._seconds * 1000 + Math.floor(value._nanoseconds / 1e6))
  }

  // ISO fallback (legacy safety)
  if (typeof value === 'string') {
    const d = new Date(value)
    return isNaN(d) ? null : d
  }

  return null
}

/**
 * LOCAL NOON → avoids timezone date shift
 */
// function buildDateForBackend(dateStr) {
//   const [y, m, d] = dateStr.split('-').map(Number)
//   return new Date(y, m - 1, d, 12, 0, 0).toISOString()
// }

/* --------------------------------------------------
   COMPUTED
-------------------------------------------------- */

const visibleTimelines = computed(() => {
  const seen = new Set()
  return timelines.value.filter((t) => {
    if (seen.has(t.startAt)) return false
    seen.add(t.startAt)
    return true
  })
})

/* --------------------------------------------------
   LOAD TIMELINES
-------------------------------------------------- */

async function loadTimelines() {
  if (!selectedDate.value || !props.serviceIds.length) return

  const requestKey = JSON.stringify({
    date: selectedDate.value,
    services: props.serviceIds,
    staff: props.preferredStaffMap
  })

  if (requestKey === lastRequestKey) return
  lastRequestKey = requestKey

  loading.value = true
  timelines.value = []

  try {
    const fn = httpsCallable(functions, 'findAvailableTimelines')

    const res = await fn({
      date: selectedDate.value,
      serviceIds: props.serviceIds,
      preferredStaffMap: props.preferredStaffMap
    })
    console.log('findAvailableTimelines result', res.data)
    const raw = Array.isArray(res.data) ? res.data : []
    timelines.value = raw
  } catch (err) {
    // console.error('findAvailableTimelines failed:', err)
    timelines.value = []
  } finally {
    loading.value = false
  }
}

/* --------------------------------------------------
   EVENTS
-------------------------------------------------- */

function onDateChange(e) {
  selectedDate.value = e.target.value
  timelines.value = []
  emit('update:modelValue', null)
  loadTimelines()
}

function selectTimeline(timeline) {
  if (!timeline?.segments?.length) return
  emit('update:modelValue', timeline)
}

/* --------------------------------------------------
   RESET WHEN CONTEXT CHANGES
-------------------------------------------------- */

watch(
  () =>
    JSON.stringify({
      services: props.serviceIds,
      staff: props.preferredStaffMap
    }),
  () => {
    selectedDate.value = null
    timelines.value = []
    lastRequestKey = ''
    emit('update:modelValue', null)
  }
)
</script>
