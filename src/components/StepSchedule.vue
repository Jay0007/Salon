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
              : selectedSlot?.label === slot.label
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white hover:border-indigo-500'
          ]"
        >
          {{ slot.label }}
        </button>
      </div>
    </div>

    <!-- Summary -->
    <div v-if="selectedSlot" class="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm">
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
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  duration: { type: Number, required: true }
})

const emit = defineEmits(['update'])

const selectedDate = ref(null)
const selectedSlot = ref(null)

const today = new Date().toISOString().split('T')[0]

function generateSlots() {
  const slots = []
  for (let h = 10; h < 20; h++) {
    for (let m of [0, 15, 30, 45]) {
      slots.push({ h, m })
    }
  }
  return slots
}

const validSlots = computed(() => {
  if (!selectedDate.value) return []

  const now = new Date()

  return generateSlots().map((s) => {
    const start = new Date(selectedDate.value)
    start.setHours(s.h, s.m, 0, 0)

    const end = new Date(start)
    end.setMinutes(end.getMinutes() + props.duration)

    const disabled = start < now || end.getHours() > 20

    return {
      label: `${String(s.h).padStart(2, '0')}:${String(s.m).padStart(2, '0')}`,
      start,
      end,
      disabled
    }
  })
})

function selectSlot(slot) {
  if (slot.disabled) return

  selectedSlot.value = slot

  emit('update', {
    startAt: slot.start.toISOString(),
    endAt: slot.end.toISOString()
  })
}

watch(selectedDate, () => {
  selectedSlot.value = null
})
</script>
