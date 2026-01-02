<template>
  <div class="space-y-6">
    <!-- Date -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1"> Select Date </label>
      <input
        type="date"
        v-model="selectedDate"
        :min="today"
        class="w-full border rounded-lg px-3 py-2"
      />
    </div>

    <!-- Loading -->
    <p v-if="loading" class="text-sm text-gray-500">Checking availability…</p>

    <!-- Slots -->
    <div v-if="!loading && slots.length">
      <label class="block text-sm font-medium text-gray-700 mb-3"> Select Time </label>

      <div class="grid grid-cols-4 sm:grid-cols-6 gap-3">
        <button
          v-for="slot in slots"
          :key="slot.startAt"
          @click="select(slot)"
          class="py-2 rounded-lg text-sm border transition"
          :class="
            modelValue?.startAt === slot.startAt
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white hover:border-indigo-500'
          "
        >
          {{ formatTime(slot.startAt) }}
        </button>
      </div>
    </div>

    <p v-if="!loading && selectedDate && !slots.length" class="text-sm text-gray-500">
      No slots available for this date.
    </p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { findAvailableSlots } from '@/services/firebase'

const props = defineProps({
  serviceIds: { type: Array, required: true },
  preferredStaffMap: { type: Object, required: true },
  modelValue: Object
})

const emit = defineEmits(['update:modelValue'])
let currentRequestId = 0
let lastFetchKey = ''
const selectedDate = ref(null)
const slots = ref([])
const loading = ref(false)

const today = new Date().toISOString().split('T')[0]

/* ---------------- Helpers ---------------- */

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/* ---------------- Slot Fetch ---------------- */

async function loadSlots() {
  if (!selectedDate.value || !props.serviceIds.length) return
  const fetchKey = JSON.stringify({
    date: selectedDate.value,
    services: props.serviceIds,
    staff: props.preferredStaffMap
  })

  // 🔒 Prevent unnecessary reloads
  if (fetchKey === lastFetchKey) return
  lastFetchKey = fetchKey
  const requestId = ++currentRequestId
  loading.value = true
  slots.value = []

  try {
    const [year, month, day] = selectedDate.value.split('-').map(Number)
    const localDate = new Date(year, month - 1, day, 0, 0, 0)

    const result = await findAvailableSlots({
      serviceIds: props.serviceIds,
      preferredStaffMap: props.preferredStaffMap,
      startAt: localDate.toISOString()
    })

    // 🔒 Ignore outdated responses
    if (requestId !== currentRequestId) return

    slots.value = result || []
  } catch (e) {
    console.error('Failed to load slots', e)
  } finally {
    if (requestId === currentRequestId) {
      loading.value = false
    }
  }
}
/* ---------------- Slot Selection ---------------- */
function select(slot) {
  emit('update:modelValue', {
    startAt: slot.startAt,
    endAt: slot.endAt
  })
}

watch(
  () => ({
    date: selectedDate.value,
    services: props.serviceIds.join(','),
    staff: JSON.stringify(props.preferredStaffMap)
  }),
  loadSlots
)
</script>
