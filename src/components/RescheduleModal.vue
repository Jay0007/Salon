<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl w-full max-w-md p-6">
      <h3 class="text-lg font-semibold mb-4">Reschedule Appointment</h3>

      <div class="space-y-4">
        <!-- Date -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">Date</label>
          <input type="date" v-model="date" class="w-full border rounded px-3 py-2" />
        </div>

        <!-- Time -->
        <div>
          <label class="block text-sm text-gray-600 mb-1">Start Time</label>
          <input type="time" v-model="time" class="w-full border rounded px-3 py-2" />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-4 mt-6">
        <button class="text-gray-600" @click="$emit('close')">Cancel</button>

        <button
          class="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
          :disabled="loading"
          @click="submit"
        >
          {{ loading ? 'Saving…' : 'Confirm' }}
        </button>
      </div>

      <p v-if="error" class="text-sm text-red-600 mt-3">
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  booking: Object
})

const emit = defineEmits(['close', 'confirm'])

const date = ref('')
const time = ref('')
const loading = ref(false)
const error = ref(null)

async function submit() {
  if (!date.value || !time.value) {
    error.value = 'Please select date and time'
    return
  }

  loading.value = true
  error.value = null

  const start = new Date(`${date.value}T${time.value}`)
  const duration = props.booking.totalDuration || 60
  const end = new Date(start.getTime() + duration * 60000)

  emit('confirm', {
    bookingId: props.booking.id,
    newStartAt: start,
    newEndAt: end
  })
}
</script>
