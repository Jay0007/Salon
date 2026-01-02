<template>
  <div class="space-y-6">
    <!-- Select Date -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1"> Select Date </label>
      <input
        type="date"
        v-model="selectedDate"
        :min="today"
        class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <!-- Loading -->
    <p v-if="loading" class="text-sm text-gray-500">Checking availability…</p>

    <!-- Time Slots -->
    <div v-if="!loading && slots.length">
      <label class="block text-sm font-medium text-gray-700 mb-3"> Select Time </label>

      <div class="grid grid-cols-4 sm:grid-cols-6 gap-3">
        <button
          v-for="slot in slots"
          :key="slot.startAt"
          @click="selectSlot(slot)"
          class="py-2 rounded-lg text-sm border transition"
          :class="
            selectedSlot?.startAt === slot.startAt
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white hover:border-indigo-500'
          "
        >
          {{ formatTime(slot.startAt) }}
        </button>
      </div>
    </div>

    <!-- No Slots -->
    <p v-if="!loading && selectedDate && !slots.length" class="text-sm text-gray-500">
      No slots available for this date.
    </p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { findAvailableSlots } from '@/services/firebase'

/* ---------------- Props / Emits ---------------- */

const props = defineProps({
  serviceIds: {
    type: Array,
    required: true
  },
  preferredStaffMap: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update'])

/* ---------------- State ---------------- */

const selectedDate = ref(null)
const slots = ref([])
const selectedSlot = ref(null)
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
  if (!selectedDate.value) return

  loading.value = true
  slots.value = []
  selectedSlot.value = null

  try {
    const dateISO = new Date(selectedDate.value).toISOString()

    const result = await findAvailableSlots({
      serviceIds: props.serviceIds,
      preferredStaffMap: props.preferredStaffMap,
      startAt: dateISO
    })

    slots.value = result || []
  } catch (err) {
    console.error('Failed to load slots', err)
    slots.value = []
  } finally {
    loading.value = false
  }
}

/* ---------------- Slot Selection ---------------- */

function selectSlot(slot) {
  selectedSlot.value = slot

  emit('update', {
    startAt: slot.startAt,
    endAt: slot.endAt
  })
}

/* ---------------- Watchers ---------------- */

watch(selectedDate, loadSlots)
watch(
  () => props.serviceIds,
  () => {
    slots.value = []
    selectedSlot.value = null
  }
)
watch(
  () => props.preferredStaffMap,
  () => {
    slots.value = []
    selectedSlot.value = null
  }
)
</script>
