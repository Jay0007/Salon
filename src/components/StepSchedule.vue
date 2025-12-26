<template>
  <div class="space-y-6">
    <!-- Date -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1"> Select Date </label>
      <input
        type="date"
        v-model="selectedDate"
        :min="today"
        class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <!-- Time Slots -->
    <div v-if="selectedDate">
      <label class="block text-sm font-medium text-gray-700 mb-3"> Select Start Time </label>

      <div class="grid grid-cols-4 sm:grid-cols-6 gap-3">
        <button
          v-for="slot in validSlots"
          :key="slot.label"
          :disabled="slot.disabled"
          @click="selectSlot(slot)"
          class="py-2 rounded-lg text-sm border transition"
          :class="[
            slot.disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : selectedTime === slot.label
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white hover:border-indigo-500'
          ]"
        >
          {{ slot.label }}
        </button>
      </div>
    </div>

    <!-- Summary -->
    <div v-if="selectedTime" class="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm">
      <p>
        <span class="font-medium">Start:</span>
        {{ formattedStart }}
      </p>
      <p>
        <span class="font-medium">End:</span>
        {{ formattedEnd }}
      </p>
      <p class="text-gray-600 mt-1">Duration: {{ duration }} minutes</p>
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: Object,
  duration: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedDate = ref('')
const selectedTime = ref('')
const error = ref('')

const today = new Date().toISOString().split('T')[0]

/**
 * Generate all slots (10:00 → 20:00)
 */
function generateSlots() {
  const slots = []
  for (let h = 10; h < 20; h++) {
    for (let m of [0, 15, 30, 45]) {
      slots.push({
        h,
        m,
        label: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      })
    }
  }
  return slots
}

/**
 * Filter slots:
 * - No past time
 * - Must fit duration before closing
 */
const validSlots = computed(() => {
  if (!selectedDate.value) return []

  const now = new Date()
  const slots = generateSlots()

  return slots.map((slot) => {
    const start = new Date(selectedDate.value)
    start.setHours(slot.h, slot.m, 0, 0)

    const end = new Date(start)
    end.setMinutes(end.getMinutes() + props.duration)

    const disabled =
      start < now || end.getHours() >= 20 || (end.getHours() === 20 && end.getMinutes() > 0)

    return {
      ...slot,
      disabled
    }
  })
})

function selectSlot(slot) {
  if (slot.disabled) return
  selectedTime.value = slot.label
}

/**
 * Emit start + end time
 */
watch([selectedDate, selectedTime], () => {
  if (!selectedDate.value || !selectedTime.value) return

  const [h, m] = selectedTime.value.split(':').map(Number)

  const start = new Date(selectedDate.value)
  start.setHours(h, m, 0, 0)

  const end = new Date(start)
  end.setMinutes(end.getMinutes() + props.duration)

  emit('update:modelValue', {
    startAt: start.toISOString(),
    endAt: end.toISOString()
  })

  error.value = ''
})

const formattedStart = computed(() =>
  new Date(`${selectedDate.value}T${selectedTime.value}`).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
)

const formattedEnd = computed(() => {
  if (!selectedDate.value || !selectedTime.value) return ''
  const [h, m] = selectedTime.value.split(':').map(Number)
  const d = new Date(selectedDate.value)
  d.setHours(h, m + props.duration, 0, 0)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})
</script>
