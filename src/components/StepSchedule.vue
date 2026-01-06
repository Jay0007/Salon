<template>
  <div class="space-y-5">
    <!-- DATE PICKER -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1"> Select Date </label>

      <input
        type="date"
        :min="today"
        :value="selectedDate || ''"
        @change="onDateChange"
        class="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <!-- LOADING -->
    <p v-if="loading" class="text-sm text-gray-500">Finding earliest available times…</p>

    <!-- TIMELINES -->
    <div v-if="!loading && timelines.length">
      <label class="block text-sm font-medium text-gray-700 mb-3"> Select Time </label>

      <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
        <button
          v-for="timeline in visibleTimelines"
          :key="timeline.startAt + timeline.endAt"
          @click="selectTimeline(timeline)"
          class="rounded-md border px-3 py-1.5 text-sm transition text-center"
          :class="
            selectedStart === timeline.startAt
              ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-300'
              : 'bg-white hover:border-indigo-400'
          "
        >
          {{ formatTime(timeline.startAt) }}
        </button>
      </div>
    </div>

    <!-- NO AVAILABILITY -->
    <p v-if="!loading && selectedDate && !timelines.length" class="text-sm text-gray-500">
      No available times for this date.
    </p>
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

const selectedStart = computed(() => props.modelValue?.startAt || null)

/* --------------------------------------------------
   HELPERS
-------------------------------------------------- */

function formatTime(value) {
  const d = new Date(value)
  if (isNaN(d)) return '--:--'
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  })
}

/**
 * LOCAL NOON → avoids timezone date shift
 */
function buildDateForBackend(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0).toISOString()
}

/**
 * 🔥 CRITICAL FIX
 * Normalize dates coming from Cloud Functions
 */
function normalizeTimeline(t) {
  return {
    ...t,
    startAt: new Date(t.startAt).toISOString(),
    endAt: new Date(t.endAt).toISOString(),
    segments: t.segments.map((s) => ({
      ...s,
      startAt: new Date(s.startAt).toISOString(),
      endAt: new Date(s.endAt).toISOString()
    }))
  }
}

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
      date: buildDateForBackend(selectedDate.value),
      serviceIds: props.serviceIds,
      preferredStaffMap: props.preferredStaffMap
    })

    const raw = Array.isArray(res.data) ? res.data : []
    timelines.value = raw.map(normalizeTimeline)
  } catch (err) {
    console.error('findAvailableTimelines failed:', err)
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
