<template>
  <div>
    <h2 class="text-xl font-semibold mb-1 text-gray-800">Choose Date & Time</h2>
    <p class="text-sm text-gray-500 mb-5">Select your preferred appointment slot</p>

    <!-- DATE SELECTION -->
    <div class="mb-6">
      <h3 class="text-sm font-medium text-gray-600 mb-3">Select Date</h3>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          v-for="date in next7Days"
          :key="date.value"
          @click="selectDate(date.value)"
          :class="[
            'rounded-lg border p-3 text-left transition',
            selectedDate === date.value
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white hover:border-indigo-400'
          ]"
        >
          <p class="text-xs opacity-80">
            {{ date.label }}
          </p>
          <p class="font-semibold">
            {{ date.display }}
          </p>
        </button>
      </div>
    </div>

    <!-- TIME SELECTION -->
    <div>
      <h3 class="text-sm font-medium text-gray-600 mb-3">Available Time Slots</h3>

      <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
        <button
          v-for="slot in filteredTimeSlots"
          :key="slot.time"
          @click="selectTime(slot.time)"
          :disabled="slot.disabled"
          :class="[
            'rounded-lg border py-2 text-sm transition',
            slot.disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed '
              : selectedTime === slot.time
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white hover:border-indigo-400'
          ]"
        >
          {{ slot.label }}
        </button>
      </div>
    </div>

    <!-- SELECTION SUMMARY -->
    <div
      v-if="selectedDate && selectedTime"
      class="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-sm"
    >
      <strong>Appointment:</strong><br />
      {{ formattedSelection }}<br />
      <span class="text-gray-600"> Duration: {{ props.duration }} minutes </span>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, watch } from 'vue'
import { collection, query, where, getDocs, db } from '../services/firebase'
const props = defineProps({
  modelValue: Object,
  duration: {
    type: Number,
    required: true // total minutes
  }
})
const emit = defineEmits(['update:modelValue'])

const bookedSlots = ref([])

const selectedDate = ref(props.modelValue?.date || '')
const selectedTime = ref(props.modelValue?.time || '')

/* TIME CONFIG (EASY TO CHANGE LATER) */
const openingHour = 10
const closingHour = 20
const intervalMinutes = 15

/* DATE LIST */
const next7Days = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)

    const iso = d.toISOString().split('T')[0]

    return {
      value: iso,
      label:
        i === 0
          ? 'Today'
          : i === 1
            ? 'Tomorrow'
            : d.toLocaleDateString('en-US', { weekday: 'short' }),
      display: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  })
})

/* TIME SLOTS */
const filteredTimeSlots = computed(() => {
  if (!selectedDate.value || !props.duration) return []

  const now = new Date()
  const selected = new Date(selectedDate.value)
  const slots = []

  for (let h = openingHour; h <= closingHour; h++) {
    for (let m = 0; m < 60; m += intervalMinutes) {
      if (h === closingHour && m > 0) continue

      const start = new Date(selected)
      start.setHours(h, m, 0, 0)

      const end = new Date(start)
      end.setMinutes(end.getMinutes() + props.duration)

      const exceedsClosing =
        end.getHours() > closingHour || (end.getHours() === closingHour && end.getMinutes() > 0)

      const isPast = selected.toDateString() === now.toDateString() && start < now

      const isBooked = overlaps(start, end)

      slots.push({
        time: start.toTimeString().slice(0, 5),
        label: start.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        }),
        start,
        end,
        disabled: isPast || exceedsClosing || isBooked
      })
    }
  }

  return slots
})

function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })
}

function selectDate(date) {
  selectedDate.value = date
  selectedTime.value = ''
  emit('update:modelValue', {
    date: date,
    time: '',
    datetime: ''
  })
}

function selectTime(time) {
  selectedTime.value = time
}

/* EMIT CLEAN MODEL */

// watch([selectedDate, selectedTime], () => {
//   if (!selectedDate.value || !selectedTime.value) return

//   emit('update:modelValue', {
//     date: selectedDate.value,
//     startTime: `${selectedDate.value}T${selectedTime.value}:00`,
//     duration: props.duration
//   })
// })
watch(selectedDate, async (date) => {
  if (!date) return

  bookedSlots.value = []

  const q = query(
    collection(db, 'bookings'),
    where('bookingDate', '==', date),
    where('status', '==', 'confirmed')
  )

  const snap = await getDocs(q)

  snap.forEach((doc) => {
    bookedSlots.value.push({
      start: new Date(doc.data().startTime),
      end: new Date(doc.data().endTime)
    })
  })
})

function overlaps(start, end) {
  return bookedSlots.value.some((b) => start < b.end && end > b.start)
}

const formattedSelection = computed(() => {
  const start = new Date(`${selectedDate.value}T${selectedTime.value}`)
  const end = new Date(start)
  end.setMinutes(end.getMinutes() + props.duration)

  return `${start.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })} – ${end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })}`
})
</script>
